import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  untracked,
} from '@angular/core';

import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * A tool in the image annotator toolbar.
 */
export interface ImgAnnotatorToolbarTool {
  /**
   * The tool ID, as registered in Annotorious (e.g. `rectangle`).
   */
  id: string;
  /**
   * The Material icon name.
   */
  icon: string;
  /**
   * The tooltip and accessible label.
   */
  tip: string;
}

/**
 * The default tools available in Annotorious.
 */
export const DEFAULT_IMG_ANNOTATOR_TOOLS: readonly ImgAnnotatorToolbarTool[] =
  Object.freeze([
    { id: 'rectangle', icon: 'rectangle', tip: 'Rectangle' },
    { id: 'polygon', icon: 'polyline', tip: 'Polygon' },
  ]);

/**
 * The toolbar for the image annotator. Bind its `tool` model to the
 * annotator directive's `tool` input, e.g. `[(tool)]="tool"`.
 */
@Component({
  selector: 'img-annotator-toolbar',
  templateUrl: './img-annotator-toolbar.component.html',
  styleUrl: './img-annotator-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggleModule, MatIconModule, MatTooltipModule],
})
export class ImgAnnotatorToolbarComponent {
  /**
   * The tools to display in the toolbar.
   */
  public readonly tools = input<readonly ImgAnnotatorToolbarTool[]>(
    DEFAULT_IMG_ANNOTATOR_TOOLS
  );

  /**
   * The selected tool ID.
   */
  public readonly tool = model<string>('rectangle');

  /**
   * True to disable the toolbar.
   */
  public readonly disabled = input<boolean>(false);

  constructor() {
    // ensure that the selected tool is one of the available tools
    effect(() => {
      const tools = this.tools();
      untracked(() => {
        if (tools.length && !tools.some((t) => t.id === this.tool())) {
          this.tool.set(tools[0].id);
        }
      });
    });
  }

  protected onChange(event: MatButtonToggleChange): void {
    if (event.value) {
      this.tool.set(event.value);
    }
  }
}
