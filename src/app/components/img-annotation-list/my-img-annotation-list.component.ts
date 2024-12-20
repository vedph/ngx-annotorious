import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ImgAnnotationListComponent,
  ListAnnotation,
  ObjectToStringPipe,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';

@Component({
  selector: 'app-my-img-annotation-list',
  templateUrl: './my-img-annotation-list.component.html',
  styleUrls: ['./my-img-annotation-list.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ObjectToStringPipe,
  ],
})
export class MyImgAnnotationListComponent extends ImgAnnotationListComponent<any> {
  public selectAnnotation(annotation: ListAnnotation<string>): void {
    this.list?.selectAnnotation(annotation);
  }

  public removeAnnotationAt(index: number): void {
    this.list?.removeAnnotationAt(index);
  }

  public editAnnotation(annotation: ListAnnotation<string>): void {
    this.list?.editAnnotation(annotation.value);
  }
}
