import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { GalleryImage } from '@myrmidon/ngx-annotorious';

import {
  filterGalleryImages,
  getDataPage,
  MockGalleryOptions,
  MockGalleryService,
} from './mock-gallery.service';

const IMAGES: GalleryImage[] = [
  { id: '1', uri: 'a', title: 'Alpha', description: 'first image' },
  { id: '2', uri: 'b', title: 'Beta', description: 'Second picture' },
  { id: '3', uri: 'c', title: 'alphabet' },
];

describe('filterGalleryImages', () => {
  it('should return all images for an empty filter', () => {
    expect(filterGalleryImages(IMAGES, {})).toBe(IMAGES);
    expect(filterGalleryImages(IMAGES, null)).toBe(IMAGES);
  });

  it('should filter by title case-insensitively', () => {
    expect(filterGalleryImages(IMAGES, { title: 'ALPHA' }).map((i) => i.id))
      .toEqual(['1', '3']);
  });

  it('should filter by description or dsc', () => {
    expect(
      filterGalleryImages(IMAGES, { description: 'second' }).map((i) => i.id)
    ).toEqual(['2']);
    expect(filterGalleryImages(IMAGES, { dsc: 'image' }).map((i) => i.id))
      .toEqual(['1']);
  });

  it('should combine filters', () => {
    expect(
      filterGalleryImages(IMAGES, { title: 'alpha', dsc: 'first' }).map(
        (i) => i.id
      )
    ).toEqual(['1']);
  });
});

describe('getDataPage', () => {
  const items = Array.from({ length: 7 }, (_, i) => i + 1);

  it('should get the first page', () => {
    expect(getDataPage(items, 1, 3)).toEqual({
      total: 7,
      pageCount: 3,
      pageNumber: 1,
      pageSize: 3,
      items: [1, 2, 3],
    });
  });

  it('should get the last partial page', () => {
    expect(getDataPage(items, 3, 3).items).toEqual([7]);
  });

  it('should return no items beyond the last page', () => {
    expect(getDataPage(items, 4, 3).items).toEqual([]);
  });

  it('should normalize invalid page number and size', () => {
    const page = getDataPage(items, 0, 0);
    expect(page.pageNumber).toBe(1);
    expect(page.pageSize).toBe(1);
    expect(page.items).toEqual([1]);
  });
});

describe('MockGalleryService', () => {
  let service: MockGalleryService;
  const options: MockGalleryOptions = {
    baseUri: '',
    count: 25,
    width: 300,
    height: 400,
  };

  beforeEach(() => {
    service = TestBed.inject(MockGalleryService);
  });

  it('should seed and page images', async () => {
    const page = await firstValueFrom(service.getImages({}, 2, 10, options));
    expect(page.total).toBe(25);
    expect(page.pageCount).toBe(3);
    expect(page.items.map((i) => i.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `${i + 11}`)
    );
    expect(page.items[0].uri).toBe('https://loremflickr.com/300/400?lock=11');
    expect(page.items[0].title).toBe('image #00011');
    expect(page.items[0].description).toBeTruthy();
  });

  it('should filter by title', async () => {
    const page = await firstValueFrom(
      service.getImages({ title: '#0002' }, 1, 10, options)
    );
    expect(page.items.map((i) => i.id)).toEqual([
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
    ]);
  });

  it('should get a single image with the requested size', async () => {
    const image = await firstValueFrom(
      service.getImage('3', { ...options, width: 800, height: undefined })
    );
    expect(image?.id).toBe('3');
    expect(image?.uri).toBe('https://loremflickr.com/800?lock=3');
  });

  it('should return null for unknown images', async () => {
    expect(await firstValueFrom(service.getImage('0', options))).toBeNull();
    expect(await firstValueFrom(service.getImage('99', options))).toBeNull();
    expect(await firstValueFrom(service.getImage('x', options))).toBeNull();
  });
});
