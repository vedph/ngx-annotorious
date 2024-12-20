import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { PagedListStore } from '@myrmidon/paged-data-browsers';

import { GalleryOptionsService } from './services/gallery-options.service';
import {
  GalleryFilter,
  GalleryService,
  IMAGE_GALLERY_SERVICE_KEY,
} from './models';
import { GalleryImage } from './directives/img-annotator.directive';

export interface GalleryImageListProps {
  filter: GalleryFilter;
}

@Injectable({ providedIn: 'root' })
export class GalleryListRepository {
  private _store: PagedListStore<GalleryFilter, GalleryImage>;
  private _loading$: BehaviorSubject<boolean>;

  public loading$: Observable<boolean>;
  public page$: Observable<DataPage<GalleryImage>>;

  constructor(
    @Inject(IMAGE_GALLERY_SERVICE_KEY)
    private _service: GalleryService,
    private _options: GalleryOptionsService
  ) {
    this._store = new PagedListStore<GalleryFilter, GalleryImage>(this);
    this._loading$ = new BehaviorSubject<boolean>(false);
    this.loading$ = this._loading$.asObservable();
    this.page$ = this._store.page$;
    this._store.reset();
  }

  public loadPage(
    pageNumber: number,
    pageSize: number,
    filter: GalleryFilter
  ): Observable<DataPage<GalleryImage>> {
    this._loading$.next(true);
    return this._service
      .getImages(filter, pageNumber, pageSize, this._options.get())
      .pipe(
        tap({
          next: () => this._loading$.next(false),
          error: () => this._loading$.next(false),
        })
      );
  }

  public async reset(): Promise<void> {
    this._loading$.next(true);
    try {
      await this._store.reset();
    } catch (error) {
      throw error;
    } finally {
      this._loading$.next(false);
    }
  }

  public async setFilter(filter: GalleryFilter): Promise<void> {
    this._loading$.next(true);
    try {
      await this._store.setFilter(filter);
    } catch (error) {
      throw error;
    } finally {
      this._loading$.next(false);
    }
  }

  public getFilter(): GalleryFilter {
    return this._store.getFilter();
  }

  public async setPage(pageNumber: number, pageSize: number): Promise<void> {
    this._loading$.next(true);
    try {
      await this._store.setPage(pageNumber, pageSize);
    } catch (error) {
      throw error;
    } finally {
      this._loading$.next(false);
    }
  }
}
