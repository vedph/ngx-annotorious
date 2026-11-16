import { IiifUri } from './iiif-uri';

describe('IiifUri', () => {
  it('should parse a real-world URI', () => {
    const uri = IiifUri.parse(
      'https://stacks.stanford.edu/image/iiif/xj710dc7305/029_fob_TC_46/full/full/0/default.jpg'
    );
    expect(uri).toBeTruthy();
    expect(uri!.scheme).toBe('https');
    expect(uri!.server).toBe('stacks.stanford.edu');
    expect(uri!.prefix).toBe('image/iiif/xj710dc7305');
    expect(uri!.identifier).toBe('029_fob_TC_46');
    expect(uri!.region).toBe('full');
    expect(uri!.size).toBe('full');
    expect(uri!.rotation).toBe('0');
    expect(uri!.quality).toBe('default');
    expect(uri!.format).toBe('jpg');
  });

  it('should parse a URI without prefix', () => {
    const uri = IiifUri.parse('http://server.edu/id/full/max/90/gray.png');
    expect(uri!.scheme).toBe('http');
    expect(uri!.server).toBe('server.edu');
    expect(uri!.prefix).toBe('');
    expect(uri!.identifier).toBe('id');
    expect(uri!.rotation).toBe('90');
    expect(uri!.quality).toBe('gray');
    expect(uri!.format).toBe('png');
  });

  it('should keep the mirroring flag of rotation', () => {
    const uri = IiifUri.parse(
      'https://server.edu/prefix/id/full/max/!180/default.jpg'
    );
    expect(uri!.rotation).toBe('!180');
    expect(uri!.toString()).toBe(
      'https://server.edu/prefix/id/full/max/!180/default.jpg'
    );
  });

  it('should return null for invalid URIs', () => {
    expect(IiifUri.parse(null)).toBeNull();
    expect(IiifUri.parse('')).toBeNull();
    expect(IiifUri.parse('https://server.edu/image.jpg')).toBeNull();
    expect(
      IiifUri.parse('https://server.edu/id/full/max/0/default.bmp')
    ).toBeNull();
  });

  it('should render a simple URI', () => {
    const expected =
      'https://server.edu/prefix/identifier/full/full/0/default.jpg';
    expect(IiifUri.parse(expected)!.toString()).toBe(expected);
  });

  it('should render an encoded identifier', () => {
    const expected = 'https://server.edu/prefix/ab%2Fc/full/full/0/default.jpg';
    const uri = IiifUri.parse(expected)!;
    expect(uri.identifier).toBe('ab/c');
    expect(uri.toString()).toBe(expected);
  });

  it('should render an edited size', () => {
    const uri = IiifUri.parse(
      'https://server.edu/prefix/identifier/full/full/0/default.jpg'
    )!;
    uri.size = '300,400';
    expect(uri.toString()).toBe(
      'https://server.edu/prefix/identifier/full/300,400/0/default.jpg'
    );
  });

  it('should render the info URI', () => {
    const uri = IiifUri.parse(
      'https://server.edu/prefix/identifier/full/full/0/default.jpg'
    )!;
    expect(uri.toString(true)).toBe(
      'https://server.edu/prefix/identifier/info.json'
    );
  });
});
