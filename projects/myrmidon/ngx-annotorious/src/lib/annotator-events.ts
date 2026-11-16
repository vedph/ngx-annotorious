import type {
  Annotator,
  ImageAnnotation,
  LifecycleEvents,
} from '@annotorious/annotorious';

/**
 * Handlers for the Annotorious lifecycle events. Each handler is optional.
 */
export type AnnotatorEventHandlers = Partial<LifecycleEvents<ImageAnnotation>>;

/**
 * Subscribe the specified handlers to the events of an Annotorious annotator.
 * @param annotator The annotator.
 * @param handlers The handlers.
 * @returns A function which unsubscribes all the handlers.
 */
export function bindAnnotatorEvents(
  annotator: Pick<Annotator<any, ImageAnnotation>, 'on' | 'off'>,
  handlers: AnnotatorEventHandlers
): () => void {
  const entries = Object.entries(handlers).filter(([, h]) => !!h) as [
    keyof LifecycleEvents<ImageAnnotation>,
    any
  ][];
  for (const [event, handler] of entries) {
    annotator.on(event, handler);
  }
  return () => {
    for (const [event, handler] of entries) {
      try {
        annotator.off(event, handler);
      } catch {
        // annotator already destroyed
      }
    }
  };
}
