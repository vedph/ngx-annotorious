# NgxAnnotorious

📦 `@myrmidon/ngx-annotorious`

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

- [NgxAnnotorious](#ngxannotorious)
  - [Setup](#setup)
  - [Demo App](#demo-app)
  - [ImgAnnotatorDirective](#imgannotatordirective)
  - [ImgAnnotationList](#imgannotationlist)

This library is a minimalist set of components wrapping [Annotorious V3](https://annotorious.dev/) functionalities for use in an Angular application.

>Being designed with a wider context of use, the image annotator can also deal with a completely user-defined model, not necessarily limited to the W3C annotation. In the bigger application where this is going to be used, Annotorious is used to select a portion of an image, while the model to be attached to it is user-defined.

## Setup

1. install Annotorious in your Angular app:
   - `npm i @annotorious/annotorious @myrmidon/ngx-annotorious`.
   - in `angular.json`, add to `styles` the value `"node_modules/@annotorious/annotorious/dist/annotorious.css"`.
2. for this library, in your `app.config`, configure the default **options for Material dialogs**, as annotations metadata are edited inside a popup, e.g.:

```ts
// in appConfig providers array:
{
  provide: MAT_DIALOG_DEFAULT_OPTIONS,
  useValue: {
    hasBackdrop: true,
    maxHeight: '800px',
  },
},
```

## Demo App

In the demo shell workspace hosting this library for development, the homepage uses an image annotator component wrapping some core components:

- a toolbar component for tool selection ([ImgAnnotationToolbar](./projects/myrmidon/ngx-annotorious/src/lib/components/img-annotator-toolbar/img-annotator-toolbar.component.ts));
- an `img` with a simple image loaded from the application assets for demo purposes. This element is decorated with a directive wrapping the Annotorious functionality ([ImgAnnotatorDirective](./projects/myrmidon/ngx-annotorious/src/lib/directives/img-annotator.directive.ts));
- a list of annotations.

## ImgAnnotatorDirective

Directive:

- 🚩 `imgAnnotator`
- 🔑 `ImgAnnotatorDirective`
- ▶️ input:
  - `config` (`AnnotoriousConfig`)
  - `tool` (`DrawingTool`)
  - `annotations` (`ImageAnnotation[]`): the initial annotations to add at start.
  - `selectedAnnotation` (`ImageAnnotation?`)
  - `additionalTools` (`string[]?`)
- 🔥 output:
  - `annotatorInit` (`ImageAnnotator`)
  - `clickAnnotation` (`{annotation: ImageAnnotation, originalEvent: PointerEvent}`)
  - `createAnnotation` (`ImageAnnotation`)
  - `deleteAnnotation` (`ImageAnnotation`)
  - `mouseEnterAnnotation` (`ImageAnnotation`)
  - `mouseLeaveAnnotation` (`ImageAnnotation`)
  - `selectionChanged` (`ImageAnnotation?`)
  - `updateAnnotation` (`{ updated: ImageAnnotation, previous: ImageAnnotation }`)
  - `viewportIntersect` (`ImageAnnotation[]`): for OSD only.

The core of the library is the lightweight directive [ImgAnnotatorDirective](./projects/myrmidon/ngx-annotorious/src/lib/directives/img-annotator.directive.ts) used to wrap an Annotorious annotator.

This takes care of:

- initializing an `ImageAnnotator` instance at the right time in the Angular component lifecycle;
- configure it as required;
- wrap its main functions, and wire up listeners to its events, so that they can be forwarded to its Angular consumer.

## ImgAnnotationList

Class:

- 🔃 properties:
  - `annotations$`: observable of `ListAnnotation<T>[]`.
  - `selectedAnnotation$`: observable of `ListAnnotation<T>` or undefined, representing the currently selected annotation if any.
  - `annotationToString`: a function used to build a string representing a `ListAnnotation<T>`.
  - `image`: the reference `GalleryImage`.
- 👉 methods:
  - `getAnnotations()`
  - `clearAnnotations()`
  - `setAnnotations(annotations: ListAnnotation<T>[])`
  - `removeAnnotation(id: string)`
  - `editAnnotation(annotation: ImageAnnotation)`
  - `selectAnnotation(annotation?: ListAnnotation<T>)`
  - `editAnnotationAt(index: number)`
  - `selectAnnotationAt(index: number)`
  - `removeAnnotationAt(index: number)`
- 🔥 event handlers:
  - `onCreateAnnotation(annotation: ImageAnnotation)`
  - `onSelectionChange(annotation?: ImageAnnotation)`
  - `onDeleteAnnotation(annotation: ImageAnnotation)`

The core logic for orchestrating events and actions for the wrapped annotator is implemented in a generic `ImgAnnotationList` class. This keeps its own storage of annotations, so that it includes any third-party model, whatever its complexity, attached to the selected portion of an image; and provides a simple API surface to be consumed by other Angular components.

The extended annotation model for this list, `ListAnnotation<T>`, is a wrapper for the Annotorious annotation including:

- `id`: an ID, equal to that of the wrapped annotation (`string`);
- `image`: a reference image (`GalleryImage`);
- `value`: the Annotorious annotation (`ImageAnnotation`);
- `payload`: an additional payload of type `T`.

This custom model is stored in a parallel storage mantained by the image annotator component. This storage is kept in synch with the `ImageAnnotator` storage by listening to its deletion and selection change events.

In the end, on the Angular side only the list synched storage is important, because it will hold all the annotations generated by the `ImageAnnotator` wrapped in a larger structure.
