import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';

import { ImageAnnotation, ImageAnnotator } from '@annotorious/annotorious';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import {
  AnnotoriousConfig,
  ImgAnnotationList,
  ImgAnnotatorToolbarComponent,
  ImgAnnotatorDirective,
  DEFAULT_ANNOTORIOUS_CONFIG,
  GalleryImage,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';
import { MyImgAnnotationListComponent } from '../img-annotation-list/my-img-annotation-list.component';
import { EditAnnotationDialogComponent } from '../edit-annotation-dialog/edit-annotation-dialog.component';

@Component({
  selector: 'app-img-annotation',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    ImgAnnotatorDirective,
    ImgAnnotatorToolbarComponent,
    MyImgAnnotationListComponent,
  ],
  templateUrl: './img-annotation-pg.component.html',
  styleUrl: './img-annotation-pg.component.scss',
})
export class ImgAnnotationPgComponent {
  // the list core used by the annotations list child component
  private _list?: ImgAnnotationList<any>;

  // the Annotorious annotator instance derived from the annotator directive
  public annotator?: ImageAnnotator;

  // the annotation editor component type, used by the annotations list child
  // component to create a new editor instance inside a popup dialog
  public readonly editor = EditAnnotationDialogComponent;

  // the configuration provided to the annotator directive
  public config?: AnnotoriousConfig = DEFAULT_ANNOTORIOUS_CONFIG;

  public tool: string;
  public image: GalleryImage;

  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DEFAULT_OPTIONS) public dlgConfig: MatDialogConfig
  ) {
    this.tool = 'rectangle';
    this.image = {
      id: '1',
      uri: 'sample.jpg',
      title: 'sample',
      description: 'Sample image',
    };
  }

  public onToolChange(tool: string): void {
    this.tool = tool;
  }

  public onListInit(list: ImgAnnotationList<any>) {
    this._list = list;
  }

  public onAnnotatorInit(annotator: any) {
    setTimeout(() => {
      this.annotator = annotator;
    });
  }

  public onSelectionChanged(annotation?: ImageAnnotation) {
    this._list?.onSelectionChange(annotation);
  }

  public editAnnotation(annotation: ImageAnnotation): void {
    this._list?.editAnnotation(annotation);
  }

  public selectAnnotation(index: number): void {
    this._list?.selectAnnotationAt(index);
  }

  public removeAnnotation(index: number): void {
    this._list?.removeAnnotationAt(index);
  }

  public onCreateAnnotation(annotation: ImageAnnotation) {
    this._list?.onCreateAnnotation(annotation);
  }

  public onClickAnnotation(event: {
    annotation: ImageAnnotation;
    originalEvent: PointerEvent;
  }) {
    console.log('Clicked annotation:', event);
    // this._list?.editAnnotation(event.annotation);
  }

  public onDeleteAnnotation(annotation: ImageAnnotation) {
    this._list?.onDeleteAnnotation(annotation);
  }

  public clearAnnotations(): void {
    this._list?.clearAnnotations();
  }
}
