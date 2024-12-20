import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';

import { ImgAnnotatorToolbarComponent } from '../../../../projects/myrmidon/ngx-annotorious/src/public-api';

@Component({
  selector: 'app-img-annotator-toolbar-pg',
  templateUrl: './img-annotator-toolbar-pg.component.html',
  styleUrls: ['./img-annotator-toolbar-pg.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    ImgAnnotatorToolbarComponent,
  ],
})
export class ImgAnnotatorToolbarPgComponent {
  public tool?: string;

  public onToolChange(tool: string): void {
    this.tool = tool;
  }
}
