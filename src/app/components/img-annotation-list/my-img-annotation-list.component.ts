import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ImgAnnotationListComponent } from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';

/**
 * Sample custom annotations list, derived from ImgAnnotationListComponent.
 */
@Component({
  selector: 'app-my-img-annotation-list',
  templateUrl: './my-img-annotation-list.component.html',
  styleUrl: './my-img-annotation-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
})
export class MyImgAnnotationListComponent extends ImgAnnotationListComponent<string> {
  protected dump(index: number): void {
    console.log(this.annotations()[index]);
  }
}
