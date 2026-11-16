# NgxAnnotorious

📦 `@myrmidon/ngx-annotorious`

- [NgxAnnotorious](#ngxannotorious)
  - [Setup](#setup)
  - [Quick Example](#quick-example)
  - [ImgAnnotatorDirective](#imgannotatordirective)
  - [ImgAnnotatorToolbarComponent](#imgannotatortoolbarcomponent)
  - [ImgAnnotationList](#imgannotationlist)
  - [ImgAnnotationListComponent](#imgannotationlistcomponent)
  - [BasicImgAnnotationListComponent](#basicimgannotationlistcomponent)
  - [Editor Dialog](#editor-dialog)
  - [Selectors](#selectors)

This library is a minimalist set of components wrapping [Annotorious V3](https://annotorious.dev/) for use in an Angular application. It targets **zoneless** Angular apps: all the components are `OnPush`, and their state is exposed via **signals**. Styles only use Angular Material M3 system tokens (`--mat-sys-*`), so they follow the host app's light or dark theme.

>Being designed with a wider context of use, the image annotator can also deal with a completely user-defined model, not necessarily limited to the W3C annotation. In the bigger application where this is going to be used, Annotorious is used to select a portion of an image, while the model attached to it is user-defined.

## Setup

1. Install Annotorious and this library: `pnpm add @annotorious/annotorious @myrmidon/ngx-annotorious`.
2. In `angular.json`, add `"node_modules/@annotorious/annotorious/dist/annotorious.css"` to `styles`.
3. Optionally, in your `app.config`, configure the default **options for Material dialogs**. Annotation payloads are edited inside a dialog, and these options are used when available:

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

## Quick Example

```html
<img-annotator-toolbar [(tool)]="tool" />

<img
  alt="sample"
  src="sample.jpg"
  imgAnnotator
  #ann="imgAnnotator"
  [tool]="tool()"
/>

<ann-basic-img-annotation-list
  [annotator]="ann.annotator()"
  [editorComponent]="editor"
  [image]="image"
  (listInit)="list.set($event)"
/>
```

```ts
export class MyComponent {
  // the dialog component used to edit an annotation payload
  protected readonly editor = MyEditorDialogComponent;
  protected readonly image: GalleryImage = {
    id: '1',
    uri: 'sample.jpg',
    title: 'sample',
  };
  protected readonly tool = signal('rectangle');
  protected readonly list = signal<ImgAnnotationList<MyPayload> | undefined>(
    undefined
  );
}
```

That's all: when the user draws a shape, the editor dialog opens. If the user saves, the annotation is added to the list; if they cancel, the shape is removed. Moving, resizing, deleting and selecting shapes are kept in synch with the list automatically.

## ImgAnnotatorDirective

- 🚩 `img[imgAnnotator]`, exported as `imgAnnotator`
- ▶️ input:
  - `config` (`AnnotoriousConfig`, i.e. the Annotorious options): when it changes, the annotator is recreated. Defaults to `DEFAULT_ANNOTORIOUS_CONFIG`.
  - `tool` (`DrawingTool`, default `rectangle`)
  - `drawingEnabled` (`boolean?`)
  - `annotations` (`ImageAnnotation[]?`): when set, it replaces the annotator's annotations (unless they are equal). Leave it unset when annotations are managed by an `ImgAnnotationList`.
  - `selectedAnnotation` (`ImageAnnotation | string | null?`)
- 🔃 `annotator`: signal with the current `ImageAnnotator`.
- 🔥 output:
  - `annotatorInit` (`ImageAnnotator`): fires whenever a new annotator is created.
  - `clickAnnotation` (`{annotation, originalEvent}`)
  - `createAnnotation` (`ImageAnnotation`)
  - `deleteAnnotation` (`ImageAnnotation`)
  - `mouseEnterAnnotation` (`ImageAnnotation`)
  - `mouseLeaveAnnotation` (`ImageAnnotation`)
  - `selectionChanged` (`ImageAnnotation | undefined`)
  - `updateAnnotation` (`{updated, previous}`)

The directive:

- creates the annotator as soon as the image is loaded, because Annotorious needs its natural size to map coordinates;
- recreates it when `config` changes, or when a new image with a different natural size is loaded into the `img` (e.g. when its `src` changes);
- applies `tool`, `drawingEnabled`, `annotations` and `selectedAnnotation` live;
- destroys the annotator when the directive is destroyed, restoring the DOM. Annotorious wraps the `img` into its own container, so this avoids leaving ghost images.

Annotorious provides the `rectangle` and `polygon` tools. To add more tools (e.g. with `@annotorious/plugin-tools`), mount the plugin in the `annotatorInit` handler.

## ImgAnnotatorToolbarComponent

- 🚩 `img-annotator-toolbar`
- ▶️ input:
  - `tools` (`ImgAnnotatorToolbarTool[]`, default `DEFAULT_IMG_ANNOTATOR_TOOLS`)
  - `disabled` (`boolean`)
- 🔃 model: `tool` (`string`, default `rectangle`). Bind it with `[(tool)]`, or listen to `(toolChange)`.

If the `tools` change and the current tool is no longer available, the first tool gets selected.

## ImgAnnotationList

The core logic for orchestrating events and actions for the wrapped annotator is implemented in the generic `ImgAnnotationList<T>` class. It keeps its own list of annotations, each paired with any third-party model (the payload, of type `T`), whatever its complexity.

The extended annotation model for this list, `ListAnnotation<T>`, wraps the Annotorious annotation with:

- `id`: equal to the ID of the wrapped annotation (`string`);
- `image`: the reference image (`GalleryImage`);
- `value`: the Annotorious annotation (`ImageAnnotation`);
- `payload`: an optional payload of type `T`.

The list subscribes to the annotator events (`createAnnotation`, `updateAnnotation`, `deleteAnnotation`, `selectionChanged`), so you don't need to forward them. Its API:

- 🔃 signals: `annotations`, `selectedAnnotation`, `selectedIndex`, `editing`, `image` (writable).
- 👉 methods:
  - `getAnnotations()`
  - `setAnnotations(annotations)`
  - `clearAnnotations()`
  - `selectAnnotation(annotation | id | null, editable = true)`
  - `selectAnnotationAt(index, editable = true)`
  - `deselectAnnotation()`
  - `editAnnotation(annotation | id)` and `editAnnotationAt(index)`: both return `Promise<boolean>`, true if saved.
  - `removeAnnotation(id)` and `removeAnnotationAt(index)`
  - `attach(annotator)`: bind the list to a new annotator, pushing its annotations into it.
  - `dispose()`: unsubscribe from the annotator events.

When an annotation is saved from the editor, its geometry is always taken from Annotorious, which owns shapes.

## ImgAnnotationListComponent

`ImgAnnotationListComponent<T>` is an abstract base for annotation list components. It creates the inner `ImgAnnotationList<T>` as soon as both `annotator` and `editorComponent` are set. If the annotator is later replaced (e.g. after a config change), the same list is attached to the new one, so its annotations are preserved and `listInit` fires only once. `MatDialog` and the optional `MAT_DIALOG_DEFAULT_OPTIONS` are injected.

- ▶️ input:
  - `annotator` (`ListAnnotator?`): the annotator, typically from the directive's `annotator` signal.
  - `editorComponent` (`ComponentType?`): the dialog component used to edit a list annotation.
  - `image` (`GalleryImage?`)
  - `annotationToString` (`(a: ListAnnotation<T>) => string | null`)
- 🔥 output: `listInit` (`ImgAnnotationList<T>`)
- 🔃 signals: `list`, `annotations`, `selectedAnnotation`, `selectedIndex`.
- 👉 protected helpers for templates: `toggleSelection(a)`, `selectAnnotationAt(i)`, `editAnnotationAt(i)`, `removeAnnotationAt(i)`.

Example:

```ts
@Component({
  selector: 'app-my-img-annotation-list',
  templateUrl: './my-img-annotation-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
})
export class MyImgAnnotationListComponent extends ImgAnnotationListComponent<MyPayload> {}
```

```html
@for (a of annotations(); track a.id; let i = $index) {
<div [class.selected]="i === selectedIndex()">
  <button type="button" (click)="toggleSelection(a)">
    {{ annotationToString()(a) }}
  </button>
  <button type="button" mat-icon-button (click)="editAnnotationAt(i)">
    <mat-icon>edit</mat-icon>
  </button>
  <button type="button" mat-icon-button (click)="removeAnnotationAt(i)">
    <mat-icon>delete</mat-icon>
  </button>
</div>
}
```

## BasicImgAnnotationListComponent

- 🚩 `ann-basic-img-annotation-list`

A ready-to-use M3 list derived from `ImgAnnotationListComponent`, with select, edit and remove actions. Besides the base inputs, it has `showIds` (`boolean`) and `emptyMessage` (`string`).

## Editor Dialog

The editor component passed as `editorComponent` is opened in a Material dialog. It receives a copy of a `ListAnnotation<T>` as `MAT_DIALOG_DATA`, and closes the dialog with the edited `ListAnnotation<T>`, or with no result to cancel:

```ts
@Component({
  /* ... */
})
export class MyEditorDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<MyEditorDialogComponent>);
  protected readonly data = inject<ListAnnotation<MyPayload>>(MAT_DIALOG_DATA);

  protected save(edited: ListAnnotation<MyPayload>): void {
    this._dialogRef.close(edited);
  }

  protected cancel(): void {
    this._dialogRef.close();
  }
}
```

## Selectors

Annotorious V3 default selectors are rectangle and polygon. Here is an example of a list annotation for a rectangle, where the payload is just a string. The wrapped Annotorious annotation corresponds to the object in `value`.

```json
{
  "id": "b764a6e2-66d9-4671-9acb-b3ab345b0f35",
  "value": {
    "id": "b764a6e2-66d9-4671-9acb-b3ab345b0f35",
    "bodies": [
      {
        "id": "b7dc11aa-46d7-5d64-8200-6da9ccf7343a",
        "annotation": "b764a6e2-66d9-4671-9acb-b3ab345b0f35",
        "type": "TextualBody",
        "value": "a rectangle",
        "purpose": "commenting"
      }
    ],
    "target": {
      "annotation": "b764a6e2-66d9-4671-9acb-b3ab345b0f35",
      "selector": {
        "type": "RECTANGLE",
        "geometry": {
          "bounds": {
            "minX": 175.55,
            "minY": 128.66,
            "maxX": 291.11,
            "maxY": 195.33
          },
          "x": 175.55,
          "y": 128.66,
          "w": 115.55,
          "h": 66.66
        }
      },
      "creator": {
        "isGuest": true,
        "id": "Ndrsy7VHI4FQygSKml14"
      },
      "created": "2024-12-28T08:22:15.086Z"
    }
  },
  "image": {
    "id": "1",
    "uri": "sample.jpg",
    "title": "sample",
    "description": "Sample image"
  },
  "payload": "a rectangle"
}
```

A polygon has `"type": "POLYGON"`, and its geometry has `bounds` and `points` (an array of `[x, y]` pairs).
