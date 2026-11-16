import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';

import { GalleryListRepository } from './gallery-list.repository';
import {
  GalleryFilter,
  GalleryOptions,
  GalleryService,
  IMAGE_GALLERY_OPTIONS_KEY,
  IMAGE_GALLERY_SERVICE_KEY,
} from './models';
import { GalleryOptionsService } from './services/gallery-options.service';
import { getDataPage } from './services/mock-gallery.service';

const IMAGES: GalleryImage[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  uri: `u${i + 1}`,
  title: `t${i + 1}`,
}));

class TestGalleryService implements GalleryService {
  public calls: { filter: GalleryFilter; page: number; size: number }[] = [];
  public cleared = 0;
  public next?: () => Observable<DataPage<GalleryImage>>;

  public getImages(
    filter: GalleryFilter,
    pageNumber: number,
    pageSize: number
  ): Observable<DataPage<GalleryImage>> {
    this.calls.push({ filter, page: pageNumber, size: pageSize });
    if (this.next) {
      return this.next();
    }
    const items = filter['title']
      ? IMAGES.filter((i) => i.title === filter['title'])
      : IMAGES;
    return of(getDataPage(items, pageNumber, pageSize));
  }

  public getImage(id: string): Observable<GalleryImage | null> {
    return of(IMAGES.find((i) => i.id === id) || null);
  }

  public clearCache(): void {
    this.cleared++;
  }
}

describe('GalleryListRepository', () => {
  let service: TestGalleryService;
  let repository: GalleryListRepository;

  beforeEach(() => {
    service = new TestGalleryService();
    TestBed.configureTestingModule({
      providers: [
        { provide: IMAGE_GALLERY_SERVICE_KEY, useValue: service },
        {
          provide: IMAGE_GALLERY_OPTIONS_KEY,
          useValue: { baseUri: '', pageSize: 5 } as GalleryOptions,
        },
      ],
    });
    repository = TestBed.inject(GalleryListRepository);
  });

  it('should be empty and not load until requested', () => {
    expect(repository.page().items).toEqual([]);
    expect(repository.empty()).toBe(true);
    expect(service.calls).toHaveLength(0);
  });

  it('ensureLoaded should load the first page once', async () => {
    await repository.ensureLoaded();
    await repository.ensureLoaded();
    expect(service.calls).toEqual([{ filter: {}, page: 1, size: 5 }]);
    expect(repository.page().items.map((i) => i.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(repository.loading()).toBe(false);
  });

  it('setPage should load the requested page', async () => {
    await repository.setPage(3);
    expect(repository.page().pageNumber).toBe(3);
    expect(repository.page().items.map((i) => i.id)).toEqual(['11', '12']);

    await repository.setPage(1, 10);
    expect(repository.page().items).toHaveLength(10);
  });

  it('setFilter should set the filter and load the first page', async () => {
    await repository.setPage(2);
    await repository.setFilter({ title: 't7' });
    expect(repository.filter()).toEqual({ title: 't7' });
    expect(repository.getFilter()).toEqual({ title: 't7' });
    expect(repository.page().pageNumber).toBe(1);
    expect(repository.page().items.map((i) => i.id)).toEqual(['7']);
  });

  it('reset should clear filter and cache', async () => {
    await repository.setFilter({ title: 't7' });
    await repository.reset();
    expect(service.cleared).toBe(1);
    expect(repository.filter()).toEqual({});
    expect(repository.page().total).toBe(12);
  });

  it('should track loading', async () => {
    const subject = new Subject<DataPage<GalleryImage>>();
    service.next = () => subject;
    const promise = repository.setPage(1);
    expect(repository.loading()).toBe(true);
    subject.next(getDataPage(IMAGES, 1, 5));
    subject.complete();
    await promise;
    expect(repository.loading()).toBe(false);
  });

  it('should discard stale responses', async () => {
    const slow = new Subject<DataPage<GalleryImage>>();
    service.next = () => slow;
    const first = repository.setPage(1);
    service.next = undefined;
    await repository.setPage(2);
    slow.next(getDataPage(IMAGES, 1, 5));
    slow.complete();
    await first;
    expect(repository.page().pageNumber).toBe(2);
  });

  it('should expose errors', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    service.next = () => throwError(() => new Error('boom'));
    await repository.setPage(1);
    expect(repository.error()).toBe('boom');
    expect(repository.page().items).toEqual([]);
    expect(repository.loading()).toBe(false);

    service.next = undefined;
    await repository.setPage(1);
    expect(repository.error()).toBeNull();
    error.mockRestore();
  });

  it('should reset when options change after the first load', async () => {
    await repository.ensureLoaded();
    TestBed.inject(GalleryOptionsService).patch({ pageSize: 3 });
    TestBed.tick();
    await new Promise((r) => setTimeout(r));
    expect(service.cleared).toBe(1);
    expect(repository.page().pageSize).toBe(3);
  });
});
