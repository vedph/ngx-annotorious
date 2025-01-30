import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Component,
  effect,
  Inject,
  model,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription, take } from 'rxjs';

import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { ImageAnnotation } from '@annotorious/annotorious';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import {
  GalleryImage,
  ImgAnnotationList,
  ImgAnnotatorDirective,
  ImgAnnotatorToolbarComponent,
  ListAnnotation,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';
import {
  GalleryListComponent,
  GalleryOptionsService,
  GalleryService,
  IMAGE_GALLERY_SERVICE_KEY,
} from '../../../../projects/myrmidon/cadmus-img-gallery/src/public-api';
import { EditAnnotationDialogComponent } from '../edit-annotation-dialog/edit-annotation-dialog.component';
import { MyImgAnnotationListComponent } from '../img-annotation-list/my-img-annotation-list.component';

/**
 * Sample image annotation payload: this just contains a note.
 */
export interface MyAnnotationPayload {
  note: string;
}

/**
 * Sample gallery.
 */
@Component({
  selector: 'app-gallery-image-annotator-pg',
  templateUrl: './gallery-image-annotator-pg.component.html',
  styleUrls: ['./gallery-image-annotator-pg.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    ImgAnnotatorDirective,
    ImgAnnotatorToolbarComponent,
    GalleryListComponent,
    MyImgAnnotationListComponent,
  ],
})
export class GalleryImageAnnotatorPgComponent implements OnInit, OnDestroy {
  private _sub?: Subscription;
  private _list?: ImgAnnotationList<MyAnnotationPayload>;
  private _dropNextInput?: boolean;

  public entries: ThesaurusEntry[];
  public annotator?: any;
  public editorComponent = EditAnnotationDialogComponent;
  public tool: string = 'rectangle';
  public tabIndex: number = 0;
  // dump
  public json: FormControl<string | null>;
  public frozen: FormControl<boolean>;
  public form: FormGroup;

  /**
   * The gallery image to annotate.
   */
  public readonly image = model<GalleryImage>();

  /**
   * The annotations being edited.
   */
  public readonly annotations = model<ListAnnotation<MyAnnotationPayload>[]>(
    []
  );

  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DEFAULT_OPTIONS) public dlgConfig: MatDialogConfig,
    @Inject(IMAGE_GALLERY_SERVICE_KEY)
    private _galleryService: GalleryService,
    private _options: GalleryOptionsService,
    formBuilder: FormBuilder
  ) {
    // mock filter entries
    this.entries = [
      {
        id: 'title',
        value: 'title',
      },
      {
        id: 'dsc',
        value: 'description',
      },
    ];
    // form
    this.json = formBuilder.control(null, Validators.required);
    this.frozen = formBuilder.control(false, { nonNullable: true });
    this.form = formBuilder.group({
      json: this.json,
      frozen: this.frozen,
    });

    effect(() => {
      this.onGalleryImageSet(this.image());
    });

    effect(() => {
      if (this._dropNextInput) {
        this._dropNextInput = false;
        return;
      }
      const annotations = this.annotations();
      console.log('Annotations changed', annotations);
      this._list?.setAnnotations(annotations);
    });
  }

  private onGalleryImageSet(image?: GalleryImage): void {
    // reset annotations if image URI changed
    if (this.image()?.uri !== image?.uri) {
      this._list?.clearAnnotations();
    }
    // switch to image tab
    setTimeout(() => {
      this.tabIndex = image ? 0 : 1;
    });
  }

  public ngOnInit(): void {
    if (!this.image()) {
      this.tabIndex = 1;
    }
  }

  public ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }

  public onToolChange(tool: string): void {
    this.tool = tool;
  }

  public onAnnotatorInit(annotator: any) {
    setTimeout(() => {
      this.annotator = annotator;
    });
  }

  public onListInit(list: ImgAnnotationList<MyAnnotationPayload>) {
    this._list = list;

    // emit annotations whenever they change
    this._sub?.unsubscribe();
    this._sub = this._list.annotations$.subscribe((annotations) => {
      if (this.image()) {
        this._dropNextInput = true;
        this.annotations.set(annotations);
        if (!this.frozen.value) {
          this.json.setValue(JSON.stringify(annotations, null, 2));
        }
      }
    });
  }

  public setAnnotations(): void {
    if (this.form.invalid) {
      return;
    }
    const annotations = JSON.parse(this.json.value || '[]');
    this._list?.setAnnotations(annotations);
  }

  public onSelectionChange(annotation?: ImageAnnotation) {
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

  public onDeleteAnnotation(annotation: ImageAnnotation) {
    this._list?.onDeleteAnnotation(annotation);
  }

  public onImagePick(image: GalleryImage): void {
    // get the single image as we need the "full" size
    // const options = { ...this._options, width: 600, height: 800 };

    this._galleryService
      .getImage(image.id, this._options.get())
      .pipe(take(1))
      .subscribe((image) => {
        console.log('Image picked', image);
        this.image.set(image!);
      });
    this.tabIndex = 1;
  }
}
