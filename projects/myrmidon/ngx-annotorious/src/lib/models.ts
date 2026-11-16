import { AnnotoriousOpts, ImageAnnotation } from '@annotorious/annotorious';

/**
 * Essential metadata for a gallery image to annotate. You can derive
 * your own model from this one.
 */
export interface GalleryImage {
  id: string;
  uri: string;
  title: string;
  description?: string;
}

/**
 * Configuration for the Annotorious image annotator. This is the full set
 * of Annotorious options (see https://annotorious.dev/api-reference/image-annotator/),
 * e.g. `autoSave`, `drawingEnabled`, `drawingMode`, `userSelectAction`,
 * `style`, `theme`, `modalSelect`, `disableUndoRedoKeys`.
 */
export type AnnotoriousConfig = AnnotoriousOpts<ImageAnnotation, ImageAnnotation>;

/**
 * Default configuration for the annotator directives. This object is frozen:
 * spread it to derive your own configuration.
 */
export const DEFAULT_ANNOTORIOUS_CONFIG: Readonly<AnnotoriousConfig> =
  Object.freeze({
    autoSave: false,
    drawingEnabled: true,
    drawingMode: 'drag',
  });

/**
 * Payload of the annotator click event.
 */
export interface AnnotationClickEvent {
  annotation: ImageAnnotation;
  originalEvent: PointerEvent;
}

/**
 * Payload of the annotator update event.
 */
export interface AnnotationUpdateEvent {
  updated: ImageAnnotation;
  previous: ImageAnnotation;
}

/**
 * Compare two sets of annotations by value. This is used to avoid pushing
 * into the annotator annotations equal to those it already has.
 * @param a The first set.
 * @param b The second set.
 * @returns True if equal.
 */
export function areAnnotationsEqual(
  a: readonly ImageAnnotation[] | undefined | null,
  b: readonly ImageAnnotation[] | undefined | null
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
