import { TestBed } from '@angular/core/testing';

import { GalleryOptionsService } from './gallery-options.service';

describe('GalleryOptionsService', () => {
  let service: GalleryOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GalleryOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
