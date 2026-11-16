import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';

import type { ImageAnnotation, ImageAnnotator } from '@annotorious/annotorious';

import { ImgAnnotatorDirective } from './img-annotator.directive';
import { AnnotoriousConfig } from '../models';
import { createTestAnnotation } from '../testing/fake-annotator';

// jsdom does not load images: simulate their natural size
const size = { width: 0, height: 0 };

function stubImageSize(width: number, height: number): void {
  size.width = width;
  size.height = height;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImgAnnotatorDirective],
  template: `
    <div data-testid="container">
      @if (visible()) {
        <img
          alt="test"
          imgAnnotator
          #ann="imgAnnotator"
          [config]="config()"
          [tool]="tool()"
          [drawingEnabled]="drawingEnabled()"
          [annotations]="annotations()"
          [selectedAnnotation]="selected()"
          (annotatorInit)="onInit($event)"
        />
      }
    </div>
  `,
})
class HostComponent {
  public readonly visible = signal(true);
  public readonly config = signal<AnnotoriousConfig | undefined>(undefined);
  public readonly tool = signal('rectangle');
  public readonly drawingEnabled = signal<boolean | undefined>(undefined);
  public readonly annotations = signal<ImageAnnotation[] | undefined>(
    undefined
  );
  public readonly selected = signal<string | undefined>(undefined);
  public readonly inits: ImageAnnotator[] = [];

  public onInit(annotator: ImageAnnotator): void {
    this.inits.push(annotator);
  }
}

describe('ImgAnnotatorDirective', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => size.width,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
      configurable: true,
      get: () => size.height,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
  });

  afterAll(() => {
    delete (HTMLImageElement.prototype as any).naturalWidth;
    delete (HTMLImageElement.prototype as any).naturalHeight;
    delete (HTMLImageElement.prototype as any).complete;
  });

  async function setup() {
    const result = await render(HostComponent);
    await result.fixture.whenStable();
    const host = result.fixture.componentInstance;
    const container = result.getByTestId('container');
    const img = () => container.querySelector('img') as HTMLImageElement;
    return { ...result, host, container, img };
  }

  async function loadImage(
    fixture: { whenStable(): Promise<unknown> },
    img: HTMLImageElement,
    width = 400,
    height = 300
  ) {
    stubImageSize(width, height);
    img.dispatchEvent(new Event('load'));
    await fixture.whenStable();
  }

  beforeEach(() => stubImageSize(0, 0));

  it('should not create the annotator before the image is loaded', async () => {
    const { host } = await setup();
    expect(host.inits).toHaveLength(0);
  });

  it('should create the annotator when the image is already loaded', async () => {
    stubImageSize(400, 300);
    const { host, img } = await setup();
    expect(host.inits).toHaveLength(1);
    // Annotorious wraps the image
    expect(img().parentElement).toBe(host.inits[0].element);
  });

  it('should create the annotator on image load', async () => {
    const { host, img, fixture } = await setup();
    await loadImage(fixture, img());
    expect(host.inits).toHaveLength(1);
  });

  it('should not recreate the annotator when an image with the same size loads', async () => {
    const { host, img, fixture } = await setup();
    await loadImage(fixture, img());
    await loadImage(fixture, img());
    expect(host.inits).toHaveLength(1);
  });

  it('should recreate the annotator when an image with another size loads', async () => {
    const { host, img, fixture } = await setup();
    await loadImage(fixture, img(), 400, 300);
    await loadImage(fixture, img(), 800, 600);
    expect(host.inits).toHaveLength(2);
    // the image is wrapped only once
    expect(img().parentElement).toBe(host.inits[1].element);
    expect(
      fixture.nativeElement.querySelectorAll('img')
    ).toHaveLength(1);
  });

  it('should recreate the annotator when config changes', async () => {
    const { host, img, fixture } = await setup();
    await loadImage(fixture, img());
    expect(host.inits[0].isDrawingEnabled()).toBe(true);

    host.config.set({ drawingEnabled: false });
    await fixture.whenStable();
    expect(host.inits).toHaveLength(2);
    expect(host.inits[1].isDrawingEnabled()).toBe(false);
  });

  it('should apply tool and drawingEnabled inputs', async () => {
    const { host, img, fixture } = await setup();
    await loadImage(fixture, img());
    const ann = host.inits[0];

    host.tool.set('polygon');
    await fixture.whenStable();
    expect(ann.getDrawingTool()).toBe('polygon');

    host.drawingEnabled.set(false);
    await fixture.whenStable();
    expect(ann.isDrawingEnabled()).toBe(false);
  });

  it('should not throw for an unknown tool', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { host, img, fixture } = await setup();
    await loadImage(fixture, img());
    host.tool.set('nope');
    await fixture.whenStable();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('should apply the annotations and selection inputs', async () => {
    const { host, img, fixture } = await setup();
    host.annotations.set([
      createTestAnnotation('a', 'A'),
      createTestAnnotation('b', 'B', 50),
    ]);
    await loadImage(fixture, img());
    const ann = host.inits[0];
    expect(ann.getAnnotations().map((a) => a.id)).toEqual(['a', 'b']);

    host.selected.set('b');
    await fixture.whenStable();
    expect(ann.getSelected().map((a) => a.id)).toEqual(['b']);

    host.annotations.set([createTestAnnotation('c')]);
    await fixture.whenStable();
    expect(ann.getAnnotations().map((a) => a.id)).toEqual(['c']);
  });

  it('should leave no image nor wrapper when removed', async () => {
    const { host, img, fixture, container } = await setup();
    await loadImage(fixture, img());
    expect(container.querySelector('img')).toBeTruthy();

    host.visible.set(false);
    await fixture.whenStable();
    expect(container.querySelector('img')).toBeNull();
    expect(container.children).toHaveLength(0);
  });
});
