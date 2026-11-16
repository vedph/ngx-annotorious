import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import {
  DEFAULT_IMG_ANNOTATOR_TOOLS,
  ImgAnnotatorToolbarComponent,
  ImgAnnotatorToolbarTool,
} from './img-annotator-toolbar.component';

describe('ImgAnnotatorToolbarComponent', () => {
  it('should render the default tools with rectangle selected', async () => {
    await render(ImgAnnotatorToolbarComponent);

    const rect = screen.getByRole('radio', { name: 'Rectangle' });
    const polygon = screen.getByRole('radio', { name: 'Polygon' });
    expect(rect.getAttribute('aria-checked')).toBe('true');
    expect(polygon.getAttribute('aria-checked')).toBe('false');
  });

  it('should emit toolChange when a tool is clicked', async () => {
    const toolChange = vi.fn();
    const { fixture } = await render(ImgAnnotatorToolbarComponent);
    // the tool model emits toolChange
    fixture.componentInstance.tool.subscribe(toolChange);

    await userEvent.click(screen.getByRole('radio', { name: 'Polygon' }));

    expect(toolChange).toHaveBeenCalledWith('polygon');
    expect(fixture.componentInstance.tool()).toBe('polygon');
    expect(
      screen.getByRole('radio', { name: 'Polygon' }).getAttribute('aria-checked')
    ).toBe('true');
  });

  it('should reflect the tool input', async () => {
    await render(ImgAnnotatorToolbarComponent, {
      inputs: { tool: 'polygon' },
    });
    expect(
      screen.getByRole('radio', { name: 'Polygon' }).getAttribute('aria-checked')
    ).toBe('true');
  });

  it('should select the first tool when the current one is not available', async () => {
    const tools: ImgAnnotatorToolbarTool[] = [
      { id: 'ellipse', icon: 'circle', tip: 'Ellipse' },
      ...DEFAULT_IMG_ANNOTATOR_TOOLS,
    ];
    const { fixture, rerender } = await render(ImgAnnotatorToolbarComponent, {
      inputs: { tools, tool: 'polygon' },
    });
    expect(fixture.componentInstance.tool()).toBe('polygon');

    await rerender({
      inputs: { tools: [{ id: 'line', icon: 'show_chart', tip: 'Line' }] },
      partialUpdate: true,
    });
    await fixture.whenStable();
    expect(fixture.componentInstance.tool()).toBe('line');
    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });

  it('should disable all the tools when disabled', async () => {
    await render(ImgAnnotatorToolbarComponent, {
      inputs: { disabled: true },
    });
    for (const radio of screen.getAllByRole('radio')) {
      expect((radio as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
