import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  ImgAnnotatorToolbarComponent,
  ImgAnnotatorToolbarTool,
  DEFAULT_IMG_ANNOTATOR_TOOLS,
} from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';

@Component({
  selector: 'app-img-annotator-toolbar-pg',
  templateUrl: './img-annotator-toolbar-pg.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatSlideToggleModule, ImgAnnotatorToolbarComponent],
})
export class ImgAnnotatorToolbarPgComponent {
  private readonly _extraTools: ImgAnnotatorToolbarTool[] = [
    ...DEFAULT_IMG_ANNOTATOR_TOOLS,
    { id: 'ellipse', icon: 'radio_button_unchecked', tip: 'Ellipse (plugin)' },
  ];

  protected readonly tool = signal('rectangle');
  protected readonly extended = signal(false);

  protected readonly tools = computed<readonly ImgAnnotatorToolbarTool[]>(() =>
    this.extended() ? this._extraTools : DEFAULT_IMG_ANNOTATOR_TOOLS
  );
}
