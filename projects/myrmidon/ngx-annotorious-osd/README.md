# NgxAnnotoriousOsd

📦 `@myrmidon/ngx-annotorious-osd`

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

This is an OpenSeadragon Annotorious wrapper for Angular. Its core components derive from [@myrmidon/ngx-annotorious](../ngx-annotorious/README.md). A new OSD-specific directive is provided to be wired with these components.

⚠️ THIS IS WORK IN PROGRESS!

## Setup

1. add packages: in addition to [@myrmidon/ngx-annotorious](../ngx-annotorious/README.md), which contains the core components for both simple and OSD based annotations, this library requires the following packages (to avoid build warning, add `openseadragon` to your `angular.json`'s `allowedCommonJsDependencies`):

    ```bash
    npm i openseadragon @annotorious/openseadragon
    npm i --save-dev --force @types/openseadragon
    ```

2. add to `angular.json` under your project's `architect/build/options/assets` the configuration to copy OSD assets into the output `dist` folder during the build process:

```json
{
  "glob": "**/*",
  "input": "node_modules/openseadragon/build/openseadragon/images",
  "output": "/images"
}
```

This will grab the image assets from the specified `node_modules` path, and copy them to the output `dist/images` folder.

## Usage

In your consumer component template, add an `img` wrapped in a `div`. The wrapper `div` (not the `img`!) will be the target of the OSD directive, e.g.:

```html
<div
  id="osd-container"
  osdImgAnnotator
  (createAnnotation)="onCreateAnnotation($event)"
  (deleteAnnotation)="onDeleteAnnotation($event)"
  (clickAnnotation)="onClickAnnotation($event)"
  (selectionChanged)="onSelectionChanged($event)"
  (annotatorInit)="onAnnotatorInit($event)"
  [tool]="tool"
  [additionalTools]="['circle', 'ellipse']"
>
  <img
    alt="image"
    src="https://github.com/openseadragon/example-images/blob/gh-pages/grand-canyon-landscape-overlooking.jpg"
  />
</div>
```

Usually, you also setup some styles for this `div`:

```css
div#osd-container {
  width: 100%;
  background: #f0f0f0; /* Optional: to see container before image loads */
}
```

💡 You can find some [example images](https://github.com/openseadragon/example-images/tree/gh-pages) at e.g. <https://github.com/openseadragon/example-images/blob/gh-pages/grand-canyon-landscape-overlooking.jpg>.
