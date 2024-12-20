// https://iiif.io/api/image/3.0/#image-request-uri-syntax
// This is just a stub for a more complete implementation.
// TODO: implement full IIIF parsing and model

// {scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
// - server
// - prefix
// - identifier: any
//
// - region: "full" | "square" | "x,y,w,h" | "pct:x,y,w,h"
// - size: "max" | "^max" | "w," | "^w," | ",h" | "^,h" | "pct:n" | "^pct:n" | "w,h" | "^w,h" | "!w,h" | "^!w,h"
// - rotation: "n" | "!n"
// - quality: "default" | "color" | "gray" | "bitonal"
// - format: "jpg" | "tif" | "png" | "gif" | "jp2" | "pdf" | "webp"
//
// All special chars (including / which is used as separator) are to be URL-encoded.

/**
 * An IIIF image URI.
 */
export class IiifUri {
  private _server: string;
  private _prefix: string;
  private _identifier: string;
  private _region: string;
  private _size: string;
  private _rotation: string;
  private _quality: 'default' | 'color' | 'gray' | 'bitonal';
  private _format: 'jpg' | 'tif' | 'png' | 'gif' | 'jp2' | 'pdf' | 'webp';

  public scheme: 'http' | 'https';

  public get server(): string {
    return this._server;
  }
  public set server(value: string) {
    this._server = decodeURIComponent(value);
  }

  public get prefix(): string {
    return this._prefix;
  }
  public set prefix(value: string) {
    this._prefix = decodeURIComponent(value);
  }

  public get identifier(): string {
    return this._identifier;
  }
  public set identifier(value: string) {
    this._identifier = decodeURIComponent(value);
  }

  public get region(): string {
    return this._region;
  }
  public set region(value: string) {
    this._region = decodeURIComponent(value);
  }

  public get size(): string {
    return this._size;
  }
  public set size(value: string) {
    this._size = decodeURIComponent(value);
  }

  public get rotation(): string {
    return this._rotation;
  }
  public set rotation(value: string) {
    this._rotation = decodeURIComponent(value);
  }

  public get quality(): 'default' | 'color' | 'gray' | 'bitonal' {
    return this._quality;
  }
  public set quality(value: 'default' | 'color' | 'gray' | 'bitonal') {
    this._quality = decodeURIComponent(value) as any;
  }

  public get format(): 'jpg' | 'tif' | 'png' | 'gif' | 'jp2' | 'pdf' | 'webp' {
    return this._format;
  }
  public set format(
    value: 'jpg' | 'tif' | 'png' | 'gif' | 'jp2' | 'pdf' | 'webp'
  ) {
    this._format = decodeURIComponent(value) as any;
  }

  constructor() {
    this.scheme = 'https';
    this._server = '';
    this._prefix = '';
    this._identifier = '';
    this._region = 'full';
    this._size = 'max';
    this._rotation = '0';
    this._quality = 'default';
    this._format = 'jpg';
  }

  /**
   * Parse the specified IIIF URI.
   *
   * @param uri The URI to parse.
   * @returns A new IIIF URI object.
   */
  public static parse(uri?: string | null): IiifUri | null {
    if (!uri) {
      return null;
    }
    const parts = uri.replace(/^https?:\/\//, '').split('/');
    if (parts.length < 6) {
      return null;
    }

    // TODO: finer regex for \/([^\/]+)
    //  scheme       etc identifierregion    size      rotation                quality                        format
    const m =
      /^(https?):\/\/(.+)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/!?([0-9]+(?:\.[0-9]+)?)\/(default|color|gray|bitonal)\.(jpg|tif|png|gif|jp2|pdf|webp)$/.exec(
        uri
      );
    const result = new IiifUri();
    if (!m) {
      return null;
    }

    // m[1]=scheme
    result.scheme = m[1] as any;

    // m[2] must be split into server and prefix
    let i = m[2].indexOf('/');
    if (i > -1) {
      result.server = m[2].substring(0, i);
      result.prefix = m[2].substring(i + 1);
    } else {
      result.server = m[2];
    }

    // m[3] identifier
    result.identifier = m[3];
    // m[4] region
    result.region = m[4];
    // m[5] size
    result.size = m[5];
    // m[6] rotation
    result.rotation = m[6];
    // m[7] quality
    result.quality = m[7] as any;
    // m[8] format
    result.format = m[8] as any;

    return result;
  }

  /**
   * Render this URI into a string.
   *
   * @param info True to render the URI for the image info, false to render
   * the image URI.
   * @returns URI string.
   */
  public toString(info = false): string {
    const sb: string[] = [];

    // scheme://
    sb.push(this.scheme);
    sb.push('://');

    // server/prefix
    sb.push(this.server);
    if (this.prefix) {
      sb.push('/');
      sb.push(this.prefix);
    }

    // /identifier
    sb.push('/');
    sb.push(encodeURIComponent(this.identifier));

    if (info) {
      sb.push('/');
      sb.push('info.json');
      return sb.join('');
    }

    // region/size/rotation/quality
    sb.push('/');
    sb.push([this.region, this.size, this.rotation, this.quality].join('/'));

    // .format
    sb.push('.');
    sb.push(this.format);

    return sb.join('');
  }
}
