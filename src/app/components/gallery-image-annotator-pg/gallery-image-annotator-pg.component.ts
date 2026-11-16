import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  GalleryImage,
  ImgAnnotationList,
  ImgAnnotatorDirective,
  ImgAnnotatorToolbarComponent,
  ListAnnotation,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';
import {
  GalleryFilterEntry,
  GalleryListComponent,
  GalleryOptionsService,
  IMAGE_GALLERY_SERVICE_KEY,
} from '../../../../projects/myrmidon/cadmus-img-gallery/src/public-api';
import { EditAnnotationDialogComponent } from '../edit-annotation-dialog/edit-annotation-dialog.component';
import { MyImgAnnotationListComponent } from '../img-annotation-list/my-img-annotation-list.component';

/**
 * Sample gallery image annotator: pick an image from the gallery,
 * and annotate it.
 */
@Component({
  selector: 'app-gallery-image-annotator-pg',
  templateUrl: './gallery-image-annotator-pg.component.html',
  styleUrl: './gallery-image-annotator-pg.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    MatTooltipModule,
    ImgAnnotatorDirective,
    ImgAnnotatorToolbarComponent,
    GalleryListComponent,
    MyImgAnnotationListComponent,
  ],
})
export class GalleryImageAnnotatorPgComponent {
  private readonly _galleryService = inject(IMAGE_GALLERY_SERVICE_KEY);
  private readonly _options = inject(GalleryOptionsService);

  // mock filter entries
  protected readonly entries: GalleryFilterEntry[] = [
    { id: 'title', value: 'title' },
    { id: 'dsc', value: 'description' },
  ];
  protected readonly editor = EditAnnotationDialogComponent;
  protected readonly tool = signal('rectangle');
  protected readonly tabIndex = signal(1);
  protected readonly image = signal<GalleryImage | undefined>(undefined);
  protected readonly list = signal<ImgAnnotationList<string> | undefined>(
    undefined
  );
  protected readonly jsonError = signal<string | null>(null);

  // JSON dump form
  protected readonly dump = signal({ json: '', frozen: false });
  protected readonly dumpForm = form(this.dump);

  constructor() {
    // dump annotations unless frozen
    effect(() => {
      const annotations = this.list()?.annotations() || [];
      untracked(() => {
        if (!this.dump().frozen) {
          this.dump.update((d) => ({
            ...d,
            json: JSON.stringify(annotations, null, 2),
          }));
        }
      });
    });
  }

  protected async onImagePick(picked: GalleryImage): Promise<void> {
    // get the single image as we need the target size
    const image = await firstValueFrom(
      this._galleryService.getImage(picked.id, this._options.get())
    );
    if (!image) {
      return;
    }
    if (image.uri !== this.image()?.uri) {
      this.list()?.clearAnnotations();
    }
    this.image.set(image);
    this.tabIndex.set(0);
  }

  protected setAnnotations(event?: Event): void {
    event?.preventDefault();
    try {
      const annotations = JSON.parse(
        this.dump().json || '[]'
      ) as ListAnnotation<string>[];
      if (!Array.isArray(annotations)) {
        throw new Error('expected an array of annotations');
      }
      this.jsonError.set(null);
      this.list()?.setAnnotations(annotations);
    } catch (error) {
      this.jsonError.set(error instanceof Error ? error.message : `${error}`);
    }
  }
}
