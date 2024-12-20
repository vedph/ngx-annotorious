import {
  Component,
  effect,
  ElementRef,
  model,
  output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import {
  GuidService,
  ListAnnotation,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';

@Component({
  selector: 'app-edit-annotation',
  templateUrl: './edit-annotation.component.html',
  styleUrls: ['./edit-annotation.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
})
export class EditAnnotationComponent {
  public readonly annotation = model<ListAnnotation<any> | undefined>();
  public readonly cancel = output();

  @ViewChild('txt') txtElementRef?: ElementRef<HTMLTextAreaElement>;

  public text: FormControl<string | null>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder, private _guidService: GuidService) {
    this.text = formBuilder.control(null, {
      validators: [Validators.required, Validators.maxLength(100)],
      nonNullable: true,
    });
    this.form = formBuilder.group({
      text: this.text,
    });
    // when annotation changes, update form
    effect(() => {
      this.updateForm(this.annotation());
    });
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this.txtElementRef?.nativeElement.focus();
    });
  }

  private updateForm(annotation?: ListAnnotation<any>): void {
    if (!annotation) {
      this.form.reset();
      return;
    }

    this.text.setValue(
      annotation.value.bodies?.length
        ? annotation.value.bodies[0].value || ''
        : ''
    );
    this.form.markAsPristine();
  }

  private getAnnotation(): ListAnnotation<any> {
    const annotation = { ...this.annotation()! };

    if (annotation.value.bodies!.length === 0) {
      annotation.value.bodies.push({
        id: this._guidService.getGuid(),
        annotation: annotation.id,
        type: 'TextualBody',
        value: this.text.value || '',
        purpose: 'commenting',
      });
    } else {
      annotation.value!.bodies[0].value = this.text.value || '';
    }

    let a: ListAnnotation<any> = {
      id: annotation.id,
      // here the annotation value is just a string, but when it's an object,
      // we can leave it out as payload will be used instead anyway
      value: annotation.value,
      image: annotation.image,
      payload: this.text.value,
    };

    return a;
  }

  public close(): void {
    this.cancel.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    this.annotation.set(this.getAnnotation());
  }
}
