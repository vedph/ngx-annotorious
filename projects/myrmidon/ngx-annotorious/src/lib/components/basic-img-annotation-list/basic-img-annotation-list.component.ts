import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ImgAnnotationListComponent } from '../img-annotation-list/img-annotation-list.component';

/**
 * A ready-to-use list of image annotations, showing for each annotation
 * its summary and actions to select, edit and remove it.
 */
@Component({
  selector: 'ann-basic-img-annotation-list',
  templateUrl: './basic-img-annotation-list.component.html',
  styleUrl: './basic-img-annotation-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
})
export class BasicImgAnnotationListComponent<
  T = unknown
> extends ImgAnnotationListComponent<T> {
  /**
   * True to show the annotation IDs.
   */
  public readonly showIds = input<boolean>(false);

  /**
   * The message shown when there are no annotations.
   */
  public readonly emptyMessage = input<string>(
    'No annotations. Draw a shape on the image to add one.'
  );
}
