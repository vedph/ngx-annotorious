import { inject, Injectable, signal } from '@angular/core';

import { GalleryOptions, IMAGE_GALLERY_OPTIONS_KEY } from '../models';

/**
 * Service for managing the gallery options. The default options are provided
 * by the `IMAGE_GALLERY_OPTIONS_KEY` injection token. You can then update
 * them, get them, or react to their changes via the `options` signal.
 */
@Injectable({
  providedIn: 'root',
})
export class GalleryOptionsService {
  private readonly _options = signal<GalleryOptions>(
    inject(IMAGE_GALLERY_OPTIONS_KEY)
  );

  /**
   * The current options.
   */
  public readonly options = this._options.asReadonly();

  /**
   * Get the current options.
   */
  public get(): GalleryOptions {
    return this._options();
  }

  /**
   * Set the options.
   * @param options The new options.
   */
  public set(options: GalleryOptions): void {
    this._options.set(options);
  }

  /**
   * Update some of the options.
   * @param options The options to change.
   */
  public patch(options: Partial<GalleryOptions>): void {
    this._options.update((o) => ({ ...o, ...options }));
  }
}
