import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  BasicImgAnnotationListComponent,
  GalleryImage,
  ImgAnnotationList,
  ImgAnnotatorToolbarComponent,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';
import { OsdImgAnnotatorDirective } from '../../../../projects/myrmidon/ngx-annotorious-osd/src/public-api';
import { EditAnnotationDialogComponent } from '../edit-annotation-dialog/edit-annotation-dialog.component';

@Component({
  selector: 'app-osd-img-annotation-pg',
  templateUrl: './osd-img-annotation-pg.component.html',
  styleUrl: './osd-img-annotation-pg.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    OsdImgAnnotatorDirective,
    ImgAnnotatorToolbarComponent,
    BasicImgAnnotationListComponent,
  ],
})
export class OsdImgAnnotationPgComponent {
  protected readonly editor = EditAnnotationDialogComponent;
  protected readonly image: GalleryImage = {
    id: '1',
    uri: 'canyon.jpg',
    title: 'canyon',
    description: 'Sample image',
  };
  protected readonly tool = signal('rectangle');
  // in OSD, when drawing is disabled the mouse pans/zooms the image
  protected readonly drawingEnabled = signal(true);
  protected readonly list = signal<ImgAnnotationList<string> | undefined>(
    undefined
  );

  protected clearAnnotations(): void {
    this.list()?.clearAnnotations();
  }
}
