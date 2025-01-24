import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';

import { routes } from './app.routes';
import {
  SimpleIiifGalleryOptions,
  SimpleIiifGalleryService,
} from '../../projects/myrmidon/cadmus-img-gallery-iiif/src/public-api';
import {
  IMAGE_GALLERY_OPTIONS_KEY,
  IMAGE_GALLERY_SERVICE_KEY,
} from '../../projects/myrmidon/cadmus-img-gallery/src/public-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideAnimationsAsync(),
    provideHttpClient(),
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true,
        maxHeight: '800px',
      },
    },
    // IIIF image gallery
    {
      provide: IMAGE_GALLERY_SERVICE_KEY,
      useClass: SimpleIiifGalleryService,
    },
    {
      provide: IMAGE_GALLERY_OPTIONS_KEY,
      useValue: {
        baseUri: '',
        manifestUri:
          'https://dms-data.stanford.edu/data/manifests/Parker/xj710dc7305/manifest.json',
        arrayPath: 'sequences[0]/canvases',
        resourcePath: 'images[0]/resource',
        labelPath: 'label',
        width: 300,
        height: 400,
        targetWidth: 800,
        targetHeight: -1,
        pageSize: 6,
        // skip: 6
      } as SimpleIiifGalleryOptions,
    },
  ],
};
