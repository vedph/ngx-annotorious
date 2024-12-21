import {
  AfterViewInit,
  Directive,
  effect,
  ElementRef,
  input,
  model,
  OnDestroy,
  output,
} from '@angular/core';

import { DrawingTool, ImageAnnotation } from '@annotorious/annotorious';
import {
  AnnotoriousConfig,
  DEFAULT_ANNOTORIOUS_CONFIG,
} from '@myrmidon/ngx-annotorious';
import {
  createOSDAnnotator,
  OpenSeadragonAnnotator,
} from '@annotorious/openseadragon';
import OpenSeadragon from 'openseadragon';

// https://annotorious.dev/api-reference/openseadragon-annotator/

/**
 * Essential directive wrapping Recogito's Annotorious for OpenSeadragon.
 * Add as an attribute to a div wrapping your img element (osdImgAnnotator).
 */
@Directive({
  selector: '[osdImgAnnotator]',
})
export class OsdImgAnnotatorDirective implements AfterViewInit, OnDestroy {
  private _ann?: OpenSeadragonAnnotator;
  private _viewer?: OpenSeadragon.Viewer;
  private _imageElement?: HTMLImageElement;

  /**
   * The initial configuration for the annotator. Note that the image property
   * will be overridden with the img being decorated by this directive.
   */
  public readonly config = model<AnnotoriousConfig>();

  /**
   * The current drawing tool. The default available tools are rectangle and
   * polygon, but more can be available from plugins.
   */
  public readonly tool = input<DrawingTool>('rectangle');

  /**
   * The optional initial annotations to show on the image.
   */
  public readonly annotations = model<ImageAnnotation[]>([]);

  /**
   * The selected annotation. TODO: When set, the annotator
   * will highlight the annotation and open its editor.
   */
  public readonly selectedAnnotation = input<ImageAnnotation>();

  /**
   * The IDs of all the additional selection tools to be used
   * when the Annotorious Selector Pack plugin is loaded
   * (see https://github.com/recogito/annotorious-selector-pack).
   * Allowed values (besides 'rectangle', 'polygon'): 'point', 'circle',
   * 'ellipse', 'freehand'. Note that this requires to add the
   * plugins library to your app (@recogito/annotorious-selector-pack).
   */
  public readonly additionalTools = input<string[]>();

  /**
   * Fired when the annotator has been initialized. This is a way
   * for passing the annotator itself to the parent component.
   * The annotator is required in headless mode, so that your code
   * can replace the current selection by modifying the received
   * selection and calling annotator.updateSelected(selection, true).
   */
  public readonly annotatorInit = output<OpenSeadragonAnnotator>();

  // EVENT WRAPPERS
  // https://annotorious.dev/api-reference/events

  /**
   * Emitted when an annotation is clicked.
   * The handler receives the ImageAnnotation and the original pointer
   * event.
   */
  public readonly clickAnnotation = output<{
    annotation: ImageAnnotation;
    originalEvent: PointerEvent;
  }>();

  /**
   * Emitted when a new annotation is created.
   * The handler receives the created ImageAnnotation.
   */
  public readonly createAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when an annotation is deleted.
   * The handler receives the deleted ImageAnnotation.
   */
  public readonly deleteAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when mouse enters an annotation.
   * The handler receives the ImageAnnotation.
   */
  public readonly mouseEnterAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when mouse exits an annotation.
   * The handler receives the ImageAnnotation.
   */
  public readonly mouseLeaveAnnotation = output<ImageAnnotation>();

  /**
   * Emitted when selection changes.
   * The handler receives an array of ImageAnnotation's for future use,
   * but currently it's always an array with a single element, or
   * an empty array when no selection is made.
   */
  public readonly selectionChanged = output<ImageAnnotation | undefined>();

  /**
   * Emitted when an annotation is updated.
   * The handler receives the updated ImageAnnotation and the previous one.
   */
  public readonly updateAnnotation = output<{
    updated: ImageAnnotation;
    previous: ImageAnnotation;
  }>();

  /**
   * OSD only: emitted when the set of annotations visible in the current
   * viewport changes.
   * This event is only available on the OpenSeadragonAnnotator and will
   * respond to zooming and panning of the OpenSeadragon image.
   * The handler receives an array of ImageAnnotation's.
   */
  public readonly viewportIntersect = output<ImageAnnotation[]>();

  constructor(private _elementRef: ElementRef<HTMLElement>) {
    // when config changes, recreate annotator
    effect(() => {
      console.log('annotator config', this.config());
      this.destroyAnnotator();
      // setTimeout(() => {
      this.initAnnotator();
      // });
    });

    // when tool changes, select it in the annotator
    effect(() => {
      console.log('tool', this.tool());
      this._ann?.setDrawingTool(this.tool());
    });

    // when annotations are changed, update the annotator
    effect(() => {
      console.log('annotations', this.annotations());
      const annotations = this.annotations();
      // clear or set annotations
      if (!annotations?.length) {
        this._ann?.clearAnnotations();
      } else {
        this._ann?.setAnnotations(annotations);
      }
    });

    // when selected annotation changes, select it in the annotator
    effect(() => {
      console.log('selectedAnnotation', this.selectedAnnotation());
      this._ann?.setSelected(this.selectedAnnotation()?.id);
    });
  }

  private destroyAnnotator(): void {
    if (this._ann) {
      this._ann.destroy();
      this._ann = undefined;
    }
    if (this._viewer) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private async initAnnotator(): Promise<void> {
    const container = this._elementRef.nativeElement;
    this._imageElement = container.querySelector('img') || undefined;

    // hide the original img element as OSD will create its own canvas
    const imgElement = container.querySelector('img');
    if (imgElement) {
      imgElement.style.display = 'none';
    }
    this._imageElement = imgElement as HTMLImageElement;

    if (!this._imageElement) {
      console.error('No image element found');
      return;
    }

    // wait for the image to load to get its natural dimensions
    console.log('Starting image load check...');
    if (!this._imageElement.complete) {
      console.log('Image not loaded, waiting...');
      await new Promise((resolve) => {
        this._imageElement!.onload = resolve;
      });
    } else {
      console.log('Image already loaded');
    }

    console.log('Image dimensions:', {
      naturalWidth: this._imageElement.naturalWidth,
      naturalHeight: this._imageElement.naturalHeight,
    });

    // Clear any existing content and prepare container
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '500px'; // Fixed height instead of padding-based
    container.style.backgroundColor = '#f0f0f0';

    console.log('Creating OSD viewer...');

    // create viewer with proper configuration
    this._viewer = OpenSeadragon({
      element: container,
      tileSources: {
        type: 'image',
        url: this._imageElement.src,
        width: this._imageElement.naturalWidth,
        height: this._imageElement.naturalHeight,
      },
      debugMode: true, // Enable debug mode for better error reporting
      visibilityRatio: 1,
      constrainDuringPan: true,
      showNavigator: true,
      immediateRender: false,
      maxZoomPixelRatio: 10,
      minZoomImageRatio: 0.8,
      defaultZoomLevel: 0,
      prefixUrl: '/images/', // Make sure these images exist
      navigatorPosition: 'BOTTOM_RIGHT',
    });

    // add error handler
    this._viewer.addHandler('open-failed', (event) => {
      console.error('OSD open failed:', event);
    });

    console.log('Waiting for OSD to be ready...');
    // wait for OSD to be ready
    await new Promise<void>((resolve, reject) => {
      this._viewer!.addHandler('open', () => {
        console.log('OSD opened successfully');
        resolve();
      });

      // add timeout to prevent infinite wait
      setTimeout(() => {
        if (!this._viewer?.world.getItemCount()) {
          reject(new Error('OSD initialization timeout'));
        }
      }, 5000);
    });

    console.log('Creating annotator...');

    // create annotator
    this._ann = createOSDAnnotator(this._viewer, {
      drawingEnabled: true,
      // TODO add cfg
    });

    // initial annotations
    this._ann.setAnnotations(this.annotations() || []);

    // wrap events:
    // clickAnnotation
    this._ann.on(
      'clickAnnotation',
      (annotation: ImageAnnotation, originalEvent: PointerEvent) => {
        console.log('clickAnnotation', annotation, originalEvent);
        this.clickAnnotation.emit({ annotation, originalEvent });
      }
    );

    // createAnnotation
    this._ann.on('createAnnotation', (annotation: ImageAnnotation) => {
      console.log('createAnnotation', annotation);
      this.createAnnotation.emit(annotation);
    });
    // deleteAnnotation
    this._ann.on('deleteAnnotation', (annotation: ImageAnnotation) => {
      console.log('deleteAnnotation', annotation);
      this.deleteAnnotation.emit(annotation);
    });
    // mouseEnterAnnotation
    this._ann.on('mouseEnterAnnotation', (annotation: ImageAnnotation) => {
      console.log('mouseEnterAnnotation', annotation);
      this.mouseEnterAnnotation.emit(annotation);
    });
    // mouseLeaveAnnotation
    this._ann.on('mouseLeaveAnnotation', (annotation: ImageAnnotation) => {
      console.log('mouseLeaveAnnotation', annotation);
      this.mouseLeaveAnnotation.emit(annotation);
    });
    // selectionChanged
    this._ann.on('selectionChanged', (annotations: ImageAnnotation[]) => {
      console.log('selectionChanged', annotations);
      this.selectionChanged.emit(annotations[0]);
    });
    // updateAnnotation
    this._ann.on(
      'updateAnnotation',
      (updated: ImageAnnotation, previous: ImageAnnotation) => {
        console.log('updateAnnotation', updated, previous);
        this.updateAnnotation.emit({ updated, previous });
      }
    );
    // viewportIntersect
    this._ann.on('viewportIntersect', (annotations: ImageAnnotation[]) => {
      console.log('viewportIntersect', annotations);
      this.viewportIntersect.emit(annotations);
    });

    // emit the annotator on init completion
    this.annotatorInit.emit(this._ann);
  }

  public ngAfterViewInit() {
    this.initAnnotator();
  }

  public ngOnDestroy() {
    this.destroyAnnotator();
  }
}
