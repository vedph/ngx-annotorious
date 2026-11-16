import { MatDialog } from '@angular/material/dialog';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { BasicImgAnnotationListComponent } from './basic-img-annotation-list.component';
import { ImgAnnotationList, ListAnnotation } from '../img-annotation-list/img-annotation-list';
import {
  createTestAnnotation,
  FakeAnnotator,
  FakeDialog,
} from '../../testing/fake-annotator';
import { GalleryImage } from '../../models';

class EditorStub {}

const IMAGE: GalleryImage = { id: '1', uri: 'sample.jpg', title: 'sample' };

function item(id: string, text: string): ListAnnotation<string> {
  return {
    id,
    image: IMAGE,
    value: createTestAnnotation(id, text),
    payload: text,
  };
}

async function setup(inputs: Record<string, unknown> = {}) {
  const annotator = new FakeAnnotator();
  const dialog = new FakeDialog();
  const listInit = vi.fn();
  const result = await render(BasicImgAnnotationListComponent<string>, {
    inputs: {
      annotator,
      editorComponent: EditorStub,
      image: IMAGE,
      ...inputs,
    },
    on: { listInit },
    providers: [{ provide: MatDialog, useValue: dialog }],
  });
  const list = listInit.mock.calls[0]?.[0] as ImgAnnotationList<string>;
  return { ...result, annotator, dialog, listInit, list };
}

describe('BasicImgAnnotationListComponent', () => {
  it('should create the list and show the empty message', async () => {
    const { listInit, list } = await setup();
    expect(listInit).toHaveBeenCalledTimes(1);
    expect(list).toBeInstanceOf(ImgAnnotationList);
    expect(screen.getByText(/no annotations/i)).toBeTruthy();
  });

  it('should not create the list without an annotator', async () => {
    const { listInit } = await setup({ annotator: undefined });
    expect(listInit).not.toHaveBeenCalled();
  });

  it('should render the annotations', async () => {
    const { list, fixture } = await setup({ showIds: true });
    list.setAnnotations([item('a', 'alpha'), item('b', 'beta')]);
    await fixture.whenStable();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('alpha')).toBeTruthy();
    expect(within(items[1]).getByText('b')).toBeTruthy();
  });

  it('should use the annotationToString input', async () => {
    const { list, fixture } = await setup({
      annotationToString: (a: ListAnnotation<string>) =>
        `#${a.payload?.toUpperCase()}`,
    });
    list.setAnnotations([item('a', 'alpha')]);
    await fixture.whenStable();
    expect(screen.getByText('#ALPHA')).toBeTruthy();
  });

  it('should toggle selection when clicking an annotation', async () => {
    const { list, fixture, annotator } = await setup();
    list.setAnnotations([item('a', 'alpha'), item('b', 'beta')]);
    await fixture.whenStable();

    const button = screen.getByRole('button', { name: /beta/ });
    await userEvent.click(button);
    expect(list.selectedAnnotation()?.id).toBe('b');
    expect(annotator.selected).toEqual(['b']);
    expect(button.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(button);
    expect(list.selectedAnnotation()).toBeNull();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('should reflect selection made in the annotator', async () => {
    const { list, fixture, annotator } = await setup();
    list.setAnnotations([item('a', 'alpha')]);
    await fixture.whenStable();

    annotator.emit('selectionChanged', [list.annotations()[0].value]);
    await fixture.whenStable();
    expect(
      screen.getByRole('button', { name: /alpha/ }).getAttribute('aria-pressed')
    ).toBe('true');
  });

  it('should remove an annotation', async () => {
    const { list, fixture, annotator } = await setup();
    list.setAnnotations([item('a', 'alpha'), item('b', 'beta')]);
    await fixture.whenStable();

    const buttons = screen.getAllByRole('button', { name: 'remove annotation' });
    await userEvent.click(buttons[0]);
    await fixture.whenStable();

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText('alpha')).toBeNull();
    expect(annotator.annotations.has('a')).toBe(false);
  });

  it('should open the editor to edit an annotation', async () => {
    const { list, fixture, dialog } = await setup();
    list.setAnnotations([item('a', 'alpha')]);
    await fixture.whenStable();

    await userEvent.click(
      screen.getByRole('button', { name: 'edit annotation' })
    );
    expect(dialog.opened).toHaveLength(1);
    expect(dialog.opened[0].component).toBe(EditorStub);

    dialog.close({ ...dialog.lastData, payload: 'gamma' });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    expect(list.annotations()[0].payload).toBe('gamma');
  });

  it('should attach the same list to a new annotator', async () => {
    const { list, fixture, listInit, rerender, annotator } = await setup();
    list.setAnnotations([item('a', 'alpha')]);
    await fixture.whenStable();

    const other = new FakeAnnotator();
    await rerender({ inputs: { annotator: other }, partialUpdate: true });
    await fixture.whenStable();

    expect(listInit).toHaveBeenCalledTimes(1);
    expect(list.annotator).toBe(other);
    expect(annotator.handlerCount('createAnnotation')).toBe(0);
    expect(other.annotations.has('a')).toBe(true);
    expect(screen.getByText('alpha')).toBeTruthy();
  });

  it('should update the list image when the image input changes', async () => {
    const { list, fixture, rerender } = await setup();
    const image: GalleryImage = { id: '2', uri: 'b.jpg', title: 'b' };
    await rerender({ inputs: { image }, partialUpdate: true });
    await fixture.whenStable();
    expect(list.image()).toEqual(image);
  });

  it('should dispose the list on destroy', async () => {
    const { fixture, annotator } = await setup();
    expect(annotator.handlerCount('createAnnotation')).toBe(1);
    fixture.destroy();
    expect(annotator.handlerCount('createAnnotation')).toBe(0);
  });
});
