# NgxAnnotoriousOsd

📦 `@myrmidon/ngx-annotorious-osd`

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

This library requires the following packages:

```bash
npm i openseadragon @annotorious/openseadragon
npm i --save-dev --force @types/openseadragon
```

Also you must copy OSD assets into the output dist folder in build. To this end, add to `angular.json` under your project's `architect/build/options/assets`:

```json
{
  "glob": "**/*",
  "input": "node_modules/openseadragon/build/openseadragon/images",
  "output": "/images"
}
```

Ensure to wrap your img in a div and apply the directive to the div. Also setup a minimum height for OSD in your app's `styles.css`:

```css
div#osd-container {
  min-height: 500px;
}
```

- [example images](https://github.com/openseadragon/example-images/tree/gh-pages) e.g. <https://github.com/openseadragon/example-images/blob/gh-pages/grand-canyon-landscape-overlooking.jpg>
- [OSD in Angular](http://openseadragon.github.io/docs/): [issue](https://github.com/openseadragon/openseadragon/issues/1858)
