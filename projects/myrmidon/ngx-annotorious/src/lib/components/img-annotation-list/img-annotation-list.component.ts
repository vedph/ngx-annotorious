import { Directive, effect, Inject, input, output } from '@angular/core';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';

import { GalleryImage } from '../../directives/img-annotator.directive';
import { ImgAnnotationList, ListAnnotation } from './img-annotation-list';

/**
 * Base for image annotations list components. Derive your component from
 * this, wiring its input annotator, editorComponent and image properties.
 * The inner list core is lazily instantiated when these properties are set.
 */
@Directive({ standalone: true })
export abstract class ImgAnnotationListComponent<T> {
  private _list?: ImgAnnotationList<T>;

  /**
   * The annotations list empowering this component.
   */
  public get list(): ImgAnnotationList<T> | undefined {
    return this._list;
  }

  /**
   * The annotator object as received from Annotorious.
   */
  public readonly annotator = input.required<any>();

  /**
   * The component used to edit a ListAnnotation. Pass the component
   * class, e.g. [editorComponent]="MyEditorComponent".
   */
  public readonly editorComponent = input.required<any>();

  /**
   * The image to be annotated.
   */
  public readonly image = input.required<GalleryImage>();

  /**
   * The function used to build a string from a list annotation object,
   * summarizing its content appropriately.
   */
  public readonly annotationToString = input<
    (object: ListAnnotation<any>) => string | null
  >((a: ListAnnotation<any>) => {
    return a.value.bodies?.length ? a.value.bodies[0].value || null : a.id;
  });

  /**
   * Emitted when the list is initialized.
   */
  public readonly listInit = output<ImgAnnotationList<T>>();

  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DEFAULT_OPTIONS) public dlgConfig: MatDialogConfig
  ) {
    // when annotator or editor component or image change, init list
    effect(() => {
      this.initList(this.annotator(), this.editorComponent(), this.image());
    });
  }

  protected initList(annotator: any, editor: any, image?: GalleryImage): void {
    if (annotator && editor) {
      this._list = new ImgAnnotationList(
        annotator,
        editor,
        this.dialog,
        this.dlgConfig
      );
      this._list.image = image;
      console.log('list init', this._list);
      this.listInit.emit(this._list);
    }
  }
}
