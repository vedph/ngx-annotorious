import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GalleryImage } from '@myrmidon/ngx-annotorious';

import { GalleryListRepository } from '../../gallery-list.repository';
import { GalleryFilterEntry } from '../../models';
import { GalleryOptionsService } from '../../services/gallery-options.service';
import { GalleryFilterComponent } from '../gallery-filter/gallery-filter.component';

/**
 * A paged and filterable list of gallery images. Images are provided by
 * the gallery service registered with `IMAGE_GALLERY_SERVICE_KEY`, via
 * the `GalleryListRepository`.
 */
@Component({
  selector: 'cadmus-gallery-list',
  templateUrl: './gallery-list.component.html',
  styleUrl: './gallery-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
    GalleryFilterComponent,
  ],
})
export class GalleryListComponent {
  protected readonly repository = inject(GalleryListRepository);
  private readonly _options = inject(GalleryOptionsService);

  /**
   * The entries used to represent image gallery metadata filters.
   * Each entry is a metadatum, with ID=metadatum name and value=label.
   * If not set, users will be allowed to freely type a name rather
   * than picking it from a list.
   */
  public readonly entries = input<GalleryFilterEntry[] | null | undefined>();

  /**
   * True to show the filter.
   */
  public readonly filterVisible = input<boolean>(true);

  /**
   * The ID of the image to be highlighted as selected, if any.
   */
  public readonly selectedId = input<string | null | undefined>();

  /**
   * The page size options for the paginator.
   */
  public readonly pageSizeOptions = input<number[]>([6, 12, 24, 48]);

  /**
   * Emitted when an image is picked.
   */
  public readonly imagePick = output<GalleryImage>();

  protected readonly page = this.repository.page;
  protected readonly loading = this.repository.loading;
  protected readonly error = this.repository.error;
  protected readonly thumbWidth = computed(
    () => this._options.options().width || 200
  );
  protected readonly thumbHeight = computed(
    () => this._options.options().height || null
  );
  protected readonly sizeOptions = computed(() => {
    // ensure that the current page size is among options
    const sizes = new Set(this.pageSizeOptions());
    const size = this.page().pageSize;
    if (size) {
      sizes.add(size);
    }
    return [...sizes].sort((a, b) => a - b);
  });

  constructor() {
    void this.repository.ensureLoaded();
  }

  protected onPageChange(event: PageEvent): void {
    void this.repository.setPage(event.pageIndex + 1, event.pageSize);
  }

  protected reset(): void {
    void this.repository.reset();
  }

  protected pickImage(image: GalleryImage): void {
    this.imagePick.emit(image);
  }
}
