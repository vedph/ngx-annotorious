import { ImgAnnotationList, ListAnnotation } from './img-annotation-list';
import {
  createTestAnnotation,
  FakeAnnotator,
  FakeDialog,
  flushPromises,
} from '../../testing/fake-annotator';
import { GalleryImage } from '../../models';

class EditorStub {}

const IMAGE: GalleryImage = { id: '1', uri: 'sample.jpg', title: 'sample' };

function createListAnnotation(
  id: string,
  payload?: string,
  x = 10
): ListAnnotation<string> {
  return {
    id,
    image: IMAGE,
    value: createTestAnnotation(id, payload, x),
    payload,
  };
}

describe('ImgAnnotationList', () => {
  let annotator: FakeAnnotator;
  let dialog: FakeDialog;
  let list: ImgAnnotationList<string>;

  beforeEach(() => {
    annotator = new FakeAnnotator();
    dialog = new FakeDialog();
    list = new ImgAnnotationList<string>({
      annotator,
      editorComponent: EditorStub,
      dialog: dialog.asDialog(),
      dialogConfig: { width: '400px' },
      image: IMAGE,
    });
  });

  it('should start empty', () => {
    expect(list.annotations()).toEqual([]);
    expect(list.selectedAnnotation()).toBeNull();
    expect(list.selectedIndex()).toBe(-1);
    expect(list.editing()).toBe(false);
  });

  it('should subscribe to annotator events and unsubscribe on dispose', () => {
    for (const e of [
      'createAnnotation',
      'deleteAnnotation',
      'updateAnnotation',
      'selectionChanged',
    ]) {
      expect(annotator.handlerCount(e)).toBe(1);
    }
    list.dispose();
    expect(annotator.handlerCount('createAnnotation')).toBe(0);
    expect(annotator.handlerCount('selectionChanged')).toBe(0);
  });

  describe('setAnnotations', () => {
    it('should set annotations in list and annotator', () => {
      list.setAnnotations([
        createListAnnotation('a', 'A'),
        createListAnnotation('b', 'B'),
      ]);
      expect(list.annotations().map((a) => a.id)).toEqual(['a', 'b']);
      expect([...annotator.annotations.keys()]).toEqual(['a', 'b']);
    });

    it('should accept null and reset selection', () => {
      list.setAnnotations([createListAnnotation('a')]);
      list.selectAnnotationAt(0);
      list.setAnnotations(null);
      expect(list.annotations()).toEqual([]);
      expect(list.selectedAnnotation()).toBeNull();
      expect(annotator.annotations.size).toBe(0);
    });
  });

  it('clearAnnotations should clear list, annotator and selection', () => {
    list.setAnnotations([createListAnnotation('a')]);
    list.selectAnnotation('a');
    list.clearAnnotations();
    expect(list.annotations()).toEqual([]);
    expect(list.selectedAnnotation()).toBeNull();
    expect(annotator.annotations.size).toBe(0);
  });

  describe('selection', () => {
    beforeEach(() => {
      list.setAnnotations([
        createListAnnotation('a', 'A'),
        createListAnnotation('b', 'B'),
      ]);
    });

    it('selectAnnotation should select in list and annotator', () => {
      list.selectAnnotation(list.annotations()[1]);
      expect(list.selectedAnnotation()?.id).toBe('b');
      expect(list.selectedIndex()).toBe(1);
      expect(annotator.selected).toEqual(['b']);
    });

    it('selectAnnotation with unknown ID should deselect', () => {
      list.selectAnnotation('a');
      list.selectAnnotation('x');
      expect(list.selectedAnnotation()).toBeNull();
      expect(annotator.selected).toEqual([]);
    });

    it('selectAnnotationAt out of range should deselect', () => {
      list.selectAnnotationAt(0);
      list.selectAnnotationAt(5);
      expect(list.selectedAnnotation()).toBeNull();
      list.selectAnnotationAt(-1);
      expect(list.selectedAnnotation()).toBeNull();
    });

    it('should follow the annotator selection', () => {
      annotator.emit('selectionChanged', [list.annotations()[1].value]);
      expect(list.selectedAnnotation()?.id).toBe('b');
      annotator.emit('selectionChanged', []);
      expect(list.selectedAnnotation()).toBeNull();
    });

    it('should ignore annotator selection of unknown annotations', () => {
      annotator.emit('selectionChanged', [createTestAnnotation('x')]);
      expect(list.selectedAnnotation()).toBeNull();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      list.setAnnotations([
        createListAnnotation('a', 'A'),
        createListAnnotation('b', 'B'),
      ]);
    });

    it('removeAnnotation should remove from list and annotator', () => {
      list.selectAnnotation('a');
      list.removeAnnotation('a');
      expect(list.annotations().map((a) => a.id)).toEqual(['b']);
      expect(annotator.annotations.has('a')).toBe(false);
      expect(list.selectedAnnotation()).toBeNull();
    });

    it('removeAnnotationAt out of range should do nothing', () => {
      list.removeAnnotationAt(10);
      expect(list.annotations()).toHaveLength(2);
    });

    it('should remove when the annotator deletes', () => {
      list.selectAnnotation('b');
      annotator.emit('deleteAnnotation', list.annotations()[1].value);
      expect(list.annotations().map((a) => a.id)).toEqual(['a']);
      expect(list.selectedAnnotation()).toBeNull();
    });
  });

  it('should update the shape when the annotator updates', () => {
    list.setAnnotations([createListAnnotation('a', 'A', 10)]);
    const moved = createTestAnnotation('a', 'A', 50);
    annotator.emit('updateAnnotation', moved, list.annotations()[0].value);
    expect(list.annotations()[0].value).toBe(moved);
    // payload is preserved
    expect(list.annotations()[0].payload).toBe('A');
  });

  describe('create', () => {
    it('should open the editor and add the annotation when saved', async () => {
      const drawn = createTestAnnotation('n');
      annotator.draw(drawn);

      expect(list.editing()).toBe(true);
      expect(dialog.opened).toHaveLength(1);
      expect(dialog.opened[0].component).toBe(EditorStub);
      expect(dialog.opened[0].config.width).toBe('400px');
      const data = dialog.lastData as ListAnnotation<string>;
      expect(data.id).toBe('n');
      expect(data.image).toEqual(IMAGE);
      // the editor gets a copy
      expect(data.value).not.toBe(drawn);
      expect(data.value).toEqual(drawn);

      dialog.close({ ...data, payload: 'new' });
      await flushPromises();

      expect(list.editing()).toBe(false);
      expect(list.annotations()).toHaveLength(1);
      expect(list.annotations()[0].payload).toBe('new');
      expect(list.selectedAnnotation()?.id).toBe('n');
      expect(annotator.annotations.has('n')).toBe(true);
    });

    it('should remove the drawn shape when cancelled', async () => {
      annotator.draw(createTestAnnotation('n'));
      dialog.close(undefined);
      await flushPromises();

      expect(list.annotations()).toEqual([]);
      expect(annotator.annotations.has('n')).toBe(false);
      expect(list.editing()).toBe(false);
    });

    it('should ignore selection changes while editing', async () => {
      list.setAnnotations([createListAnnotation('a')]);
      list.selectAnnotation('a');
      annotator.draw(createTestAnnotation('n'));
      annotator.emit('selectionChanged', []);
      expect(list.selectedAnnotation()?.id).toBe('a');
      dialog.close();
      await flushPromises();
    });
  });

  describe('edit', () => {
    beforeEach(() => {
      list.setAnnotations([
        createListAnnotation('a', 'A'),
        createListAnnotation('b', 'B'),
      ]);
    });

    it('editAnnotationAt should save the edited payload', async () => {
      const result = list.editAnnotationAt(1);
      const data = dialog.lastData as ListAnnotation<string>;
      expect(data.payload).toBe('B');

      dialog.close({ ...data, payload: 'B2' });
      expect(await result).toBe(true);
      expect(list.annotations()[1].payload).toBe('B2');
      expect(list.annotations().map((a) => a.id)).toEqual(['a', 'b']);
    });

    it('should keep the current annotator geometry when saving', async () => {
      // the user moved the shape without the list being notified
      const moved = createTestAnnotation('a', 'A', 99);
      annotator.annotations.set('a', moved);

      const result = list.editAnnotation('a');
      const data = dialog.lastData as ListAnnotation<string>;
      dialog.close({ ...data, payload: 'A2' });
      await result;

      const saved = list.annotations()[0];
      expect(saved.value.target).toEqual(moved.target);
      expect(annotator.annotations.get('a')!.target).toEqual(moved.target);
    });

    it('should not save when cancelled', async () => {
      const result = list.editAnnotationAt(0);
      dialog.close();
      expect(await result).toBe(false);
      expect(list.annotations()[0].payload).toBe('A');
    });

    it('should not open a second editor while editing', async () => {
      const first = list.editAnnotationAt(0);
      expect(await list.editAnnotationAt(1)).toBe(false);
      expect(dialog.opened).toHaveLength(1);
      dialog.close();
      await first;
    });

    it('should return false for unknown annotations', async () => {
      expect(await list.editAnnotation('x')).toBe(false);
      expect(await list.editAnnotationAt(9)).toBe(false);
      expect(dialog.opened).toHaveLength(0);
    });
  });

  it('attach should bind to a new annotator and push annotations', () => {
    list.setAnnotations([createListAnnotation('a')]);
    const other = new FakeAnnotator();
    list.attach(other);

    expect(list.annotator).toBe(other);
    expect(annotator.handlerCount('createAnnotation')).toBe(0);
    expect(other.handlerCount('createAnnotation')).toBe(1);
    expect([...other.annotations.keys()]).toEqual(['a']);
  });

  it('image should be updatable', async () => {
    const image: GalleryImage = { id: '2', uri: 'b.jpg', title: 'b' };
    list.image.set(image);
    annotator.draw(createTestAnnotation('n'));
    expect((dialog.lastData as ListAnnotation<string>).image).toEqual(image);
    dialog.close();
    await flushPromises();
  });
});
