import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';

import { GalleryImage } from '../../models';
import {
  ImgAnnotationList,
  ListAnnotation,
  ListAnnotator,
} from './img-annotation-list';

/**
 * The default function used to summarize a list annotation: this is the
 * value of its first body, or its ID.
 */
export function defaultAnnotationToString(
  annotation: ListAnnotation<unknown>
): string | null {
  return annotation?.value?.bodies?.[0]?.value || annotation?.id || null;
}

/**
 * Base for image annotations list components. Derive your component from
 * this, and bind its `annotator`, `editorComponent` and `image` inputs.
 * The inner `ImgAnnotationList` is created as soon as both the annotator
 * and the editor component are available; if the annotator is later
 * replaced, the same list is attached to the new one, so that its
 * annotations are preserved.
 *
 * Your template can use the `annotations`, `selectedAnnotation` and
 * `selectedIndex` signals, and the protected action methods.
 */
@Directive()
export abstract class ImgAnnotationListComponent<T> {
  private readonly _list = signal<ImgAnnotationList<T> | undefined>(undefined);

  protected readonly dialog = inject(MatDialog);
  protected readonly dialogConfig: MatDialogConfig =
    inject(MAT_DIALOG_DEFAULT_OPTIONS, { optional: true }) || {};

  /**
   * The annotator as received from Annotorious (e.g. via the
   * `annotatorInit` event or the `annotator` signal of the directive).
   */
  public readonly annotator = input<ListAnnotator | null | undefined>();

  /**
   * The component used to edit a `ListAnnotation` in a dialog.
   * Pass the component class, e.g. `[editorComponent]="MyEditorComponent"`.
   */
  public readonly editorComponent = input<ComponentType<unknown> | undefined>();

  /**
   * The image being annotated.
   */
  public readonly image = input<GalleryImage | null | undefined>();

  /**
   * The function used to build a string from a list annotation,
   * summarizing its content.
   */
  public readonly annotationToString = input<
    (annotation: ListAnnotation<T>) => string | null
  >(defaultAnnotationToString);

  /**
   * Emitted when the inner list is created.
   */
  public readonly listInit = output<ImgAnnotationList<T>>();

  /**
   * The annotations list empowering this component.
   */
  public readonly list = this._list.asReadonly();

  /**
   * The annotations in the list.
   */
  public readonly annotations = computed(
    () => this._list()?.annotations() || []
  );

  /**
   * The selected annotation, if any.
   */
  public readonly selectedAnnotation = computed(
    () => this._list()?.selectedAnnotation() || null
  );

  /**
   * The index of the selected annotation, or -1.
   */
  public readonly selectedIndex = computed(
    () => this._list()?.selectedIndex() ?? -1
  );

  constructor() {
    // create the list or attach it to a new annotator
    effect(() => {
      const annotator = this.annotator();
      const editor = this.editorComponent();
      if (!annotator || !editor) {
        return;
      }
      untracked(() => {
        const list = this._list();
        if (list) {
          list.editorComponent = editor;
          list.attach(annotator);
          return;
        }
        const created = new ImgAnnotationList<T>({
          annotator,
          editorComponent: editor,
          dialog: this.dialog,
          dialogConfig: this.dialogConfig,
          image: this.image() || undefined,
        });
        this._list.set(created);
        this.listInit.emit(created);
      });
    });

    // keep the list image in synch
    effect(() => {
      const image = this.image() || undefined;
      untracked(() => this._list()?.image.set(image));
    });

    inject(DestroyRef).onDestroy(() => this._list()?.dispose());
  }

  /**
   * Select the specified annotation, or deselect it if it is already
   * selected.
   */
  protected toggleSelection(annotation: ListAnnotation<T>): void {
    const list = this._list();
    if (!list) {
      return;
    }
    if (list.selectedAnnotation()?.id === annotation.id) {
      list.deselectAnnotation();
    } else {
      list.selectAnnotation(annotation);
    }
  }

  protected selectAnnotationAt(index: number): void {
    this._list()?.selectAnnotationAt(index);
  }

  protected editAnnotationAt(index: number): Promise<boolean> {
    return this._list()?.editAnnotationAt(index) || Promise.resolve(false);
  }

  protected removeAnnotationAt(index: number): void {
    this._list()?.removeAnnotationAt(index);
  }
}
