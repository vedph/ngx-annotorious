import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Observable, of, throwError } from 'rxjs';

import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';

import { GalleryListComponent } from './gallery-list.component';
import {
  GalleryFilter,
  GalleryService,
  IMAGE_GALLERY_OPTIONS_KEY,
  IMAGE_GALLERY_SERVICE_KEY,
} from '../../models';
import {
  filterGalleryImages,
  getDataPage,
} from '../../services/mock-gallery.service';

const IMAGES: GalleryImage[] = Array.from({ length: 8 }, (_, i) => ({
  id: `${i + 1}`,
  uri: `https://images.test/${i + 1}.jpg`,
  title: `image ${i + 1}`,
  description: i === 0 ? 'the first one' : undefined,
}));

class TestGalleryService implements GalleryService {
  public fail = false;
  public cleared = 0;

  public getImages(
    filter: GalleryFilter,
    pageNumber: number,
    pageSize: number
  ): Observable<DataPage<GalleryImage>> {
    if (this.fail) {
      return throwError(() => new Error('network error'));
    }
    return of(
      getDataPage(filterGalleryImages(IMAGES, filter), pageNumber, pageSize)
    );
  }

  public getImage(id: string): Observable<GalleryImage | null> {
    return of(IMAGES.find((i) => i.id === id) || null);
  }

  public clearCache(): void {
    this.cleared++;
  }
}

async function setup(
  inputs: Record<string, unknown> = {},
  service = new TestGalleryService()
) {
  const imagePick = vi.fn();
  const result = await render(GalleryListComponent, {
    inputs,
    on: { imagePick },
    providers: [
      { provide: IMAGE_GALLERY_SERVICE_KEY, useValue: service },
      {
        provide: IMAGE_GALLERY_OPTIONS_KEY,
        useValue: { baseUri: '', width: 150, height: 200, pageSize: 3 },
      },
    ],
  });
  await result.fixture.whenStable();
  return { ...result, imagePick, service };
}

describe('GalleryListComponent', () => {
  it('should load and render the first page', async () => {
    await setup();
    const images = screen.getAllByRole('img');
    expect(images.map((i) => i.getAttribute('alt'))).toEqual([
      'image 1',
      'image 2',
      'image 3',
    ]);
    expect(images[0].getAttribute('src')).toBe('https://images.test/1.jpg');
    expect(images[0].getAttribute('width')).toBe('150');
    expect(images[0].getAttribute('loading')).toBe('lazy');
    expect(screen.getByText('the first one')).toBeTruthy();
  });

  it('should emit imagePick when an image is picked', async () => {
    const { imagePick } = await setup();
    await userEvent.click(screen.getByRole('button', { name: 'pick image 2' }));
    expect(imagePick).toHaveBeenCalledWith(IMAGES[1]);
  });

  it('should go to the next page', async () => {
    const { fixture } = await setup();
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    await fixture.whenStable();
    expect(
      screen.getAllByRole('img').map((i) => i.getAttribute('alt'))
    ).toEqual(['image 4', 'image 5', 'image 6']);
  });

  it('should highlight the selected image', async () => {
    await setup({ selectedId: '2' });
    const figure = screen
      .getByRole('button', { name: 'pick image 2' })
      .closest('figure')!;
    expect(figure.classList.contains('selected')).toBe(true);
  });

  it('should hide the filter when requested', async () => {
    const { container } = await setup({ filterVisible: false });
    expect(container.querySelector('cadmus-gallery-filter')).toBeNull();
  });

  it('should reset on reload', async () => {
    const { service, fixture } = await setup();
    await userEvent.click(screen.getByRole('button', { name: 'reload images' }));
    await fixture.whenStable();
    expect(service.cleared).toBe(1);
  });

  it('should show load errors', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const service = new TestGalleryService();
    service.fail = true;
    await setup({}, service);
    expect(screen.getByRole('alert').textContent).toContain('network error');
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    error.mockRestore();
  });
});
