import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';

/**
 * Essential options for a gallery. You can derive your own model
 * from this one.
 */
export interface GalleryOptions {
  baseUri: string;
  /**
   * The width of the gallery thumbnails.
   */
  width?: number;
  /**
   * The height of the gallery thumbnails.
   */
  height?: number;
  /**
   * The default page size.
   */
  pageSize?: number;
}

/**
 * A generic filter consisting of name:value pairs where both name and
 * value are strings.
 */
export type GalleryFilter = { [key: string]: string };

/**
 * An entry representing a filterable image metadatum, with ID=metadatum
 * name and value=its human-friendly label. This is structurally compatible
 * with Cadmus thesaurus entries.
 */
export interface GalleryFilterEntry {
  id: string;
  value: string;
}

/**
 * Gallery image service interface.
 */
export interface GalleryService {
  /**
   * Get the specified page of gallery images.
   *
   * @param filter The filter.
   * @param pageNumber The page number (1-N).
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
  getImage(id: string, options: GalleryOptions): Observable<GalleryImage | null>;

  /**
   * Optionally clear any cached data, so that it gets reloaded
   * at the next request.
   */
  clearCache?(): void;
}

/**
 * The DI token for the gallery options. Provide it in your app config:
 * `{ provide: IMAGE_GALLERY_OPTIONS_KEY, useValue: YOUR_OPTIONS }`.
 */
export const IMAGE_GALLERY_OPTIONS_KEY = new InjectionToken<GalleryOptions>(
  'cadmusImgGalleryOptions'
);

/**
 * The DI token for the gallery service. Provide it in your app config:
 * `{ provide: IMAGE_GALLERY_SERVICE_KEY, useClass: YOUR_SERVICE }`.
 */
export const IMAGE_GALLERY_SERVICE_KEY = new InjectionToken<GalleryService>(
  'cadmusImgGalleryService'
);

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
