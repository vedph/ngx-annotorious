import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';

import { GalleryOptionsService } from './services/gallery-options.service';
import { GalleryFilter, IMAGE_GALLERY_SERVICE_KEY } from './models';

/**
 * The default page size when not specified by options.
 */
export const DEFAULT_GALLERY_PAGE_SIZE = 20;

function emptyPage(pageSize: number): DataPage<GalleryImage> {
  return { pageNumber: 0, pageSize, pageCount: 0, total: 0, items: [] };
}

/**
 * Signal-based repository of gallery images, providing paged and filtered
 * data to the gallery UI. The first page is loaded lazily on the first
 * call to `ensureLoaded`, `setPage`, `setFilter` or `reset`. When the
 * gallery options change, the repository is automatically reset.
 */
@Injectable({ providedIn: 'root' })
export class GalleryListRepository {
  private readonly _service = inject(IMAGE_GALLERY_SERVICE_KEY);
  private readonly _options = inject(GalleryOptionsService);

  private readonly _page = signal<DataPage<GalleryImage>>(
    emptyPage(this.getDefaultPageSize())
  );
  private readonly _filter = signal<GalleryFilter>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private _loaded = false;
  private _requestId = 0;
  private _lastOptions = this._options.get();

  /**
   * The current page.
   */
  public readonly page = this._page.asReadonly();

  /**
   * The current filter.
   */
  public readonly filter = this._filter.asReadonly();

  /**
   * True while loading.
   */
  public readonly loading = this._loading.asReadonly();

  /**
   * The last loading error message, if any.
   */
  public readonly error = this._error.asReadonly();

  /**
   * True if there are no images in the current page.
   */
  public readonly empty = computed(() => !this._page().items.length);

  constructor() {
    // reset when options change (after the first load)
    effect(() => {
      const options = this._options.options();
      untracked(() => {
        if (options === this._lastOptions) {
          return;
        }
        this._lastOptions = options;
        if (this._loaded) {
          void this.reset();
        }
      });
    });
  }

  private getDefaultPageSize(): number {
    return this._options.get().pageSize || DEFAULT_GALLERY_PAGE_SIZE;
  }

  private async load(pageNumber: number, pageSize: number): Promise<void> {
    const id = ++this._requestId;
    this._loaded = true;
    this._loading.set(true);
    this._error.set(null);
    try {
      const page = await firstValueFrom(
        this._service.getImages(
          this._filter(),
          Math.max(1, pageNumber),
          Math.max(1, pageSize),
          this._options.get()
        )
      );
      if (id === this._requestId) {
        this._page.set(page);
      }
    } catch (error) {
      if (id === this._requestId) {
        console.error('Gallery: error loading images', error);
        this._error.set(
          error instanceof Error ? error.message : 'Error loading images'
        );
        this._page.set(emptyPage(pageSize));
      }
    } finally {
      if (id === this._requestId) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Load the first page if nothing was loaded yet.
   */
  public async ensureLoaded(): Promise<void> {
    if (!this._loaded) {
      await this.load(1, this.getDefaultPageSize());
    }
  }

  /**
   * Load the specified page.
   * @param pageNumber The page number (1-N).
   * @param pageSize The page size; if not specified, the current size
   * is used.
   */
  public setPage(pageNumber: number, pageSize?: number): Promise<void> {
    return this.load(
      pageNumber,
      pageSize || this._page().pageSize || this.getDefaultPageSize()
    );
  }

  /**
   * Set the filter and load the first page.
   * @param filter The filter.
   */
  public setFilter(filter: GalleryFilter | null | undefined): Promise<void> {
    this._filter.set({ ...(filter || {}) });
    return this.load(1, this._page().pageSize || this.getDefaultPageSize());
  }

  /**
   * Get the current filter.
   */
  public getFilter(): GalleryFilter {
    return this._filter();
  }

  /**
   * Clear the filter and any cached data, and load the first page.
   */
  public reset(): Promise<void> {
    this._service.clearCache?.();
    this._filter.set({});
    return this.load(1, this.getDefaultPageSize());
  }
}
