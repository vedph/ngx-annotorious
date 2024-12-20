import { TestBed } from '@angular/core/testing';

import { SimpleIiifGalleryService } from './simple-iiif-gallery.service';

describe('SimpleIiifGalleryService', () => {
  let service: SimpleIiifGalleryService;
  let target: object;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimpleIiifGalleryService);
    target = {
      alpha: 'A',
      beta: 'B',
      colors: ['red', 'green', 'blue'],
      guy: {
        name: 'Eugenio',
        age: 10,
      },
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProperty with "/x" should return null', () => {
    expect(service.getProperty(target, '/x')).toBeNull();
  });

  it('getProperty with "/alpha" should return A', () => {
    expect(service.getProperty<string>(target, '/alpha')).toBe('A');
  });

  it('getProperty with "/beta" should return B', () => {
    expect(service.getProperty<string>(target, '/beta')).toBe('B');
  });

  it('getProperty with "/colors" should return array', () => {
    const a: string[] = service.getProperty<string[]>(target, '/colors')!;
    expect(a).toBeTruthy();
    expect(Array.isArray(a)).toBeTrue();
    expect(a.length).toBe(3);
    expect(a[0]).toBe('red');
    expect(a[1]).toBe('green');
    expect(a[2]).toBe('blue');
  });

  it('getProperty with "/colors[0]" should return red', () => {
    const s: string = service.getProperty<string>(target, '/colors[0]')!;
    expect(s).toBeTruthy();
    expect(s).toBe('red');
  });

  it('getProperty with "/colors[1]" should return green', () => {
    const s: string = service.getProperty<string>(target, '/colors[1]')!;
    expect(s).toBeTruthy();
    expect(s).toBe('green');
  });

  it('getProperty with "/colors[3]" should return null', () => {
    const s: string | null = service.getProperty<string>(target, '/colors[3]')!;
    expect(s).toBeNull();
  });

  it('getProperty with "/guy" should return object', () => {
    const o = service.getProperty<{ name: string; age: number }>(
      target,
      '/guy'
    );
    expect(o).toBeTruthy();
    expect(o!.name).toBe('Eugenio');
    expect(o!.age).toBe(10);
  });

  it('getProperty with "/guy/age" should return 10', () => {
    const n = service.getProperty<number>(
      target,
      '/guy/age'
    );
    expect(n).toBe(10);
  });
});
