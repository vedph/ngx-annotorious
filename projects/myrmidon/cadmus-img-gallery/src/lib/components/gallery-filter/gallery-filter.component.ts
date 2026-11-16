import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GalleryListRepository } from '../../gallery-list.repository';
import { GalleryFilter, GalleryFilterEntry } from '../../models';

/**
 * A filter metadatum.
 */
export interface GalleryFilterMetadatum {
  id: string;
  label: string;
  value: string;
}

/**
 * The maximum length of filter names and values.
 */
const MAX_LENGTH = 500;

/**
 * Gallery filter. This edits a set of name=value pairs used to filter
 * the images in the gallery. When applied, the filter is set into the
 * gallery list repository.
 */
@Component({
  selector: 'cadmus-gallery-filter',
  templateUrl: './gallery-filter.component.html',
  styleUrl: './gallery-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class GalleryFilterComponent {
  private readonly _repository = inject(GalleryListRepository);

  /**
   * The filter being edited. When not set, the repository filter is used.
   */
  public readonly filter = model<GalleryFilter | undefined>();

  /**
   * The entries used to represent image gallery metadata filters.
   * Each entry is a metadatum, with ID=metadatum name and value=label.
   * If empty, users can freely type a name rather than picking it from
   * a list.
   */
  public readonly entries = input<GalleryFilterEntry[] | null | undefined>([]);

  /**
   * The filter metadata being edited.
   */
  public readonly metadata = signal<GalleryFilterMetadatum[]>([]);

  /**
   * True if the edited metadata differ from the applied filter.
   */
  public readonly dirty = signal(false);

  protected readonly safeEntries = computed(() => this.entries() || []);

  // new metadatum form
  protected readonly entry = signal({ key: '', value: '' });
  protected readonly entryForm = form(this.entry, (p) => {
    required(p.key, { message: 'name required' });
    maxLength(p.key, MAX_LENGTH, { message: 'name too long' });
    maxLength(p.value, MAX_LENGTH, { message: 'value too long' });
  });

  constructor() {
    // when the filter (or the repository filter) changes, update metadata
    effect(() => {
      const filter = this.filter() ?? this._repository.filter();
      const entries = this.safeEntries();
      untracked(() => this.updateMetadata(filter, entries));
    });
  }

  private getLabel(id: string, entries = this.safeEntries()): string {
    return entries.find((e) => e.id === id)?.value || id;
  }

  private updateMetadata(
    filter: GalleryFilter | undefined,
    entries: GalleryFilterEntry[]
  ): void {
    this.metadata.set(
      Object.entries(filter || {}).map(([id, value]) => ({
        id,
        label: this.getLabel(id, entries),
        value: value || '',
      }))
    );
    this.dirty.set(false);
  }

  protected addMetadatum(event?: Event): void {
    event?.preventDefault();
    if (this.entryForm().invalid()) {
      this.entryForm.key().markAsTouched();
      return;
    }
    const { key, value } = this.entry();
    const id = key.trim();
    // replace any existing metadatum with the same name
    this.metadata.update((list) => [
      ...list.filter((m) => m.id !== id),
      { id, label: this.getLabel(id), value: value.trim() },
    ]);
    this.dirty.set(true);
    this.entryForm().reset({ key: '', value: '' });
  }

  protected deleteMetadatum(index: number): void {
    this.metadata.update((list) => list.filter((_, i) => i !== index));
    this.dirty.set(true);
  }

  private buildFilter(): GalleryFilter {
    const filter: GalleryFilter = {};
    for (const m of this.metadata()) {
      filter[m.id] = m.value;
    }
    return filter;
  }

  /**
   * Clear the filter and apply it.
   */
  public reset(): void {
    this.metadata.set([]);
    this.apply();
  }

  /**
   * Apply the edited filter.
   */
  public apply(): void {
    const filter = this.buildFilter();
    this.filter.set(filter);
    this.dirty.set(false);
    void this._repository.setFilter(filter);
  }
}
