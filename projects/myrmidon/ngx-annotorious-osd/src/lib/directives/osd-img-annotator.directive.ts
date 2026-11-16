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

import { DrawingTool, ImageAnnotation } from '@annotorious/annotorious';
import {
  AnnotoriousOSDOpts,
  createOSDAnnotator,
  OpenSeadragonAnnotator,
} from '@annotorious/openseadragon';
import OpenSeadragon from 'openseadragon';

import {
  AnnotationClickEvent,
  AnnotationUpdateEvent,
  areAnnotationsEqual,
  bindAnnotatorEvents,
  DEFAULT_ANNOTORIOUS_CONFIG,
} from '@myrmidon/ngx-annotorious';

// https://annotorious.dev/api-reference/openseadragon-annotator/

/**
 * Configuration for the OpenSeadragon annotator.
 */
export type OsdAnnotoriousConfig = AnnotoriousOSDOpts<
  ImageAnnotation,
  ImageAnnotation
>;

/**
 * Default OpenSeadragon viewer options used by the directive.
 */
export const DEFAULT_OSD_VIEWER_OPTIONS: Readonly<OpenSeadragon.Options> =
  Object.freeze({
    visibilityRatio: 1,
    constrainDuringPan: true,
    showNavigator: true,
    navigatorPosition: 'BOTTOM_RIGHT',
    maxZoomPixelRatio: 10,
    minZoomImageRatio: 0.8,
    prefixUrl: '/images/',
    gestureSettingsMouse: {
      // click to zoom interferes with annotation
      clickToZoom: false,
      scrollToZoom: true,
      dblClickToZoom: true,
    },
  });

/**
 * Directive wrapping Annotorious for OpenSeadragon. Add it to a container
 * element: the image source is either the `source` input, or the `src` of
 * the first `img` child (which gets hidden). The container gets its height
 * from the `height` input.
 */
@Directive({
  selector: '[osdImgAnnotator]',
  exportAs: 'osdImgAnnotator',
  host: {
    '[style.display]': '"block"',
    '[style.position]': '"relative"',
    '[style.height]': 'height()',
    '[style.background-color]': '"var(--mat-sys-surface-container)"',
  },
})
export class OsdImgAnnotatorDirective {
  private readonly _host: HTMLElement =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly _ready = signal(false);
  private readonly _annotator = signal<OpenSeadragonAnnotator | undefined>(
    undefined
  );
  private _viewer?: OpenSeadragon.Viewer;
  private _unbind?: () => void;
  // incremented at each (re)creation, to discard stale async inits
  private _generation = 0;

  /**
   * The Annotorious configuration. When it changes, the annotator is
   * recreated.
   */
  public readonly config = input<OsdAnnotoriousConfig | undefined>();

  /**
   * Additional OpenSeadragon viewer options, merged with
   * `DEFAULT_OSD_VIEWER_OPTIONS`.
   */
  public readonly viewerOptions = input<OpenSeadragon.Options | undefined>();

  /**
   * The image URI or OSD tile source. When not set, the `src` of the
   * first child `img` element is used.
   */
  public readonly source = input<string | object | undefined>();

  /**
   * The CSS height of the viewer container.
   */
  public readonly height = input<string>('500px');

  /**
   * The current drawing tool.
   */
  public readonly tool = input<DrawingTool>('rectangle');

  /**
   * Whether drawing is enabled. When undefined, the value from the
   * configuration is used.
   */
  public readonly drawingEnabled = input<boolean | undefined>();

  /**
   * The annotations to show. When this changes, the annotator's annotations
   * are replaced with these (unless they are equal).
   */
  public readonly annotations = input<ImageAnnotation[] | undefined>();

  /**
   * The annotation (or annotation ID) to select.
   */
  public readonly selectedAnnotation = input<
    ImageAnnotation | string | null | undefined
  >();

  /**
   * The current annotator, if any.
   */
  public readonly annotator = this._annotator.asReadonly();

  /**
   * Emitted whenever a new annotator has been created.
   */
  public readonly annotatorInit = output<OpenSeadragonAnnotator>();

  public readonly clickAnnotation = output<AnnotationClickEvent>();
  public readonly createAnnotation = output<ImageAnnotation>();
  public readonly deleteAnnotation = output<ImageAnnotation>();
  public readonly mouseEnterAnnotation = output<ImageAnnotation>();
  public readonly mouseLeaveAnnotation = output<ImageAnnotation>();
  public readonly selectionChanged = output<ImageAnnotation | undefined>();
  public readonly updateAnnotation = output<AnnotationUpdateEvent>();

  /**
   * Emitted when the set of annotations visible in the viewport changes.
   */
  public readonly viewportIntersect = output<ImageAnnotation[]>();

  constructor() {
    afterNextRender(() => this._ready.set(true));

    effect(() => {
      if (!this._ready()) {
        return;
      }
      const config = this.config();
      const viewerOptions = this.viewerOptions();
      const source = this.source();
      untracked(() => void this.init(config, viewerOptions, source));
    });

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

    effect(() => {
      const ann = this._annotator();
      const enabled = this.drawingEnabled();
      if (ann && enabled !== undefined) {
        ann.setDrawingEnabled(enabled);
      }
    });

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

    inject(DestroyRef).onDestroy(() => {
      this._generation++;
      this.destroy();
    });
  }

  private destroy(): void {
    this._unbind?.();
    this._unbind = undefined;
    const ann = this._annotator();
    this._annotator.set(undefined);
    try {
      ann?.destroy();
    } catch (error) {
      console.warn('Annotorious: error destroying OSD annotator', error);
    }
    try {
      this._viewer?.destroy();
    } catch (error) {
      console.warn('OpenSeadragon: error destroying viewer', error);
    }
    this._viewer = undefined;
  }

  private async getTileSource(
    source?: string | object
  ): Promise<string | object | null> {
    if (source) {
      return source;
    }
    const img = this._host.querySelector('img');
    if (!img) {
      return null;
    }
    img.style.display = 'none';
    if (!img.complete || !img.naturalWidth) {
      await new Promise<void>((resolve, reject) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(new Error('image error')), {
          once: true,
        });
      });
    }
    return {
      type: 'image',
      url: img.currentSrc || img.src,
      buildPyramid: false,
    };
  }

  private async init(
    config?: OsdAnnotoriousConfig,
    viewerOptions?: OpenSeadragon.Options,
    source?: string | object
  ): Promise<void> {
    const generation = ++this._generation;
    this.destroy();

    let tileSource: string | object | null;
    try {
      tileSource = await this.getTileSource(source);
    } catch (error) {
      console.error('OSD annotator: cannot load image', error);
      return;
    }
    if (generation !== this._generation) {
      return;
    }
    if (!tileSource) {
      console.error('OSD annotator: no image source');
      return;
    }

    const viewer = OpenSeadragon({
      ...DEFAULT_OSD_VIEWER_OPTIONS,
      ...(viewerOptions || {}),
      element: this._host,
      tileSources: tileSource as any,
    });
    this._viewer = viewer;

    const ann = createOSDAnnotator<ImageAnnotation, ImageAnnotation>(viewer, {
      ...DEFAULT_ANNOTORIOUS_CONFIG,
      ...(config || {}),
    });

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
      viewportIntersect: (annotations) =>
        this.viewportIntersect.emit(annotations),
    });

    this._annotator.set(ann);
    this.annotatorInit.emit(ann);
  }
}
