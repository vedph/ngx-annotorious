# CadmusImgGalleryIiif

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

📦 `@myrmidon/cadmus-img-gallery-iiif`

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

- [CadmusImgGalleryIiif](#cadmusimggalleryiiif)
  - [Overview](#overview)
  - [Services](#services)
  - [Components](#components)
  - [Setup](#setup)

## Overview

The IIIF image gallery is a minimalist set of components used to:

- show a gallery of images from some online source.
- let users pick an image and annotate it.

These components are independent from any specific servicing technology; images could be served by IIIF, cloud stores, etc.; you are free to provide your own service to get a page of images, and a single image, with the desired sizes. Even the filters used to browse the list of images are totally open, so that you can define as many filters as you want, according to your own data.

The general idea behind these components is having a Cadmus part to create annotations on images. Its only tasks are (1) presenting a gallery of images to pick from, and (2) allowing users to create variously shaped regions on the selected image, each linked with a unique ID (a GUID), and optional note and tags.

Once you create these annotations, you will be able to use other parts to link them to any type of specialized data via their ID. So, all what the image annotator does is letting users delimit one or more regions with any geometric shape, associating each with an annotation having a globally unique ID (GUID), and eventually a body consisting of any number of text notes and tags. This way, each annotation (and consequently each region on the image) gets its own unique ID, which can be referenced from elsewhere in the context of the Cadmus database. This allows attaching to portions of images any kind of data and models, all edited in the same environment. Once they are in the database, we can eventually export them by creating W3C annotations, IIIF manifests, etc.

Also, as usual in Cadmus, annotation IDs are opaque (and so they are supposed to be), just like items or parts IDs; yet, at least in the context of the editor more user-friendly IDs are welcome. As explained [here](https://myrmex.github.io/overview/cadmus/dev/concepts/lookup), in other Cadmus parts, user friendly IDs are got via EID's (entity IDs); these are either aliases of entities which already have their own global ID (a GUID), like items; or identifiers assigned to entities inside a part. In both cases, they can be referenced via a lookup UI, where you just type some characters belonging to the ID to get a list of the first matching IDs.

To apply the same approach in the context of image annotations, we just define a convention by which you can assign an EID to any annotation via a tag beginning with `eid_`. For instance, if you draw a rectangle around some region of an image, and assign it the tag `eid_sample`, by convention this means that the annotation linked to that region will get an EID equal to `sample`.

The annotation editor can also be embedded in a bigger component, like a custom part for annotating images while providing specialized models for each annotation. In this case, you can interact with the embedded component by setting custom actions for it, like in this example:

```html
<cadmus-gallery-img-annotator
  [image]="image"
  [annotations]="annotations.value"
  [customActions]="actions"
  (annotationsChange)="onAnnotationsChange($any($event))"
  (actionRequest)="onActionRequest($event)"
></cadmus-gallery-img-annotator>
```

with a code like:

```ts
public onAnnotationsChange(annotations: ChgcImageAnnotation[]): void {
  // annotations has type FormControl<MyOwnImageAnnotation[]>,
  // which extends GalleryImageAnnotation
  this.annotations.setValue(annotations);
  this.annotations.updateValueAndValidity();
  this.annotations.markAsDirty();
}

public onActionRequest(action: BarCustomActionRequest): void {
  if (action.id === 'edit-meta') {
    const i = +action.payload;  // the action payload is the annotation index
    this.editAnnotation(this.annotations.value[i], i);
  }
}
```

>Note that this library depends on `@myrmidon/cadmus-img-annotator`, which in turn requires the Annotorious package.

## Services

A gallery image is any object implementing the `GalleryImage` interface, which provides the barely minimum properties of each image: a string ID, a URI, a title, and a short description.

Related services are:

- **gallery service**, with its injection token. You will provide your own real-world service, which might draw images from IIIF services, cloud services, etc.
- **gallery options service**, used as the singleton holding options for the gallery. Options are equal to or derive from `GalleryOptions`. You can access the options and change them by injecting this service.
- a **mock gallery service** implementation, using an online mock images service. This is used during development as a convenient placeholder instead of your custom service.
- **lorem ipsum service**, used by the mock gallery service to generate image descriptions.

A gallery service is any service implementing the `GalleryService` interface, having just two methods: one to retrieve a page of images, and another to retrieve a single image. In both cases, you can specify image options (first of all the size) via options, which implement interface `GalleryOptions`. The service is stateless, except for the fact that it caches the options when first used, and reacts to their change from usage to usage.

Also, the list of images in the gallery can be filtered using an implementation of `GalleryFilter`. This is just a set of key/value pairs, both represented by strings. Usually you will draw a set of keys to show in the filter UI from some thesaurus.

For instance, to filter images by title you will set a filter property with key=`title` and value equal to any portion of the title to match.

## Components

- **gallery filter**, to define any number of name=value pairs representing filters applied to the gallery images. The filter gets the gallery list repository injected, so it directly invokes its methods.
  - ➡️ input:
    - `entries: ThesaurusEntry[] | undefined`: the entries used to represent image gallery metadata filters. Each entry is a metadatum, with ID=metadatum name and value=label. If not set, users will be allowed to freely type a name rather than picking it from a list.

- **gallery images list**, to browse a list of images via a gallery service implementation. The type of implementation used is defined by your consumer application (via DI as specified in `app.module` providers). Both the list and its filter depend on the same **repository**, which provides paged data to the UI.
  - ➡️ input:
  - `entries: ThesaurusEntry[] | undefined`: the entries used to represent image gallery metadata filters. Each entry is a metadatum, with ID=metadatum name and value=label. If not set, users will be allowed to freely type a name rather than picking it from a list.
  - ⬅️ output:
    - `imagePick: EventEmitter<GalleryImage>`

- _gallery image annotator_, to annotate an image picked from a gallery by drawing rectangular or polygonal regions on it.

## Setup

To use this brick in your Cadmus frontend app:

(1) install packages:

```bash
npm i @recogito/annotorious @myrmidon/cadmus-img-annotator @myrmidon/cadmus-img-gallery
```

(2) ensure to add Annotorious CSS styles to your `angular.json` like:

```json
"styles": [
  "node_modules/@angular/material/prebuilt-themes/indigo-pink.css",
  "node_modules/@recogito/annotorious/dist/annotorious.min.css",
  "src/styles.css"
]
```

(3) import modules in your `app.module.ts` and inject the required image service and default options (you can then change them later via `GalleryOptionsService`):

```ts
import { CadmusImgAnnotatorModule } from '@myrmidon/cadmus-img-annotator';
import { CadmusImgGalleryModule } from '@myrmidon/cadmus-img-gallery';

@NgModule({
  // ...
  imports: [
    // ...
    CadmusImgAnnotatorModule,
    CadmusImgGalleryModule,
  ],
  providers: [
    // image gallery: TODO replace with your own
    {
      provide: IMAGE_GALLERY_SERVICE_KEY,
      useClass: MockGalleryService,
    },
    {
      provide: IMAGE_GALLERY_OPTIONS_KEY,
      useValue: {
        baseUri: '',
        count: 50,
        width: 300,
        height: 400,
      },
    },
  ]
  // ...
})
export class AppModule {}
```

(4) if you want to lookup annotations by their EID, be sure to include the corresponding lookup definition like:

```ts
import { IndexLookupDefinitions } from '@myrmidon/cadmus-core';
import {
  GALLERY_IMAGE_ANNOTATIONS_PART_TYPEID,
} from '@myrmidon/cadmus-part-general-ui';

export const INDEX_LOOKUP_DEFINITIONS: IndexLookupDefinitions = {
  // ...
  // gallery
  img_anno_eid: {
    typeId: GALLERY_IMAGE_ANNOTATIONS_PART_TYPEID,
    name: 'eid',
  },
};
```
