import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  AnnotationClickEvent,
  BasicImgAnnotationListComponent,
  GalleryImage,
  ImgAnnotationList,
  ImgAnnotatorDirective,
  ImgAnnotatorToolbarComponent,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';
import { EditAnnotationDialogComponent } from '../edit-annotation-dialog/edit-annotation-dialog.component';

@Component({
  selector: 'app-img-annotation-pg',
  templateUrl: './img-annotation-pg.component.html',
  styleUrl: './img-annotation-pg.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    ImgAnnotatorDirective,
    ImgAnnotatorToolbarComponent,
    BasicImgAnnotationListComponent,
  ],
})
export class ImgAnnotationPgComponent {
  // the annotation editor component type, used by the annotations list
  // to edit each annotation inside a dialog
  protected readonly editor = EditAnnotationDialogComponent;

  protected readonly image: GalleryImage = {
    id: '1',
    uri: 'sample.jpg',
    title: 'sample',
    description: 'Sample image',
  };

  protected readonly tool = signal('rectangle');
  protected readonly drawingEnabled = signal(true);
  protected readonly list = signal<ImgAnnotationList<string> | undefined>(
    undefined
  );
  protected readonly lastClick = signal<string | null>(null);

  protected onClickAnnotation(event: AnnotationClickEvent): void {
    this.lastClick.set(event.annotation.id);
  }

  protected clearAnnotations(): void {
    this.list()?.clearAnnotations();
  }
}
