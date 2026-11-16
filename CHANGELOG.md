# Changelog

All notable changes to the libraries in this workspace are documented here.

| package                             | version |
| ----------------------------------- | ------- |
| `@myrmidon/ngx-annotorious`         | 2.0.0   |
| `@myrmidon/ngx-annotorious-osd`     | 2.0.0   |
| `@myrmidon/cadmus-img-gallery`      | 10.0.0  |
| `@myrmidon/cadmus-img-gallery-iiif` | 10.0.0  |

## 2026-11-16 - Angular 22, zoneless, signals, M3

All the libraries now target **Angular 22** and **Annotorious 3.9**, and are designed for **zoneless** applications: every component is `OnPush`, all state is exposed via **signals**, and forms use Angular **Signal Forms**. Styles only use Angular Material **M3 system tokens** (`--mat-sys-*`), so they follow the host app theme, including dark mode. Tests moved from Karma/Jasmine stubs to **Vitest** (with Angular Testing Library for UI components).

### Workspace

- Package manager: **pnpm**. `package-lock.json` is replaced by `pnpm-lock.yaml`.
- Removed `zone.js`, Karma, Jasmine and their types. Removed `@angular/animations`, `@angular/platform-browser-dynamic`, `@myrmidon/cadmus-core`, `@myrmidon/cadmus-ui-custom-action-bar` and `@myrmidon/paged-data-browsers` from the workspace dependencies, as they are no longer used.
- Added `vitest`, `jsdom`, `@testing-library/angular`, `@testing-library/dom` and `@testing-library/user-event`. Test targets use the `@angular/build:unit-test` builder; run `pnpm test` (all libraries) or `pnpm run test-ann`, `test-gal`, `test-iiif`.
- `pnpm-workspace.yaml` excludes `zone.js` from hoisting: it is an optional peer of `@angular/core`, and when hoisted the Vitest runner tries to load `zone.js/testing`.
- Demo app: zoneless (`provideZonelessChangeDetection`), lazy routes, `provideHttpClient(withFetch())`, M3 theme based on `color-scheme` like the Cadmus shell, with a light/dark toggle. The OpenSeadragon Annotorious stylesheet (`@annotorious/openseadragon/dist/annotorious-openseadragon.css`) is now included in `angular.json`; it was missing before.

### @myrmidon/ngx-annotorious 2.0.0

#### Fixes

- **`config` was ignored**: the directive never passed its configuration to `createImageAnnotator`. Now all Annotorious options are passed.
- **Shared default config was mutated**: the directive assigned the image to `DEFAULT_ANNOTORIOUS_CONFIG`. The default is now frozen and never mutated.
- **Annotator created before the image loaded**: the annotator is now created only once the image has a natural size, which is required for mapping coordinates.
- **Wrong coordinates after changing `src`**: Annotorious fixes the SVG viewBox at creation time. The directive now recreates the annotator when an image with a different natural size is loaded.
- **Ghost image on destroy**: Annotorious moves the `img` into its own wrapper and moves it back on destroy. When Angular removed the `img` (e.g. inside an `@if`), this put the image back into the DOM. The directive now restores the DOM correctly. This is covered by a test.
- **Shape edits were lost**: `ImgAnnotationList` did not handle `updateAnnotation`, so moving or resizing a shape left a stale geometry in the list, and the next save reverted it. The list now tracks updates. When saving from the editor, the current Annotorious geometry is always kept.
- **Wrong object sent to Annotorious when editing**: on edit, the list passed the whole `ListAnnotation` to `annotator.updateAnnotation` instead of its `value`.
- The editor dialog now receives a deep copy of the annotation, so editors cannot mutate the annotation objects stored by Annotorious.
- Out-of-range indexes in `selectAnnotationAt`, `editAnnotationAt` and `removeAnnotationAt` no longer throw.
- `clearAnnotations` and `setAnnotations` also reset the selection.
- The default `annotationToString` no longer throws when `bodies` is undefined.
- Removed the 500 ms debounce used to initialize the list component, and the `setTimeout`/`detectChanges` workarounds that consumers needed around `annotatorInit`.
- Removed all `console.log` noise.
- `GuidService` uses `crypto.randomUUID()` (with a fallback).

#### Breaking changes

- **Annotator events are wired automatically.** `ImgAnnotationList` subscribes to the annotator's `createAnnotation`, `deleteAnnotation`, `updateAnnotation` and `selectionChanged` events. The public handlers `onCreateAnnotation`, `onDeleteAnnotation` and `onSelectionChange` were **removed**. Consumers must **stop forwarding** these directive outputs to the list: forwarding `createAnnotation` would now open the editor twice.
- **`ImgAnnotationList` is signal-based.**
  - `annotations$` → `annotations` (`Signal<ListAnnotation<T>[]>`).
  - `selectedAnnotation$` → `selectedAnnotation` (`Signal<ListAnnotation<T> | null>`).
  - New signals: `selectedIndex`, `editing`.
  - `image` is now a `WritableSignal<GalleryImage | undefined>` (was a plain property).
  - The constructor takes an options object: `new ImgAnnotationList({ annotator, editorComponent, dialog, dialogConfig?, image? })`.
  - `editAnnotation(annotation | id)` and `editAnnotationAt(index)` return `Promise<boolean>` (true if saved).
  - New methods: `deselectAnnotation()`, `attach(annotator)` (rebind to a recreated annotator, keeping the annotations) and `dispose()`.
  - Removed the `annotationToString` property; it was unused. Use the component input instead.
- **`ImgAnnotationListComponent<T>` (base class):**
  - `list` is now a signal: use `list()` instead of `list`.
  - New convenience signals for templates: `annotations`, `selectedAnnotation`, `selectedIndex`.
  - New protected helpers: `toggleSelection(a)`, `selectAnnotationAt(i)`, `editAnnotationAt(i)`, `removeAnnotationAt(i)`.
  - `annotator`, `editorComponent` and `image` are optional inputs. The list is created when both `annotator` and `editorComponent` are set. If the annotator is later replaced, the same list is attached to the new one, so `listInit` fires only once.
  - The constructor no longer takes `MatDialog` and the dialog options: they are injected. Subclasses must not declare a constructor that passes them. `MAT_DIALOG_DEFAULT_OPTIONS` is optional.
- **`ImgAnnotatorDirective`:**
  - The selector is now `img[imgAnnotator]`, and the directive is exported as `imgAnnotator`, so templates can use `#ann="imgAnnotator"` and `ann.annotator()`.
  - New `annotator` signal and `drawingEnabled` input.
  - `config`, `annotations` and `selectedAnnotation` are plain inputs, no longer `model`s.
  - `annotations` is optional: when set, it replaces the annotator's annotations unless they are equal. When annotations are managed by an `ImgAnnotationList`, **do not bind it**: the list keeps the annotator in synch.
  - `selectedAnnotation` also accepts an ID.
  - Removed the `additionalTools` input (it was a no-op) and the `viewportIntersect` output (OSD only; it is still available in the OSD directive).
  - `annotatorInit` fires each time a new annotator is created (on init, on `config` change, and on image size change).
- **`AnnotoriousConfig`** is now an alias of Annotorious `AnnotoriousOpts<ImageAnnotation, ImageAnnotation>`. The `image` property was removed.
- **`ImgAnnotatorToolbarComponent`:** `tool` is a `model<string>` (two-way bindable as `[(tool)]`), and `toolChange` is now its change output. The initial `toolChange` emission on init is gone, so initialize your tool signal to `'rectangle'`. New `disabled` input and `DEFAULT_IMG_ANNOTATOR_TOOLS` constant.
- `GalleryImage` moved to `lib/models.ts`. It is still exported from the package root, so imports do not change.
- Removed the duplicated, never-exported gallery files (`gallery-list.repository`, `models`, options/lorem/mock services) from this library: they live in `@myrmidon/cadmus-img-gallery`.
- Peer dependencies: Angular `^22`, `@angular/cdk`, `@angular/material`, `@annotorious/annotorious ^3.9`, `rxjs`.

#### New

- `BasicImgAnnotationListComponent` (`ann-basic-img-annotation-list`): a ready-to-use M3 list of annotations with select, edit and remove actions. Inputs: `showIds`, `emptyMessage`, plus all the base list inputs.
- `bindAnnotatorEvents(annotator, handlers)` helper, returning an unbind function.
- `areAnnotationsEqual`, `newGuid`, `defaultAnnotationToString`, and the `AnnotationClickEvent` and `AnnotationUpdateEvent` types.

### @myrmidon/ngx-annotorious-osd 2.0.0

Still experimental. The integration with the current Annotorious version was fixed:

- the annotator was initialized twice (once by an effect and once in `ngAfterViewInit`), creating two viewers;
- `debugMode` was enabled;
- `drawingEnabled` was forced to true;
- literal sizes and colors were set inline;
- stale async initializations are now discarded;
- the annotator stylesheet was missing in the demo.

Breaking changes:

- New inputs: `viewerOptions` (merged with `DEFAULT_OSD_VIEWER_OPTIONS`), `source` (image URI or OSD tile source; defaults to the first child `img`), `height` (default `500px`) and `drawingEnabled`. The same `annotator` signal and `exportAs` (`osdImgAnnotator`) as the image directive.
- `config` is typed as `OsdAnnotoriousConfig`. `additionalTools` was removed.

There are no unit tests for this library, as OpenSeadragon requires a real browser.

### @myrmidon/cadmus-img-gallery 10.0.0

#### Fixes

- Fixed the responsive layout of the gallery list (the `filters` grid area did not exist).
- The filter used nested `<form>` elements (invalid HTML). It is now a single add form plus action buttons.
- The mock service matched the `dsc` filter key against nothing: both `description` and `dsc` now filter by description, and matching is case-insensitive.
- `LoremIpsumService.generateSentence` ignored its options.
- Replaced the `NgOptimizedImage` + `IntersectionObserver` LCP workaround with native lazy images. This also removes the aspect-ratio warnings for remote IIIF images.
- Overlapping page loads can no longer overwrite each other: stale responses are discarded.

#### Breaking changes

- `IMAGE_GALLERY_OPTIONS_KEY` and `IMAGE_GALLERY_SERVICE_KEY` are typed `InjectionToken`s (they were strings). Provider declarations (`{ provide: IMAGE_GALLERY_SERVICE_KEY, ... }`) and `inject(...)` keep working unchanged, but `@Inject('cadmusImgGalleryService')`-style string lookups no longer do.
- **`GalleryOptionsService`:** `select()` (observable) was removed. Use the `options` signal; `get()` and `set()` are unchanged, and `patch()` is new.
- **`GalleryListRepository`** is signal-based and no longer depends on `@myrmidon/paged-data-browsers`.
  - `page$` → `page`, `loading$` → `loading`. New signals: `filter`, `error`, `empty`.
  - Data loads lazily on the first `ensureLoaded()`, `setPage()`, `setFilter()` or `reset()` call; the gallery list component calls `ensureLoaded()`.
  - The repository automatically resets when the gallery options change.
  - `reset()` also calls the optional `GalleryService.clearCache()`.
  - The `loadPage` method and the `GalleryImageListProps` interface were removed.
- **`GalleryService`** has a new optional `clearCache()` method.
- **Filter entries:** the `entries` inputs of `cadmus-gallery-list` and `cadmus-gallery-filter` are typed `GalleryFilterEntry[]` (`{ id, value }`), which is structurally compatible with Cadmus `ThesaurusEntry`. The library no longer depends on `@myrmidon/cadmus-core`.
- **`GalleryListComponent`:** new inputs `filterVisible` (default true), `selectedId` (highlights the picked image) and `pageSizeOptions`. Its handlers are now protected.
- **`GalleryFilterComponent`:** uses Signal Forms. `filter` is a `model<GalleryFilter | undefined>`; when unset, the repository filter is shown. The UI shows a list of filters with an explicit apply button.
- New exported helpers: `filterGalleryImages(images, filter)` and `getDataPage(items, pageNumber, pageSize)`.
- Peer dependencies: Angular `^22` (common, core, forms, material), `@myrmidon/ngx-annotorious ^2`, `@myrmidon/ngx-tools ^3`, `rxjs`.

### @myrmidon/cadmus-img-gallery-iiif 10.0.0

#### Fixes

- **`getImage` loaded `options.baseUri`** instead of `options.manifestUri` when the cache was cold.
- **Cache invalidation** compared `baseUri`, `arrayPath` and `resourcePath`. It now compares `manifestUri`, `arrayPath`, `resourcePath`, `labelPath`, `skip` and `limit`.
- **`getImage` with `skip`** returned the wrong image: lookup is now by ID.
- Concurrent requests share a single manifest download, and failed downloads are not cached.
- Non-IIIF image URIs no longer crash resizing: they are returned unchanged.
- `getProperty` returned null for falsy but valid values (`0`, `''`), and crashed on non-object steps.
- IIIF v2 label arrays (`[{ "@value": ... }]`) and IIIF v3 language maps are now read as labels, and v3 `id` is accepted as the resource ID besides `@id`.
- The title filter is implemented (case-insensitive substring).
- `IiifUri.parse` dropped the mirroring flag of rotation (`!180`); it now also accepts query strings, is case-insensitive for scheme, quality and format, and returns null on malformed URI encoding.

#### Breaking changes

- `getImages` and `getImage` keep their signatures, but the service now uses `inject()`, so it can no longer be constructed manually with `new SimpleIiifGalleryService(handler)`.
- `getProperty` delegates to the new exported `getPathProperty` function. New public `readManifest(manifest, options)` and `clearCache()` methods.
- Note: the old `IiifUri` spec expected percent-encoded sizes (`300%2C400`), but the code never encoded them, so that test always failed. The code is unchanged (sizes are rendered as `300,400`) and the spec was fixed.

### Migration checklist for consumers (e.g. `cadmus-chgc-app-v2`)

1. Update the packages: `@myrmidon/ngx-annotorious@^2`, `@myrmidon/cadmus-img-gallery@^10` and `@myrmidon/cadmus-img-gallery-iiif@^10`. Remove `@myrmidon/paged-data-browsers` if it is not used elsewhere.
2. In the gallery image annotator component:
   - remove the `(createAnnotation)`, `(deleteAnnotation)` and `(selectionChanged)` forwarding to the list;
   - remove `[annotations]="imageAnnotations"` from the `img`;
   - use `#ann="imgAnnotator"` and pass `[annotator]="ann.annotator()"` to the list, instead of `onAnnotatorInit` with `setTimeout` and `detectChanges`;
   - bind the toolbar with `[(tool)]="tool"` where `tool = signal('rectangle')`;
   - replace the `annotations$` subscription with an `effect` on `list()?.annotations()`;
   - drop the "pending annotations" workaround: call `list.setAnnotations(...)` once the list is initialized (`listInit`). The list pushes its annotations into any annotator it is attached to.
3. In the custom list component (`ImgAnnotationListComponent` subclass): use `annotations()`, `selectedIndex()` and `list()`, and the protected helpers, instead of `list!.annotations$ | async` and `list?.…`.
4. Replace `GalleryOptionsService.select().subscribe(...)` with an `effect`/`computed` on `options()`.
5. Pass thesaurus entries to `cadmus-gallery-list` as before: `ThesaurusEntry` is structurally compatible with `GalleryFilterEntry`.
6. Replace literal colors in the custom list styles with `--mat-sys-*` tokens.
