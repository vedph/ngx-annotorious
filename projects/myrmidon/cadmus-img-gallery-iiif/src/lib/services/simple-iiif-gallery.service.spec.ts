import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import {
  getPathProperty,
  SimpleIiifGalleryOptions,
  SimpleIiifGalleryService,
} from './simple-iiif-gallery.service';

const MANIFEST_URI = 'https://server.edu/manifest.json';

function iiif(n: number): string {
  return `https://server.edu/iiif/img${n}/full/full/0/default.jpg`;
}

// a IIIF v2-like manifest with 5 canvases
const MANIFEST = {
  sequences: [
    {
      canvases: Array.from({ length: 5 }, (_, i) => ({
        label: i === 1 ? [{ '@value': 'second' }] : `canvas ${i + 1}`,
        images: [
          {
            resource: {
              '@id': iiif(i + 1),
              '@type': 'dctypes:Image',
              width: 1000,
              height: 2000,
            },
          },
        ],
      })),
    },
  ],
};

const OPTIONS: SimpleIiifGalleryOptions = {
  baseUri: '',
  manifestUri: MANIFEST_URI,
  arrayPath: 'sequences[0]/canvases',
  resourcePath: 'images[0]/resource',
  labelPath: 'label',
  width: 300,
  height: 400,
  targetWidth: 800,
  targetHeight: -1,
};

describe('getPathProperty', () => {
  const target = {
    alpha: 'A',
    colors: ['red', 'green', 'blue'],
    guy: { name: 'Eugenio', age: 10 },
  };

  it('should return null for unmatched paths', () => {
    expect(getPathProperty(target, '/x')).toBeNull();
    expect(getPathProperty(target, '/alpha/x/y')).toBeNull();
    expect(getPathProperty(target, '/colors[3]')).toBeNull();
    expect(getPathProperty(target, '/alpha[0]')).toBeNull();
    expect(getPathProperty(null, '/alpha')).toBeNull();
  });

  it('should get properties', () => {
    expect(getPathProperty<string>(target, '/alpha')).toBe('A');
    expect(getPathProperty<string[]>(target, '/colors')).toEqual([
      'red',
      'green',
      'blue',
    ]);
    expect(getPathProperty<string>(target, 'colors[1]')).toBe('green');
    expect(getPathProperty<number>(target, '/guy/age')).toBe(10);
  });

  it('should return falsy but defined values', () => {
    expect(getPathProperty({ n: 0 }, 'n')).toBe(0);
    expect(getPathProperty({ s: '' }, 's')).toBe('');
  });

  it('should return the target for an empty path', () => {
    expect(getPathProperty(target, '')).toBe(target);
  });
});

describe('SimpleIiifGalleryService', () => {
  let service: SimpleIiifGalleryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SimpleIiifGalleryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('readManifest should read images, labels and sizes', () => {
    const images = service.readManifest(MANIFEST, OPTIONS);
    expect(images).toHaveLength(5);
    expect(images[0]).toEqual({
      id: '1',
      uri: iiif(1),
      title: 'canvas 1',
      width: 1000,
      height: 2000,
    });
    expect(images[1].title).toBe('second');
  });

  it('readManifest should honor skip and limit', () => {
    const images = service.readManifest(MANIFEST, {
      ...OPTIONS,
      skip: 1,
      limit: 2,
    });
    expect(images.map((i) => i.id)).toEqual(['2', '3']);
  });

  it('readManifest should return no images for a wrong path', () => {
    expect(
      service.readManifest(MANIFEST, { ...OPTIONS, arrayPath: 'x' })
    ).toEqual([]);
  });

  it('getImages should load the manifest once and resize thumbnails', async () => {
    const first = firstValueFrom(service.getImages({}, 1, 2, OPTIONS));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    const page = await first;

    expect(page.total).toBe(5);
    expect(page.pageCount).toBe(3);
    expect(page.items.map((i) => i.uri)).toEqual([
      'https://server.edu/iiif/img1/full/!300,400/0/default.jpg',
      'https://server.edu/iiif/img2/full/!300,400/0/default.jpg',
    ]);

    // cached
    const second = await firstValueFrom(service.getImages({}, 3, 2, OPTIONS));
    expect(second.items.map((i) => i.id)).toEqual(['5']);
    http.expectNone(MANIFEST_URI);
  });

  it('getImages should filter by title', async () => {
    const result = firstValueFrom(
      service.getImages({ title: 'SECOND' }, 1, 10, OPTIONS)
    );
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    expect((await result).items.map((i) => i.id)).toEqual(['2']);
  });

  it('getImages should reload when the source changes', async () => {
    const first = firstValueFrom(service.getImages({}, 1, 2, OPTIONS));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    await first;

    const other = 'https://server.edu/other.json';
    const second = firstValueFrom(
      service.getImages({}, 1, 2, { ...OPTIONS, manifestUri: other })
    );
    http.expectOne(other).flush(MANIFEST);
    await second;
  });

  it('getImages should reload after clearCache', async () => {
    const first = firstValueFrom(service.getImages({}, 1, 2, OPTIONS));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    await first;

    service.clearCache();
    const second = firstValueFrom(service.getImages({}, 1, 2, OPTIONS));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    await second;
  });

  it('getImages should not cache errors', async () => {
    const first = firstValueFrom(service.getImages({}, 1, 2, OPTIONS));
    http
      .expectOne(MANIFEST_URI)
      .flush('error', { status: 500, statusText: 'Server Error' });
    await expect(first).rejects.toBeTruthy();

    const second = firstValueFrom(service.getImages({}, 1, 2, OPTIONS));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    expect((await second).total).toBe(5);
  });

  it('getImage should load the manifest from manifestUri and use the target size', async () => {
    const result = firstValueFrom(service.getImage('2', OPTIONS));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    const image = await result;
    expect(image?.id).toBe('2');
    expect(image?.uri).toBe(
      'https://server.edu/iiif/img2/full/800,/0/default.jpg'
    );
  });

  it('getImage should use both target sizes when set', async () => {
    const result = firstValueFrom(
      service.getImage('1', { ...OPTIONS, targetHeight: 600 })
    );
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    expect((await result)?.uri).toBe(
      'https://server.edu/iiif/img1/full/!800,600/0/default.jpg'
    );
  });

  it('getImage should find images by ID when skipping', async () => {
    const options = { ...OPTIONS, skip: 2 };
    const result = firstValueFrom(service.getImage('4', options));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    expect((await result)?.title).toBe('canvas 4');
  });

  it('getImage should return null for invalid or unknown IDs', async () => {
    expect(await firstValueFrom(service.getImage('x', OPTIONS))).toBeNull();
    expect(await firstValueFrom(service.getImage('0', OPTIONS))).toBeNull();

    const result = firstValueFrom(service.getImage('99', OPTIONS));
    http.expectOne(MANIFEST_URI).flush(MANIFEST);
    expect(await result).toBeNull();
  });

  it('should keep non-IIIF URIs unchanged', async () => {
    const manifest = {
      items: [{ resource: { id: 'https://server.edu/plain.jpg' } }],
    };
    const options: SimpleIiifGalleryOptions = {
      ...OPTIONS,
      arrayPath: 'items',
      resourcePath: 'resource',
      labelPath: undefined,
    };
    const result = firstValueFrom(service.getImages({}, 1, 10, options));
    http.expectOne(MANIFEST_URI).flush(manifest);
    const page = await result;
    expect(page.items[0].uri).toBe('https://server.edu/plain.jpg');
    expect(page.items[0].title).toBe('1');
  });
});
