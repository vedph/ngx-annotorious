# NgxAnnotoriousOsd

📦 `@myrmidon/ngx-annotorious-osd`

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

## Setup

In addition to `@myrmidon/ngx-annotorious`, which contains the core components for both simple and OSD based annotations, this library requires the following packages:

```bash
npm i openseadragon @annotorious/openseadragon
npm i --save-dev --force @types/openseadragon
```

Also, you must copy OSD assets into the output `dist` folder during the build process. To this end, add to `angular.json` under your project's `architect/build/options/assets`:

```json
{
  "glob": "**/*",
  "input": "node_modules/openseadragon/build/openseadragon/images",
  "output": "/images"
}
```

This will grab the image assets from the specified `node_modules` path, and copy them to the output `dist/images` folder.

## Usage

In your consumer component template, add an `img` wrapped in a `div`. The wrapper `div` will be the target of the OSD directive, e.g.:

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

Also setup a minimum height for OSD in your app's `styles.css`:

```css
div#osd-container {
  min-height: 500px;
}
```

- [example images](https://github.com/openseadragon/example-images/tree/gh-pages) e.g. <https://github.com/openseadragon/example-images/blob/gh-pages/grand-canyon-landscape-overlooking.jpg>
- [OSD in Angular](http://openseadragon.github.io/docs/): [issue](https://github.com/openseadragon/openseadragon/issues/1858)
