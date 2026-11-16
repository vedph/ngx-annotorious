# CadmusImgGalleryIiif

📦 `@myrmidon/cadmus-img-gallery-iiif`

- [CadmusImgGalleryIiif](#cadmusimggalleryiiif)
  - [Overview](#overview)
  - [SimpleIiifGalleryService](#simpleiiifgalleryservice)
  - [IiifUri](#iiifuri)
  - [Setup](#setup)

## Overview

This library provides a simple [IIIF](https://iiif.io) implementation of the `GalleryService` defined by [@myrmidon/cadmus-img-gallery](../cadmus-img-gallery/README.md), so that the gallery can show the images listed in a IIIF manifest. See the gallery library for an overview of the gallery components and of the image annotations workflow.

## SimpleIiifGalleryService

This essential IIIF service loads the list of images from a JSON manifest, extracting it from a designated path. The list is cached in memory. It is reloaded only when its source options (`manifestUri`, `arrayPath`, `resourcePath`, `labelPath`, `skip`, `limit`) change, or when `clearCache` is called (the gallery list repository calls it on reset). Failed downloads are not cached. Requests bypass the HTTP interceptors, so that no authorization header is sent to third-party servers.

Options (`SimpleIiifGalleryOptions`, extending `GalleryOptions`):

- `manifestUri`: the URI of the JSON manifest.
- `arrayPath`: the path to the array of objects representing images, e.g. `sequences[0]/canvases`. A path is made of property names, each optionally followed by an array indexer, separated by slashes.
- `resourcePath`: the path to the image resource in each item of the array, e.g. `images[0]/resource`. The resource ID is read from `@id` (IIIF v2) or `id` (IIIF v3).
- `labelPath`: the optional path to the image label in each item, e.g. `label`. Labels can be strings, arrays of strings or `@value` objects (v2), or language maps (v3).
- `width`, `height`: the size of the gallery thumbnails.
- `targetWidth`, `targetHeight`: the size of the image to annotate. Leave a value unset to use the size from the manifest, or set it to -1 to omit it (e.g. `800,`).
- `skip`, `limit`: optionally skip some images at the start of the list, and limit the number of images.

Image IDs are the ordinal numbers (1-N) of the images in the manifest list. Images can be filtered by `title` (case-insensitive substring). Non-IIIF image URIs are returned unchanged.

## IiifUri

A minimal parser and renderer for [IIIF Image API](https://iiif.io/api/image/3.0/#image-request-uri-syntax) URIs (`{scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}`), used to resize images:

```ts
const uri = IiifUri.parse(
  'https://server.edu/iiif/abc/full/full/0/default.jpg'
);
uri!.size = '!300,400';
uri!.toString(); // https://server.edu/iiif/abc/full/!300,400/0/default.jpg
```

## Setup

(1) install the packages:

```bash
pnpm add @annotorious/annotorious @myrmidon/ngx-annotorious @myrmidon/cadmus-img-gallery @myrmidon/cadmus-img-gallery-iiif
```

(2) provide `HttpClient`, the IIIF gallery service and its options in your app config:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    // ...
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
      } as SimpleIiifGalleryOptions,
    },
  ],
};
```
