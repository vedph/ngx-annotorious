import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  createImageAnnotator,
  DrawingTool,
  ImageAnnotation,
  ImageAnnotator,
} from '@annotorious/annotorious';

import {
  AnnotationClickEvent,
  AnnotationUpdateEvent,
  AnnotoriousConfig,
  areAnnotationsEqual,
  DEFAULT_ANNOTORIOUS_CONFIG,
} from '../models';
import { bindAnnotatorEvents } from '../annotator-events';

// https://annotorious.dev/api-reference/image-annotator/

/**
 * Directive wrapping an Annotorious image annotator around an `img` element.
 *
 * The annotator is created as soon as the image is loaded (its natural size
 * is required to map annotation coordinates), and it is recreated when:
 * - the `config` input changes;
 * - a new image with a different natural size is loaded into the `img`
 *   (e.g. when its `src` changes).
 *
 * Each time an annotator is created, it is published via the `annotator`
 * signal and the `annotatorInit` output. Use `exportAs` to get the
 * directive instance in your template, e.g.
 * `<img imgAnnotator #ann="imgAnnotator" ...>` and `ann.annotator()`.
 */
@Directive({
  selector: 'img[imgAnnotator]',
  exportAs: 'imgAnnotator',
  host: {
    '(load)': 'onImageLoad()',
  },
})
export class ImgAnnotatorDirective {
  private readonly _img: HTMLImageElement =
    inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  // natural size of the image when the annotator was created
  private _size?: { width: number; height: number };
  // incremented whenever a (new) loaded image requires an annotator;
  // 0 means that the image is not yet loaded
  private readonly _imageKey = signal(0);
  private readonly _annotator = signal<ImageAnnotator | undefined>(undefined);
  private _unbind?: () => void;

  /**
   * The Annotorious configuration. When it changes, the annotator is
   * recreated. When not set, `DEFAULT_ANNOTORIOUS_CONFIG` is used.
   */
  public readonly config = input<AnnotoriousConfig | undefined>();

  /**
   * The current drawing tool. Annotorious provides `rectangle` and `polygon`;
   * more tools can be registered via plugins in `annotatorInit`.
   */
  public readonly tool = input<DrawingTool>('rectangle');

  /**
   * Whether drawing is enabled. When undefined, the value from the
   * configuration is used.
   */
  public readonly drawingEnabled = input<boolean | undefined>();

  /**
   * The annotations to show on the image. When this changes, the annotator's
   * annotations are replaced with these (unless they are equal). Leave
   * undefined if annotations are managed by other means, e.g. by an
   * `ImgAnnotationList`.
   */
  public readonly annotations = input<ImageAnnotation[] | undefined>();

  /**
   * The annotation (or annotation ID) to select, or null/undefined to
   * leave the selection unchanged.
   */
  public readonly selectedAnnotation = input<
    ImageAnnotation | string | null | undefined
  >();

  /**
   * The current annotator, if any.
   */
  public readonly annotator = this._annotator.asReadonly();

  /**
   * Emitted whenever a new annotator has been created. Use it to get the
   * annotator instance, e.g. to pass it to an annotations list, or to
   * register plugins.
   */
  public readonly annotatorInit = output<ImageAnnotator>();

  // EVENT WRAPPERS
  // https://annotorious.dev/api-reference/events

  /**
   * Emitted when an annotation is clicked.
   */
  public readonly clickAnnotation = output<AnnotationClickEvent>();

  /**
   * Emitted when a new annotation is created by the user.
   */
  public readonly createAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when an annotation is deleted by the user.
   */
  public readonly deleteAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when the mouse enters an annotation.
   */
  public readonly mouseEnterAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when the mouse leaves an annotation.
   */
  public readonly mouseLeaveAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when the selection changes. The payload is the first selected
   * annotation, or undefined when nothing is selected.
   */
  public readonly selectionChanged = output<ImageAnnotation | undefined>();

  /**
   * Emitted when an annotation is updated by the user.
   */
  public readonly updateAnnotation = output<AnnotationUpdateEvent>();

  constructor() {
    // the image may already be loaded at first render
    afterNextRender(() => {
      if (!this._imageKey() && this.isImageLoaded()) {
        this._imageKey.set(1);
      }
    });

    // (re)create the annotator when the image is ready or config changes
    effect(() => {
      const key = this._imageKey();
      const config = this.config();
      if (!key) {
        return;
      }
      untracked(() => this.createAnnotator(config));
    });

    // tool
    effect(() => {
      const ann = this._annotator();
      const tool = this.tool();
      if (ann && tool) {
        try {
          ann.setDrawingTool(tool);
        } catch (error) {
          console.warn(`Annotorious: cannot set drawing tool "${tool}"`, error);
        }
      }
    });

    // drawing enabled
    effect(() => {
      const ann = this._annotator();
      const enabled = this.drawingEnabled();
      if (ann && enabled !== undefined) {
        ann.setDrawingEnabled(enabled);
      }
    });

    // annotations
    effect(() => {
      const ann = this._annotator();
      const annotations = this.annotations();
      if (ann && annotations) {
        untracked(() => {
          if (!areAnnotationsEqual(ann.getAnnotations(), annotations)) {
            ann.setAnnotations(annotations, true);
          }
        });
      }
    });

    // selection
    effect(() => {
      const ann = this._annotator();
      const selected = this.selectedAnnotation();
      if (ann && selected) {
        const id = typeof selected === 'string' ? selected : selected.id;
        if (ann.getAnnotationById(id)) {
          ann.setSelected(id);
        }
      }
    });

    inject(DestroyRef).onDestroy(() => this.destroyAnnotator());
  }

  private isImageLoaded(): boolean {
    return this._img.complete && this._img.naturalWidth > 0;
  }

  /**
   * Handle the host image load event.
   */
  public onImageLoad(): void {
    if (!this.isImageLoaded()) {
      return;
    }
    const { naturalWidth: width, naturalHeight: height } = this._img;
    // recreate only if no annotator yet or the image size changed,
    // as Annotorious maps coordinates on the image natural size
    if (
      !this._size ||
      this._size.width !== width ||
      this._size.height !== height
    ) {
      this._imageKey.update((n) => n + 1);
    }
  }

  private createAnnotator(config?: AnnotoriousConfig): void {
    this.destroyAnnotator();

    // never pass a frozen object to Annotorious
    const opts: AnnotoriousConfig = {
      ...DEFAULT_ANNOTORIOUS_CONFIG,
      ...(config || {}),
    };
    let ann: ImageAnnotator;
    try {
      ann = createImageAnnotator(this._img, opts);
    } catch (error) {
      console.error('Annotorious: error creating annotator', error);
      return;
    }
    this._size = {
      width: this._img.naturalWidth,
      height: this._img.naturalHeight,
    };

    this._unbind = bindAnnotatorEvents(ann, {
      clickAnnotation: (annotation, originalEvent) =>
        this.clickAnnotation.emit({ annotation, originalEvent }),
      createAnnotation: (annotation) => this.createAnnotation.emit(annotation),
      deleteAnnotation: (annotation) => this.deleteAnnotation.emit(annotation),
      mouseEnterAnnotation: (annotation) =>
        this.mouseEnterAnnotation.emit(annotation),
      mouseLeaveAnnotation: (annotation) =>
        this.mouseLeaveAnnotation.emit(annotation),
      selectionChanged: (annotations) =>
        this.selectionChanged.emit(annotations?.[0]),
      updateAnnotation: (updated, previous) =>
        this.updateAnnotation.emit({ updated, previous }),
    });

    this._annotator.set(ann);
    this.annotatorInit.emit(ann);
  }

  /**
   * Destroy the annotator, restoring the DOM as it was before its creation.
   * Annotorious wraps the img into its own container, and restores it on
   * destroy; but Angular might have already detached the img (and/or its
   * container) when destroying a view: in this case we must ensure that the
   * img does not get reinserted in the DOM.
   */
  private destroyAnnotator(): void {
    const ann = this._annotator();
    if (!ann) {
      return;
    }
    this._unbind?.();
    this._unbind = undefined;
    this._annotator.set(undefined);
    this._size = undefined;

    const wrapper = ann.element;
    const imgDetached = !!wrapper && this._img.parentNode !== wrapper;
    if (wrapper) {
      if (imgDetached) {
        wrapper.appendChild(this._img);
      }
      // Annotorious requires the wrapper to have a parent
      if (!wrapper.parentNode) {
        document.createDocumentFragment().appendChild(wrapper);
      }
    }
    try {
      ann.destroy();
    } catch (error) {
      console.warn('Annotorious: error destroying annotator', error);
    }
    if (imgDetached) {
      this._img.remove();
    }
  }
}
