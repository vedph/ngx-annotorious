import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';

import { GalleryFilter, GalleryOptions, GalleryService } from '../models';
import { LoremIpsumService } from './lorem-ipsum.service';

/**
 * Options for MockGalleryService.
 */
export interface MockGalleryOptions extends GalleryOptions {
  /**
   * The total count of images in the mock gallery.
   */
  count: number;
}

/**
 * Filter images by title and description. Matching is case-insensitive.
 * The description filter key can be either `description` or `dsc`.
 * @param images The images to filter.
 * @param filter The filter.
 * @returns The filtered images.
 */
export function filterGalleryImages<T extends GalleryImage>(
  images: T[],
  filter: GalleryFilter | null | undefined
): T[] {
  const title = filter?.['title']?.toLowerCase();
  const dsc = (filter?.['description'] || filter?.['dsc'])?.toLowerCase();
  if (!title && !dsc) {
    return images;
  }
  return images.filter(
    (i) =>
      (!title || i.title?.toLowerCase().includes(title)) &&
      (!dsc || !!i.description?.toLowerCase().includes(dsc))
  );
}

/**
 * Get the specified page from a list of items.
 * @param items The items.
 * @param pageNumber The page number (1-N).
 * @param pageSize The page size.
 * @returns The page.
 */
export function getDataPage<T>(
  items: T[],
  pageNumber: number,
  pageSize: number
): DataPage<T> {
  const size = Math.max(1, pageSize);
  const pageCount = Math.ceil(items.length / size);
  const number = Math.max(1, pageNumber);
  const skip = (number - 1) * size;
  return {
    total: items.length,
    pageCount,
    pageNumber: number,
    pageSize: size,
    items: skip >= items.length ? [] : items.slice(skip, skip + size),
  };
}

/**
 * Mock gallery service.
 * Image URIs are built to use an online mock image service
 * (https://loremflickr.com). Images are random, but the service ensures
 * consistency (at least until its cache is not emptied).
 * The only image metadata handled in filtering are title and description;
 * images are sorted by title, and their ID is just their ordinal number
 * in the set.
 */
@Injectable({
  providedIn: 'root',
})
export class MockGalleryService implements GalleryService {
  private readonly _lipsum = inject(LoremIpsumService);
  private _images: GalleryImage[] = [];

  private buildUri(id: string, options: GalleryOptions): string {
    const sb: string[] = ['https://loremflickr.com/'];
    if (options.width) {
      sb.push(options.width.toString());
      if (options.height) {
        sb.push('/', options.height.toString());
      }
    }
    sb.push('?lock=', id);
    return sb.join('');
  }

  private ensureSeeded(options: MockGalleryOptions): void {
    const count = Math.max(0, options.count || 0);
    if (count === this._images.length) {
      return;
    }
    this._images = Array.from({ length: count }, (_, i) => {
      const id = `${i + 1}`;
      return {
        id,
        uri: this.buildUri(id, options),
        title: 'image #' + id.padStart(5, '0'),
        description: this._lipsum.generateSentence(),
      };
    });
  }

  /**
   * Get the specified page of gallery images.
   *
   * @param filter The filter.
   * @param pageNumber The page number.
   * @param pageSize The page size.
   * @param options The gallery options.
   */
  public getImages(
    filter: GalleryFilter,
    pageNumber: number,
    pageSize: number,
    options: GalleryOptions
  ): Observable<DataPage<GalleryImage>> {
    this.ensureSeeded(options as MockGalleryOptions);
    // images are already sorted by title
    return of(
      getDataPage(
        filterGalleryImages(this._images, filter),
        pageNumber,
        pageSize
      )
    );
  }

  /**
   * Get the specified image.
   *
   * @param id The image ID.
   * @param options The image options.
   */
  public getImage(
    id: string,
    options: GalleryOptions
  ): Observable<GalleryImage | null> {
    this.ensureSeeded(options as MockGalleryOptions);
    const image = this._images[+id - 1];
    if (!image) {
      return of(null);
    }
    // rebuild the URI as size must be drawn from options
    return of({ ...image, uri: this.buildUri(id, options) });
  }

  /**
   * Clear the seeded images.
   */
  public clearCache(): void {
    this._images = [];
  }
}
