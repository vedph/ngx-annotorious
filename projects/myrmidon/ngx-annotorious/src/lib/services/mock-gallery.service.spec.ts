import { TestBed } from '@angular/core/testing';

import { MockGalleryService } from './mock-gallery.service';

describe('MockGalleryService', () => {
  let service: MockGalleryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockGalleryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
