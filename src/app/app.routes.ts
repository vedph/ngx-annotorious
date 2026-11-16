import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/img-annotation-pg/img-annotation-pg.component').then(
        (m) => m.ImgAnnotationPgComponent
      ),
  },
  {
    path: 'other/toolbar',
    loadComponent: () =>
      import(
        './components/img-annotator-toolbar-pg/img-annotator-toolbar-pg.component'
      ).then((m) => m.ImgAnnotatorToolbarPgComponent),
  },
  {
    path: 'other/img-gallery',
    loadComponent: () =>
      import(
        './components/gallery-image-annotator-pg/gallery-image-annotator-pg.component'
      ).then((m) => m.GalleryImageAnnotatorPgComponent),
  },
  {
    path: 'osd/annotator',
    loadComponent: () =>
      import(
        './components/osd-img-annotation-pg/osd-img-annotation-pg.component'
      ).then((m) => m.OsdImgAnnotationPgComponent),
  },
  { path: '**', redirectTo: 'home' },
];
