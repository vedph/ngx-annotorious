import { Observable } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';

import { GalleryImage } from './directives/img-annotator.directive';
import { InjectionToken } from '@angular/core';

/**
 * The token used for DI of the gallery server options.
 * Provide it in your consumer app module under providers:
 * {
 *   provider: GALLERY_IMAGE_OPTIONS_TOKEN,
 *   useValue: YOUR_OPTIONS_CONSTANT_OBJECT
 * }
 */
export const IMAGE_GALLERY_OPTIONS_TOKEN = new InjectionToken(
  'imgGalleryOptions'
);

/**
 * The token used for DI of the gallery service.
 * Provide it in your consumer app module under providers:
 * {
 *   provider: GALLERY_IMAGE_SERVICE_TOKEN,
 *   useValue: YOUR_OPTIONS_CONSTANT_OBJECT
 * }
 */
export const IMAGE_GALLERY_SERVICE_TOKEN = new InjectionToken(
  'imgGalleryService'
);

/**
 * Essential options for a gallery image. You can derive your own model
 * from this one.
 */
export interface GalleryOptions {
  baseUri: string;
  width?: number;
  height?: number;
  pageSize?: number;
}

/**
 * A generic filter consisting of name:value pairs where both name and
 * value are strings.
 */
export type GalleryFilter = { [key: string]: string };

/**
 * Gallery image service interface.
 */
export interface GalleryService {
  /**
   * Get the specified page of gallery images.
   *
   * @param filter The filter.
   * @param pageNumber The page number.
   * @param pageSize The page size.
   * @param options The gallery options.
   */
  getImages(
    filter: GalleryFilter,
    pageNumber: number,
    pageSize: number,
    options: GalleryOptions
  ): Observable<DataPage<GalleryImage>>;

  /**
   * Get the specified image.
   *
   * @param id The image ID.
   * @param options The image options.
   */
  getImage(
    id: string,
    options: GalleryOptions
  ): Observable<GalleryImage | null>;
}

/**
 * Essential metadata mostly extracted from the W3C annotation produced
 * by Annotorious.
 */
export interface GalleryImageAnnotation {
  id: string;
  target: GalleryImage;
  selector: string;
  notes?: string[];
  tags?: string[];
}
