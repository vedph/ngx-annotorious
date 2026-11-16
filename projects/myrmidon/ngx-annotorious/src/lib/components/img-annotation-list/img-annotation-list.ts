import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { ImageAnnotation, ImageAnnotator } from '@annotorious/annotorious';

import { GalleryImage } from '../../models';
import { bindAnnotatorEvents } from '../../annotator-events';

/**
 * An annotation included in a list. Each Annotorious annotation (`value`)
 * is paired with custom payload data, edited in a dialog using as content
 * the component specified by the list `editorComponent`.
 */
export interface ListAnnotation<T> {
  id: string;
  image: GalleryImage;
  value: ImageAnnotation;
  payload?: T;
}

/**
 * The annotator API surface used by `ImgAnnotationList`.
 */
export type ListAnnotator = Pick<
  ImageAnnotator,
  | 'on'
  | 'off'
  | 'setAnnotations'
  | 'clearAnnotations'
  | 'removeAnnotation'
  | 'updateAnnotation'
  | 'getAnnotationById'
  | 'setSelected'
  | 'cancelSelected'
>;

/**
 * Options for creating an `ImgAnnotationList`.
 */
export interface ImgAnnotationListOptions {
  /**
   * The Annotorious annotator.
   */
  annotator: ListAnnotator;
  /**
   * The component used as the content of the dialog editing a list
   * annotation. It receives a `ListAnnotation<T>` as its dialog data,
   * and must close the dialog returning the edited `ListAnnotation<T>`,
   * or nothing to cancel.
   */
  editorComponent: ComponentType<unknown>;
  /**
   * The Material dialog service.
   */
  dialog: MatDialog;
  /**
   * The optional base configuration for the editor dialog.
   */
  dialogConfig?: MatDialogConfig;
  /**
   * The image being annotated.
   */
  image?: GalleryImage;
}

const EMPTY_IMAGE: GalleryImage = Object.freeze({ id: '', uri: '', title: '' });

/**
 * A list of image annotations. This list empowers an image annotations list
 * component by maintaining a list of annotation/payload pairs, where the
 * payload type is defined by T.
 *
 * The list subscribes to the annotator events, so that it is automatically
 * kept in synch with the user's actions on the image: when a shape is drawn,
 * the editor dialog is opened to edit its payload (and the shape is removed
 * if the user cancels); when a shape is moved, resized or deleted, the list
 * is updated accordingly; the selection is synchronized in both directions.
 *
 * All the state is exposed via read-only signals. Call `dispose` when
 * the list is no longer used, to unsubscribe from the annotator events.
 */
export class ImgAnnotationList<T> {
  private readonly _annotations = signal<ListAnnotation<T>[]>([]);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _editing = signal(false);
  private _annotator: ListAnnotator;
  private _unbind?: () => void;

  /**
   * The component used to edit list annotations.
   */
  public editorComponent: ComponentType<unknown>;

  /**
   * The Material dialog service.
   */
  public readonly dialog: MatDialog;

  /**
   * The base configuration for the editor dialog.
   */
  public dialogConfig: MatDialogConfig;

  /**
   * The image being annotated.
   */
  public readonly image: WritableSignal<GalleryImage | undefined>;

  /**
   * The annotations in this list.
   */
  public readonly annotations: Signal<ListAnnotation<T>[]> =
    this._annotations.asReadonly();

  /**
   * The selected annotation, if any.
   */
  public readonly selectedAnnotation: Signal<ListAnnotation<T> | null> =
    computed(() => {
      const id = this._selectedId();
      return id ? this._annotations().find((a) => a.id === id) || null : null;
    });

  /**
   * The index of the selected annotation, or -1.
   */
  public readonly selectedIndex: Signal<number> = computed(() => {
    const id = this._selectedId();
    return id ? this._annotations().findIndex((a) => a.id === id) : -1;
  });

  /**
   * True while an annotation is being edited in the dialog.
   */
  public readonly editing: Signal<boolean> = this._editing.asReadonly();

  /**
   * The annotator this list is bound to.
   */
  public get annotator(): ListAnnotator {
    return this._annotator;
  }

  constructor(options: ImgAnnotationListOptions) {
    this._annotator = options.annotator;
    this.editorComponent = options.editorComponent;
    this.dialog = options.dialog;
    this.dialogConfig = options.dialogConfig || {};
    this.image = signal(options.image);
    this.bind();
  }

  private bind(): void {
    this._unbind = bindAnnotatorEvents(this._annotator, {
      createAnnotation: (a) => void this.handleCreate(a),
      deleteAnnotation: (a) => this.handleDelete(a),
      updateAnnotation: (a) => this.handleUpdate(a),
      selectionChanged: (a) => this.handleSelectionChange(a?.[0]),
    });
  }

  /**
   * Bind this list to another annotator, e.g. when the annotator has been
   * recreated. The list annotations are pushed into the new annotator.
   * @param annotator The new annotator.
   */
  public attach(annotator: ListAnnotator): void {
    if (annotator === this._annotator) {
      return;
    }
    this._unbind?.();
    this._annotator = annotator;
    this._selectedId.set(null);
    this.bind();
    annotator.setAnnotations(
      this._annotations().map((a) => a.value),
      true
    );
  }

  /**
   * Unsubscribe from the annotator events.
   */
  public dispose(): void {
    this._unbind?.();
    this._unbind = undefined;
  }

  /**
   * Get the annotations.
   * @returns The annotations in this list.
   */
  public getAnnotations(): ListAnnotation<T>[] {
    return this._annotations();
  }

  /**
   * Remove all the annotations.
   */
  public clearAnnotations(): void {
    this._selectedId.set(null);
    this._annotations.set([]);
    this._annotator.clearAnnotations();
  }

  /**
   * Set the annotations, replacing the existing ones.
   * @param annotations The annotations to set.
   */
  public setAnnotations(annotations: ListAnnotation<T>[] | null | undefined): void {
    const list = [...(annotations || [])];
    this._selectedId.set(null);
    this._annotations.set(list);
    this._annotator.setAnnotations(
      list.map((a) => a.value),
      true
    );
  }

  /**
   * Remove the annotation with the specified ID.
   * @param id The annotation ID.
   */
  public removeAnnotation(id: string): void {
    if (this._selectedId() === id) {
      this._selectedId.set(null);
    }
    this._annotator.removeAnnotation(id);
    this._annotations.update((list) => list.filter((a) => a.id !== id));
  }

  /**
   * Remove the annotation at the specified index.
   * @param index The annotation index.
   */
  public removeAnnotationAt(index: number): void {
    const annotation = this._annotations()[index];
    if (annotation) {
      this.removeAnnotation(annotation.id);
    }
  }

  /**
   * Select the specified annotation, or deselect if null/undefined.
   * @param annotation The annotation or its ID.
   * @param editable True to make the selected shape editable.
   */
  public selectAnnotation(
    annotation?: ListAnnotation<T> | string | null,
    editable = true
  ): void {
    const id = typeof annotation === 'string' ? annotation : annotation?.id;
    if (!id || !this._annotations().some((a) => a.id === id)) {
      this.deselectAnnotation();
      return;
    }
    this._selectedId.set(id);
    this._annotator.setSelected(id, editable);
  }

  /**
   * Select the annotation at the specified index, or deselect if -1
   * or out of range.
   * @param index The annotation index.
   * @param editable True to make the selected shape editable.
   */
  public selectAnnotationAt(index: number, editable = true): void {
    this.selectAnnotation(this._annotations()[index], editable);
  }

  /**
   * Deselect the selected annotation if any.
   */
  public deselectAnnotation(): void {
    this._selectedId.set(null);
    this._annotator.cancelSelected();
  }

  /**
   * Edit the specified annotation in the editor dialog.
   * @param annotation The annotation to edit, or its ID.
   * @returns Promise resolving to true if saved, false if cancelled.
   */
  public editAnnotation(
    annotation: ImageAnnotation | ListAnnotation<T> | string
  ): Promise<boolean> {
    const id = typeof annotation === 'string' ? annotation : annotation.id;
    const existing = this._annotations().find((a) => a.id === id);
    if (!existing) {
      return Promise.resolve(false);
    }
    return this.editAndSave(existing, false);
  }

  /**
   * Edit the annotation at the specified index.
   * @param index The annotation index.
   * @returns Promise resolving to true if saved, false if cancelled.
   */
  public editAnnotationAt(index: number): Promise<boolean> {
    const annotation = this._annotations()[index];
    return annotation
      ? this.editAndSave(annotation, false)
      : Promise.resolve(false);
  }

  private async openEditor(
    annotation: ListAnnotation<T>
  ): Promise<ListAnnotation<T> | null> {
    this._editing.set(true);
    try {
      // the editor gets a copy, so that it can freely mutate it
      const data: ListAnnotation<T> = structuredCloneSafe(annotation);
      const dialogRef = this.dialog.open(this.editorComponent, {
        ...this.dialogConfig,
        data,
      });
      const edited = await firstValueFrom(dialogRef.afterClosed(), {
        defaultValue: undefined,
      });
      return (edited as ListAnnotation<T> | undefined) || null;
    } finally {
      this._editing.set(false);
    }
  }

  private async editAndSave(
    annotation: ListAnnotation<T>,
    isNew: boolean
  ): Promise<boolean> {
    if (this._editing()) {
      return false;
    }
    const edited = await this.openEditor(annotation);
    if (!edited) {
      return false;
    }
    this.saveAnnotation(edited, isNew);
    return true;
  }

  /**
   * Save the specified list annotation.
   * @param annotation The annotation.
   * @param isNew True if the annotation is new.
   */
  private saveAnnotation(annotation: ListAnnotation<T>, isNew: boolean): void {
    // the shape is owned by Annotorious: keep its current target,
    // which might have changed while the editor was open
    const current = this._annotator.getAnnotationById(annotation.id);
    const value: ImageAnnotation = current
      ? { ...annotation.value, id: annotation.id, target: current.target }
      : { ...annotation.value, id: annotation.id };
    const saved: ListAnnotation<T> = { ...annotation, value };

    if (current) {
      this._annotator.updateAnnotation(value);
    } else {
      this._annotator.setAnnotations([value], false);
    }

    const list = this._annotations();
    const i = list.findIndex((a) => a.id === saved.id);
    if (i === -1) {
      this._annotations.set([...list, saved]);
    } else {
      this._annotations.set(list.map((a, j) => (j === i ? saved : a)));
    }
    if (isNew) {
      this._selectedId.set(saved.id);
    }
  }

  // #region Annotorious event handlers
  private async handleCreate(annotation: ImageAnnotation): Promise<void> {
    // a new annotation while editing cannot be handled: drop it
    if (this._editing()) {
      this._annotator.removeAnnotation(annotation.id);
      return;
    }
    const saved = await this.editAndSave(
      {
        id: annotation.id,
        image: this.image() || EMPTY_IMAGE,
        value: annotation,
      },
      true
    );
    if (!saved) {
      this._annotator.removeAnnotation(annotation.id);
    }
  }

  private handleUpdate(annotation: ImageAnnotation): void {
    const list = this._annotations();
    const i = list.findIndex((a) => a.id === annotation.id);
    if (i > -1) {
      this._annotations.set(
        list.map((a, j) => (j === i ? { ...a, value: annotation } : a))
      );
    }
  }

  private handleSelectionChange(annotation?: ImageAnnotation): void {
    // while editing, keep the current selection
    if (this._editing()) {
      return;
    }
    this._selectedId.set(
      annotation && this._annotations().some((a) => a.id === annotation.id)
        ? annotation.id
        : null
    );
  }

  private handleDelete(annotation: ImageAnnotation): void {
    if (this._selectedId() === annotation.id) {
      this._selectedId.set(null);
    }
    this._annotations.update((list) =>
      list.filter((a) => a.id !== annotation.id)
    );
  }
  // #endregion
}

function structuredCloneSafe<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}
