import { Component, effect, input, model } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { GalleryListRepository } from '../../gallery-list.repository';
import { GalleryFilter } from '../../models';

interface FilterMetadatum {
  id: string;
  label: string;
  value?: string;
}

@Component({
  selector: 'cadmus-gallery-filter',
  templateUrl: './gallery-filter.component.html',
  styleUrls: ['./gallery-filter.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class GalleryFilterComponent {
  /**
   * The filter to edit.
   */
  public readonly filter = model<GalleryFilter>();

  /**
   * The entries used to represent image gallery metadata filters.
   * Each entry is a metadatum, with ID=metadatum name and value=label.
   * If not set, users will be allowed to freely type a name rather
   * than picking it from a list.
   */
  public readonly entries = input<ThesaurusEntry[]>([]);

  public metadata: FormControl<FilterMetadatum[]>;
  public form: FormGroup;

  public metaId: FormControl<string>;
  public metaValue: FormControl<string>;
  public metaForm: FormGroup;

  constructor(
    formBuilder: FormBuilder,
    private _repository: GalleryListRepository
  ) {
    // forms
    this.metadata = formBuilder.control([], { nonNullable: true });
    this.form = formBuilder.group({
      metadata: this.metadata,
    });

    this.metaId = formBuilder.control('', {
      validators: [Validators.required, Validators.maxLength(500)],
      nonNullable: true,
    });
    this.metaValue = formBuilder.control('', {
      validators: Validators.maxLength(500),
      nonNullable: true,
    });
    this.metaForm = formBuilder.group({
      id: this.metaId,
      value: this.metaValue,
    });

    // when filter changes, update form
    effect(() => {
      this.updateForm(this.filter());
    });
  }

  private updateForm(filter?: GalleryFilter): void {
    if (!filter) {
      this.form.reset();
      return;
    }
    const metadata: FilterMetadatum[] = [];

    Object.keys(filter).forEach((key) => {
      const entry = this.entries().find((e) => e.id === key);
      metadata.push({
        id: key,
        label: entry?.value || key,
        value: filter![key],
      });
    });
    this.metadata.setValue(metadata);
    this.form.markAsPristine();
  }

  public addMetadatum(): void {
    if (this.metaForm.invalid) {
      return;
    }
    const metadata: FilterMetadatum[] = [...this.metadata.value];
    metadata.push({
      id: this.metaId.value,
      label:
        this.entries().find((e) => e.id === this.metaId.value)?.value ||
        this.metaId.value,
      value: this.metaValue.value || '',
    });
    this.metadata.setValue(metadata);
    this.metadata.updateValueAndValidity();
    this.metadata.markAsDirty();
  }

  public deleteMetadatum(index: number): void {
    const metadata: FilterMetadatum[] = [...this.metadata.value];
    metadata.splice(index, 1);
    this.metadata.setValue(metadata);
    this.metadata.updateValueAndValidity();
    this.metadata.markAsDirty();
  }

  private getFilter(): GalleryFilter {
    const filter: GalleryFilter = {};
    const metadata = this.metadata.value;
    for (let i = 0; i < this.metadata.value.length; i++) {
      filter[metadata[i].id] = metadata[i].value || '';
    }
    return filter;
  }

  public reset(): void {
    this.form.reset();
    this.apply();
  }

  public apply(): void {
    if (this.form.invalid) {
      return;
    }
    this.filter.set(this.getFilter());
    this._repository.setFilter(this.filter()!);
  }
}
