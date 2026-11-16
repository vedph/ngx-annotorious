import { bindAnnotatorEvents } from './annotator-events';
import { createTestAnnotation, FakeAnnotator } from './testing/fake-annotator';

describe('bindAnnotatorEvents', () => {
  it('should bind only the specified handlers and unbind them', () => {
    const annotator = new FakeAnnotator();
    const create = vi.fn();
    const select = vi.fn();
    const unbind = bindAnnotatorEvents(annotator, {
      createAnnotation: create,
      selectionChanged: select,
      deleteAnnotation: undefined,
    });
    expect(annotator.handlerCount('createAnnotation')).toBe(1);
    expect(annotator.handlerCount('deleteAnnotation')).toBe(0);

    const a = createTestAnnotation('a');
    annotator.emit('createAnnotation', a);
    annotator.emit('selectionChanged', [a]);
    expect(create).toHaveBeenCalledWith(a);
    expect(select).toHaveBeenCalledWith([a]);

    unbind();
    annotator.emit('createAnnotation', a);
    expect(create).toHaveBeenCalledTimes(1);
    expect(annotator.handlerCount('selectionChanged')).toBe(0);
  });

  it('should not throw when off fails', () => {
    const unbind = bindAnnotatorEvents(
      {
        on: () => undefined,
        off: () => {
          throw new Error('destroyed');
        },
      },
      { createAnnotation: () => undefined }
    );
    expect(() => unbind()).not.toThrow();
  });
});
