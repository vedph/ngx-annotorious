import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';

import {
  GalleryFilter,
  GalleryOptions,
  GalleryService,
} from '../models';
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
 * Mock gallery service.
 * Image URIs will be built to use an online mock image service
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
  private _images: GalleryImage[];

  constructor(private _lipsum: LoremIpsumService) {
    this._images = [];
  }

  private padLeft(number: number, length: number, character = '0'): string {
    let result = String(number);
    for (let i = result.length; i < length; ++i) {
      result = character + result;
    }
    return result;
  }

  private buildUriPrefix(id: string, options: MockGalleryOptions): string {
    const sb: string[] = [];
    sb.push('https://loremflickr.com/');
    if (options.width) {
      sb.push(options.width.toString());
      if (options.height) {
        sb.push('/');
        sb.push(options.height.toString());
      }
    }
    sb.push('?lock=');
    if (id) {
      sb.push(id);
    }
    return sb.join('');
  }

  private seed(options: MockGalleryOptions): void {
    this._images = [];
    const uriPrefix = this.buildUriPrefix('', options);

    for (let i = 0; i < options.count; i++) {
      this._images.push({
        id: `${i + 1}`,
        uri: uriPrefix + `${i + 1}`,
        title: 'image #' + this.padLeft(i + 1, 5),
        description: this._lipsum.generateSentence(),
      });
    }
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
    options: MockGalleryOptions
  ): Observable<DataPage<GalleryImage>> {
    // seed if total count changed
    if (options.count !== this._images.length) {
      this.seed(options);
    }
    const titleFilter = filter['title'];
    const dscFilter = filter['description'];

    // get filtered images (already sorted by title)
    const filtered = this._images.filter((i) => {
      if (titleFilter && !i.title.includes(titleFilter)) {
        return false;
      }
      if (dscFilter && !i.description?.includes(dscFilter)) {
        return false;
      }
      return true;
    });

    // get page
    const skip = (pageNumber - 1) * pageSize;
    const pageCount = Math.ceil(filtered.length / pageSize);

    if (skip > filtered.length) {
      return of({
        total: filtered.length,
        pageCount: pageCount,
        pageNumber: pageNumber,
        pageSize: pageSize,
        items: [],
      });
    }

    return of({
      total: filtered.length,
      pageCount: pageCount,
      pageNumber: pageNumber,
      pageSize: pageSize,
      items: filtered.slice(skip, skip + pageSize),
    });
  }

  /**
   * Get the specified image.
   *
   * @param id The image ID.
   * @param options The image options.
   */
  public getImage(
    id: string,
    options: MockGalleryOptions
  ): Observable<GalleryImage | null> {
    // seed if total count changed
    if (options.count !== this._images.length) {
      this.seed(options);
    }
    const i = +id - 1;
    if (i >= this._images.length) {
      return of(null);
    }
    // rebuild the URI as size must be drawn from options
    const image = { ...this._images[i], uri: this.buildUriPrefix(id, options) };
    return of(image);
  }
}
