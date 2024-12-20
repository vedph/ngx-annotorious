import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, switchMap, take } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';
import {
  GalleryFilter,
  GalleryOptions,
  GalleryService,
} from '@myrmidon/cadmus-img-gallery';

import { IiifUri } from './iiif-uri';

// ...images/resource essential metadata
interface ManifestImageResource {
  '@id': string;
  '@type': string;
  format: string;
  height: number;
  width: number;
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
 * Simple IIIF gallery service. This is an essential IIIF service which
 * loads a list of images from a JSON manifest, extracting it from a
 * designated path. The list is cached in memory, and gets reloaded only
 * if its source parameters are changed.
 */
@Injectable({
  providedIn: 'root',
})
export class SimpleIiifGalleryService implements GalleryService {
  private _http: HttpClient;
  private _options?: SimpleIiifGalleryOptions;
  private _images: SizedGalleryImage[];

  constructor(handler: HttpBackend) {
    this._images = [];
    // avoid Authorization header from interceptors
    // https://stackoverflow.com/questions/46469349/how-to-make-an-angular-module-to-ignore-http-interceptor-added-in-a-core-module
    this._http = new HttpClient(handler);
  }

  private parseStepIndex(step: string): { step: string; index: number } | null {
    const i = step.indexOf('[');
    if (i === -1) {
      return null;
    }
    return {
      step: step.substring(0, i),
      index: +step.substring(i + 1, step.length - 1),
    };
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
  public getProperty<T>(target: object | any[], path: string): T | null {
    let t: any = target;
    const steps = path.split('/').filter((s) => s);
    for (let i = 0; i < steps.length; i++) {
      const si = this.parseStepIndex(steps[i]);
      if (si) {
        if (!Array.isArray(t[si.step])) {
          return null;
        }
        t = t[si.step][si.index];
      } else {
        t = t[steps[i]];
      }
      if (!t) {
        return null;
      }
    }
    return t as T;
  }

  private readManifest(manifest: any, options: SimpleIiifGalleryOptions): void {
    this._images = [];

    // read the array of images
    const imgArray = this.getProperty<any[]>(manifest, options.arrayPath);
    if (!imgArray) {
      return;
    }

    // add a gallery image for each image in the array
    const start =
      options.skip && options.skip < imgArray.length ? options.skip : 0;
    const end =
      options.limit && start + options.limit < imgArray.length
        ? start + options.limit
        : imgArray.length;

    for (let i = start; i < end; i++) {
      const r = this.getProperty<ManifestImageResource>(
        imgArray[i],
        options.resourcePath
      );
      if (!r) {
        continue;
      }
      const label = options.labelPath
        ? this.getProperty<string>(imgArray[i], options.labelPath)
        : null;
      this._images.push({
        // the ID is just the ordinal of the image in its list
        id: `${i + 1}`,
        uri: r['@id'],
        title: label || `${i + 1}`,
        // not using description right now
        width: r.width,
        height: r.height,
      });
    }
  }

  private isSourceChanged(options: SimpleIiifGalleryOptions): boolean {
    if (!this._options) {
      return true;
    }
    return (
      this._options.baseUri !== options.baseUri ||
      this._options.arrayPath !== options.arrayPath ||
      this._options.resourcePath !== options.resourcePath
    );
  }

  private getCachedImages(
    filter: GalleryFilter,
    pageNumber: number,
    pageSize: number,
    width?: number,
    height?: number
  ): DataPage<SizedGalleryImage> {
    // get filtered images
    // TODO: implement filter
    const filtered = this._images;

    // get page
    const skip = (pageNumber - 1) * pageSize;
    const pageCount = Math.ceil(filtered.length / pageSize);

    // empty page if beyond limit
    if (skip > filtered.length) {
      return {
        total: filtered.length,
        pageCount: pageCount,
        pageNumber: pageNumber,
        pageSize: pageSize,
        items: [],
      };
    }

    // get the slice for the requested page
    let images = filtered.slice(skip, skip + pageSize);

    // resize images if requested
    if (width || height) {
      images = images.map((image) => {
        const uri = IiifUri.parse(image.uri)!;
        let size: string;
        // "w," or ",h" or "!w,h"
        if (width && height) {
          size = `!${width},${height}`;
        } else if (width) {
          size = `${width},`;
        } else if (height) {
          size = `,${height}`;
        }
        uri.size = size!;
        return {
          ...image,
          width: width || image.width,
          height: height || image.height,
          uri: uri.toString(),
        };
      });
    }
    // return the requested page
    return {
      total: filtered.length,
      pageCount: pageCount,
      pageNumber: pageNumber,
      pageSize: pageSize,
      items: images,
    };
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
    // if options have changed, we must reload the manifest
    if (this.isSourceChanged(options)) {
      return this._http.get<any>(options.manifestUri).pipe(
        take(1),
        switchMap((m: any) => {
          // once loaded, save options, read manifest and return images
          this._options = options;
          this.readManifest(m, options);
          return of(
            this.getCachedImages(
              filter,
              pageNumber,
              pageSize,
              options.width,
              options.height
            )
          );
        })
      );
    } else {
      // else we just use the cached images (with the requested size)
      return of(
        this.getCachedImages(
          filter,
          pageNumber,
          pageSize,
          options.width,
          options.height
        )
      );
    }
  }

  private buildUri(id: string, options: SimpleIiifGalleryOptions): string {
    // use options.width, options.height, etc.
    const i = +id - 1;
    const image = this._images[i];
    // override width/height
    const w = options.targetWidth || image.width;
    const h = options.targetHeight || image.height;
    const uri = IiifUri.parse(image.uri)!;
    // -1 is a special value to represent omission of w/h
    if (w > -1 && h > -1) {
      uri.size = `!${w},${h}`;
    } else if (w === -1) {
      uri.size = `,${h}`;
    } else if (h === -1) {
      uri.size = `${w},`;
    }
    return uri.toString();
  }

  /**
   * Get the specified image.
   *
   * @param id The image ID, which here is just the ordinal number
   * of the image in its list.
   * @param options The image options.
   */
  public getImage(
    id: string,
    options: SimpleIiifGalleryOptions
  ): Observable<SizedGalleryImage | null> {
    // load if options changed
    if (this.isSourceChanged(options)) {
      return this._http.get<any>(options.baseUri).pipe(
        take(1),
        switchMap((m: any) => {
          this._options = options;
          this.readManifest(m, options);
          const i = +id - 1;
          if (i >= this._images.length) {
            return of(null);
          }
          // rebuild the URI as size must be drawn from options
          const image = {
            ...this._images[i],
            uri: this.buildUri(id, options),
          };
          return of(image);
        })
      );
    } else {
      const i = +id - 1;
      if (i >= this._images.length) {
        return of(null);
      }
      // rebuild the URI as size must be drawn from options
      const image = {
        ...this._images[i],
        uri: this.buildUri(id, options),
      };
      return of(image);
    }
  }
}
