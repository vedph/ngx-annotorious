import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

import { ListAnnotation } from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';
import { EditAnnotationComponent } from '../edit-annotation/edit-annotation.component';

/**
 * A dialog wrapping an annotation editor. This just wires the received
 * data with the editor.
 */
@Component({
  selector: 'app-edit-annotation-dialog',
  templateUrl: './edit-annotation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogTitle, MatDialogContent, EditAnnotationComponent],
})
export class EditAnnotationDialogComponent {
  private readonly _dialogRef = inject(
    MatDialogRef<EditAnnotationDialogComponent, ListAnnotation<string>>
  );
  protected readonly data = inject<ListAnnotation<string>>(MAT_DIALOG_DATA);

  protected onClose(): void {
    this._dialogRef.close();
  }

  protected onSave(annotation: ListAnnotation<string>): void {
    this._dialogRef.close(annotation);
  }
}
