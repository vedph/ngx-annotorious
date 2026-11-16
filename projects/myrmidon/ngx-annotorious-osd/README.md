# NgxAnnotoriousOsd

📦 `@myrmidon/ngx-annotorious-osd`

This is an OpenSeadragon Annotorious wrapper for Angular. It works with the core components of [@myrmidon/ngx-annotorious](../ngx-annotorious/README.md) (toolbar and annotation lists), and provides an OSD-specific directive.

⚠️ This library is experimental.

## Setup

1. Add the packages. Besides [@myrmidon/ngx-annotorious](../ngx-annotorious/README.md), this library requires `openseadragon` and `@annotorious/openseadragon`. To avoid build warnings, add `openseadragon` to `allowedCommonJsDependencies` in your `angular.json`.

    ```bash
    pnpm add openseadragon @annotorious/openseadragon
    pnpm add -D @types/openseadragon
    ```

2. In `angular.json`, add the Annotorious OSD styles to `styles`:

    ```json
    "node_modules/@annotorious/openseadragon/dist/annotorious-openseadragon.css"
    ```

3. In `angular.json`, add an entry under `architect/build/options/assets` to copy the OSD navigation images into the output folder:

    ```json
    {
      "glob": "**/*",
      "input": "node_modules/openseadragon/build/openseadragon/images",
      "output": "/images"
    }
    ```

## Usage

Add the directive to a container element. The image source is either the `source` input (an image URI or any OSD tile source), or the `src` of the first `img` child, which gets hidden:

```html
<div
  osdImgAnnotator
  #osd="osdImgAnnotator"
  height="500px"
  [tool]="tool()"
  [drawingEnabled]="drawingEnabled()"
>
  <img alt="canyon" src="canyon.jpg" />
</div>

<ann-basic-img-annotation-list
  [annotator]="osd.annotator()"
  [editorComponent]="editor"
  [image]="image"
/>
```

- ▶️ input: `config` (`OsdAnnotoriousConfig`), `viewerOptions` (merged with `DEFAULT_OSD_VIEWER_OPTIONS`), `source`, `height` (default `500px`), `tool`, `drawingEnabled`, `annotations`, `selectedAnnotation`.
- 🔃 `annotator`: signal with the current `OpenSeadragonAnnotator`.
- 🔥 output: same as `ImgAnnotatorDirective`, plus `viewportIntersect`.

When drawing is enabled, dragging draws shapes; disable drawing to pan and zoom the image with the mouse.

💡 You can find some [example images](https://github.com/openseadragon/example-images/tree/gh-pages) in the OpenSeadragon repository.
