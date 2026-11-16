import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { ImageAnnotation } from '@annotorious/annotorious';

import {
  ListAnnotation,
  newGuid,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';

/**
 * Demo annotation editor: the payload is just a text, which is also
 * stored as the first (commenting) body of the Annotorious annotation.
 */
@Component({
  selector: 'app-edit-annotation',
  templateUrl: './edit-annotation.component.html',
  styleUrl: './edit-annotation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
})
export class EditAnnotationComponent {
  /**
   * The annotation to edit.
   */
  public readonly annotation = input<ListAnnotation<string> | undefined>();

  /**
   * Emitted with the edited annotation when the user saves.
   */
  public readonly annotationSave = output<ListAnnotation<string>>();

  /**
   * Emitted when the user cancels.
   */
  public readonly editorClose = output();

  protected readonly model = signal({ text: '' });
  protected readonly editForm = form(this.model, (p) => {
    required(p.text, { message: 'text required' });
    maxLength(p.text, 100, { message: 'text too long' });
  });

  constructor() {
    effect(() => {
      const annotation = this.annotation();
      untracked(() => {
        const text =
          annotation?.payload || annotation?.value.bodies?.[0]?.value || '';
        this.editForm().reset({ text });
      });
    });
  }

  private buildAnnotation(text: string): ListAnnotation<string> {
    const source = this.annotation()!;
    const bodies = [...(source.value.bodies || [])];
    if (bodies.length) {
      bodies[0] = { ...bodies[0], value: text };
    } else {
      bodies.push({
        id: newGuid(),
        annotation: source.id,
        type: 'TextualBody',
        value: text,
        purpose: 'commenting',
      });
    }
    const value: ImageAnnotation = { ...source.value, bodies };
    return { ...source, value, payload: text };
  }

  protected close(): void {
    this.editorClose.emit();
  }

  protected save(event?: Event): void {
    event?.preventDefault();
    if (!this.annotation() || this.editForm().invalid()) {
      return;
    }
    this.annotationSave.emit(this.buildAnnotation(this.model().text.trim()));
  }
}
