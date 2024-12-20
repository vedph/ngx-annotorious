import { Inject, Injectable } from '@angular/core';
import { GalleryOptions, IMAGE_GALLERY_OPTIONS_KEY } from '../models';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service for managing the gallery options. The default options are provided
 * by the `IMAGE_GALLERY_OPTIONS_KEY` injection token. You can then update
 * them, get them, or subscribe to them.
 */
@Injectable({
  providedIn: 'root',
})
export class GalleryOptionsService {
  private _data$: BehaviorSubject<GalleryOptions>;

  constructor(
    @Inject(IMAGE_GALLERY_OPTIONS_KEY)
    data: GalleryOptions
  ) {
    this._data$ = new BehaviorSubject<GalleryOptions>(data);
  }

  public select(): Observable<GalleryOptions> {
    return this._data$.asObservable();
  }

  public set(data: GalleryOptions): void {
    this._data$.next(data);
  }

  public get(): GalleryOptions {
    return this._data$.value;
  }
}
