import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';
import {
  filterGalleryImages,
  GalleryFilter,
  GalleryOptions,
  GalleryService,
  getDataPage,
} from '@myrmidon/cadmus-img-gallery';

import { IiifUri } from './iiif-uri';

// ...images/resource essential metadata
interface ManifestImageResource {
  '@id'?: string;
  id?: string;
  '@type'?: string;
  format?: string;
  height?: number;
  width?: number;
}

/**
 * A gallery image with an intrinsic size.
 */
export interface SizedGalleryImage extends GalleryImage {
  width: number;
  height: number;
}

/**
 * Options for the SimpleIiifGallery service.
 */
export interface SimpleIiifGalleryOptions extends GalleryOptions {
  /**
   * The URI to the JSON manifest.
   */
  manifestUri: string;
  /**
   * The path to the array of objects representing the images
   * to be served by the gallery. A path is built of JS object
   * property names, eventually followed by an indexer when they
   * are arrays, separated by a slash.
   */
  arrayPath: string;
  /**
   * The path to the image resource data for each item in the array
   * targeted by arrayPath. A path is built of JS object
   * property names, eventually followed by an indexer when they
   * are arrays, separated by a slash.
   */
  resourcePath: string;
  /**
   * The path to the image label for each item in the array targeted
   * by arrayPath. A path is built of JS object property names,
   * eventually followed by an indexer when they are arrays, separated
   * by a slash.
   */
  labelPath?: string;
  /**
   * The desired width for the image being the target of annotations.
   * Leave unspecified to use the size defined in the manifest, or -1
   * to avoid specifying w at all (e.g. ",h").
   */
  targetWidth?: number;
  /**
   * The desired height for the image being the target of annotations.
   * Leave unspecified to use the size defined in the manifest, or -1
   * to avoid specifying h at all (e.g. "w,").
   */
  targetHeight?: number;
  /**
   * The optional count of items to skip at the beginning of the array
   * of objects representing images.
   */
  skip?: number;
  /**
   * The optional limit of items to load from the array of objects
   * representing images.
   */
  limit?: number;
}

/**
 * Get the property targeted by path in the received target object.
 *
 * @param target The object targeted by path.
 * @param path The path to the property starting from the object.
 * This is a string where each step is separated by a slash, and
 * represents either a property name (e.g. /x), or an array property
 * name with an indexer (e.g. /x[3]).
 * @returns The property, or null if path not matched. When not null,
 * the result is cast to T.
 */
export function getPathProperty<T>(
  target: unknown,
  path: string | null | undefined
): T | null {
  let t: any = target;
  const steps = (path || '').split('/').filter((s) => s);
  for (const step of steps) {
    if (t === null || t === undefined || typeof t !== 'object') {
      return null;
    }
    const m = /^([^[]*)\[(\d+)\]$/.exec(step);
    if (m) {
      const array = m[1] ? t[m[1]] : t;
      if (!Array.isArray(array)) {
        return null;
      }
      t = array[+m[2]];
    } else {
      t = t[step];
    }
    if (t === null || t === undefined) {
      return null;
    }
  }
  return t as T;
}

/**
 * Get a label from a IIIF label value, which can be a string, an array of
 * strings or language-tagged values, or a language map.
 */
function getLabelText(label: unknown): string | null {
  if (!label) {
    return null;
  }
  if (typeof label === 'string') {
    return label;
  }
  if (Array.isArray(label)) {
    for (const item of label) {
      const s = getLabelText(
        typeof item === 'object' && item && '@value' in item
          ? (item as any)['@value']
          : item
      );
      if (s) {
        return s;
      }
    }
    return null;
  }
  if (typeof label === 'object') {
    // IIIF v3 language map, e.g. { "en": ["label"] }
    for (const value of Object.values(label as object)) {
      const s = getLabelText(value);
      if (s) {
        return s;
      }
    }
  }
  return null;
}

/**
 * Simple IIIF gallery service. This is an essential IIIF service which
 * loads a list of images from a JSON manifest, extracting it from a
 * designated path. The list is cached in memory, and gets reloaded only
 * if its source parameters are changed, or `clearCache` is called.
 * Images can be filtered by `title` (case-insensitive substring).
 */
@Injectable({
  providedIn: 'root',
})
export class SimpleIiifGalleryService implements GalleryService {
  // avoid Authorization header from interceptors by using HttpBackend
  private readonly _http = new HttpClient(inject(HttpBackend));
  private _sourceKey?: string;
  private _images$?: Observable<SizedGalleryImage[]>;

  /**
   * Get the property targeted by path in the received target object.
   * @see getPathProperty
   */
  public getProperty<T>(target: object | any[], path: string): T | null {
    return getPathProperty<T>(target, path);
  }

  private getSourceKey(options: SimpleIiifGalleryOptions): string {
    return JSON.stringify([
      options.manifestUri,
      options.arrayPath,
      options.resourcePath,
      options.labelPath || '',
      options.skip || 0,
      options.limit || 0,
    ]);
  }

  /**
   * Read the images from the manifest.
   * @param manifest The manifest.
   * @param options The options.
   * @returns The images.
   */
  public readManifest(
    manifest: unknown,
    options: SimpleIiifGalleryOptions
  ): SizedGalleryImage[] {
    const images: SizedGalleryImage[] = [];

    const imgArray = getPathProperty<unknown[]>(manifest, options.arrayPath);
    if (!Array.isArray(imgArray)) {
      return images;
    }

    const start =
      options.skip && options.skip > 0 && options.skip < imgArray.length
        ? options.skip
        : 0;
    const end =
      options.limit && options.limit > 0
        ? Math.min(start + options.limit, imgArray.length)
        : imgArray.length;

    for (let i = start; i < end; i++) {
      const r = getPathProperty<ManifestImageResource>(
        imgArray[i],
        options.resourcePath
      );
      const uri = r?.['@id'] || r?.id;
      if (!uri) {
        continue;
      }
      const label = options.labelPath
        ? getLabelText(getPathProperty<unknown>(imgArray[i], options.labelPath))
        : null;
      images.push({
        // the ID is just the ordinal of the image in its list
        id: `${i + 1}`,
        uri,
        title: label || `${i + 1}`,
        width: r?.width || 0,
        height: r?.height || 0,
      });
    }
    return images;
  }

  private getAllImages(
    options: SimpleIiifGalleryOptions
  ): Observable<SizedGalleryImage[]> {
    const key = this.getSourceKey(options);
    if (!this._images$ || key !== this._sourceKey) {
      this._sourceKey = key;
      const images$ = this._http.get<unknown>(options.manifestUri).pipe(
        map((m) => this.readManifest(m, options)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      this._images$ = images$;
      // do not cache errors
      images$.subscribe({
        error: () => {
          if (this._images$ === images$) {
            this._images$ = undefined;
            this._sourceKey = undefined;
          }
        },
      });
    }
    return this._images$;
  }

  /**
   * Build a resized image URI.
   * @param uri The original IIIF URI.
   * @param size The IIIF size.
   * @returns The URI, or the original URI if it is not a IIIF image URI.
   */
  private resize(uri: string, size: string | null): string {
    if (!size) {
      return uri;
    }
    const iiif = IiifUri.parse(uri);
    if (!iiif) {
      return uri;
    }
    iiif.size = size;
    return iiif.toString();
  }

  private getThumbnailSize(width?: number, height?: number): string | null {
    // "w," or ",h" or "!w,h"
    if (width && height) {
      return `!${width},${height}`;
    }
    if (width) {
      return `${width},`;
    }
    if (height) {
      return `,${height}`;
    }
    return null;
  }

  private getTargetSize(
    image: SizedGalleryImage,
    options: SimpleIiifGalleryOptions
  ): string | null {
    const w = options.targetWidth || image.width;
    const h = options.targetHeight || image.height;
    // -1 is a special value to represent omission of w/h
    if (w > 0 && h > 0) {
      return `!${w},${h}`;
    }
    if (w > 0) {
      return `${w},`;
    }
    if (h > 0) {
      return `,${h}`;
    }
    return null;
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
    options: SimpleIiifGalleryOptions
  ): Observable<DataPage<SizedGalleryImage>> {
    const o = options;
    const size = this.getThumbnailSize(o.width, o.height);
    return this.getAllImages(o).pipe(
      map((images) => {
        const page = getDataPage(
          filterGalleryImages(images, filter),
          pageNumber,
          pageSize
        );
        return {
          ...page,
          items: page.items.map((image) => ({
            ...image,
            uri: this.resize(image.uri, size),
          })),
        };
      })
    );
  }

  /**
   * Get the specified image, sized according to options targetWidth and
   * targetHeight.
   *
   * @param id The image ID, which here is just the ordinal number
   * of the image in its list.
   * @param options The image options.
   */
  public getImage(
    id: string,
    options: SimpleIiifGalleryOptions
  ): Observable<SizedGalleryImage | null> {
    const o = options;
    const i = +id - 1;
    if (!Number.isInteger(i) || i < 0) {
      return of(null);
    }
    return this.getAllImages(o).pipe(
      map((images) => {
        const image = images.find((img) => img.id === id);
        if (!image) {
          return null;
        }
        return {
          ...image,
          uri: this.resize(image.uri, this.getTargetSize(image, o)),
        };
      })
    );
  }

  /**
   * Clear the cached manifest images.
   */
  public clearCache(): void {
    this._images$ = undefined;
    this._sourceKey = undefined;
  }
}
