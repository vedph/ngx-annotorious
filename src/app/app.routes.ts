import { Routes } from '@angular/router';

import { ImgAnnotationPgComponent } from './components/img-annotation-pg/img-annotation-pg.component';
import { ImgAnnotatorToolbarPgComponent } from './components/img-annotator-toolbar-pg/img-annotator-toolbar-pg.component';
import { GalleryImageAnnotatorPgComponent } from './components/gallery-image-annotator-pg/gallery-image-annotator-pg.component';

export const routes: Routes = [
  { path: '', component: ImgAnnotationPgComponent, pathMatch: 'full' },
  // toolbar
  {
    path: 'toolbar',
    component: ImgAnnotatorToolbarPgComponent,
  },
  // cadmus/img-gallery
  {
    path: 'cadmus/img-gallery',
    component: GalleryImageAnnotatorPgComponent,
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: ImgAnnotationPgComponent },
];
