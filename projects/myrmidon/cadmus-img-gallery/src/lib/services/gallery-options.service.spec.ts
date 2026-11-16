import { TestBed } from '@angular/core/testing';

import { GalleryOptionsService } from './gallery-options.service';
import { GalleryOptions, IMAGE_GALLERY_OPTIONS_KEY } from '../models';

describe('GalleryOptionsService', () => {
  const initial: GalleryOptions = { baseUri: 'x', width: 100, pageSize: 5 };
  let service: GalleryOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: IMAGE_GALLERY_OPTIONS_KEY, useValue: initial }],
    });
    service = TestBed.inject(GalleryOptionsService);
  });

  it('should start with the injected options', () => {
    expect(service.get()).toBe(initial);
    expect(service.options()).toBe(initial);
  });

  it('should set options', () => {
    const next: GalleryOptions = { baseUri: 'y' };
    service.set(next);
    expect(service.options()).toBe(next);
  });

  it('should patch options', () => {
    service.patch({ width: 200 });
    expect(service.get()).toEqual({ baseUri: 'x', width: 200, pageSize: 5 });
    // the injected object is not mutated
    expect(initial.width).toBe(100);
  });
});
