// src/utils/ColorEngine.ts

export interface ExtractedPalette {
  dark: string;
  mid: string;
  vibrant: string;
  gradient: string;

  // Text on the gradient background
  textColor: string;

  // Solid panel backgrounds
  oppositeSolid: string;
  solidTextColor: string;

  // Button background + text color
  buttonSolid: string;
  buttonTextColor: string;
}

class ColorEngine {
  private static instance: ColorEngine;
  private cache = new Map<string, ExtractedPalette>();

  static getInstance() {
    if (!ColorEngine.instance) {
      ColorEngine.instance = new ColorEngine();
    }
    return ColorEngine.instance;
  }

  private constructor() {}

  // -----------------------------------------------------
  // Helpers
  // -----------------------------------------------------
  private rgb(r: number, g: number, b: number) {
    return `rgb(${r},${g},${b})`;
  }

  private brightness(r: number, g: number, b: number) {
    return r * 0.299 + g * 0.587 + b * 0.114;
  }

  private saturation(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
  }

  private getContrastForRGB(r: number, g: number, b: number): string {
    const luminance = this.brightness(r, g, b);
    return luminance > 140 ? '#000' : '#fff';
  }

  private getContrast(color: string): string {
    if (color.startsWith('rgb')) {
      const [r, g, b] = color
        .replace(/[^\d,]/g, '')
        .split(',')
        .map((n) => parseInt(n, 10));
      return this.getContrastForRGB(r, g, b);
    }

    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return this.getContrastForRGB(r, g, b);
  }

  // -----------------------------------------------------
  // Utility: Darken RGB
  // -----------------------------------------------------
  private darkenColor(hexOrRgb: string, amount: number): string {
    let r = 0,
      g = 0,
      b = 0;

    if (hexOrRgb.startsWith('rgb')) {
      [r, g, b] = hexOrRgb
        .replace(/[^\d,]/g, '')
        .split(',')
        .map((n) => parseInt(n, 10));
    } else {
      const hex = hexOrRgb.replace('#', '');
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    return `rgb(${r},${g},${b})`;
  }

  // -----------------------------------------------------
  // Image fetching
  // -----------------------------------------------------
  private async fetchBlobUrl(url: string): Promise<string | null> {
    try {
      const proxied = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxied);
      if (!res.ok) return null;

      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  // -----------------------------------------------------
  // Panel solid color
  // -----------------------------------------------------
  private generateOppositeSolid(avg: { r: number; g: number; b: number }) {
    const bright = this.brightness(avg.r, avg.g, avg.b);

    // Dark image → bright card
    if (bright < 130) return '#f4f4f4';

    // Bright image → dark card
    return '#1a1a1a';
  }

  // -----------------------------------------------------
  // Main API
  // -----------------------------------------------------
  async extractPalette(imageUrl: string): Promise<ExtractedPalette | null> {
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    const blobUrl = await this.fetchBlobUrl(imageUrl);
    if (!blobUrl) return null;

    const img = await this.loadImage(blobUrl);
    if (!img) return null;

    const palette = this.processImage(img);

    this.cache.set(imageUrl, palette);
    return palette;
  }

  // -----------------------------------------------------
  // Image processing
  // -----------------------------------------------------
  private processImage(img: HTMLImageElement): ExtractedPalette {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const samples: { r: number; g: number; b: number }[] = [];

    // Sample pixels
    for (let i = 0; i < data.length; i += 4 * 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const bright = this.brightness(r, g, b);
      const sat = this.saturation(r, g, b);

      if (bright > 220) continue;
      if (sat < 0.18) continue;

      samples.push({ r, g, b });
    }

    if (samples.length === 0) {
      return {
        dark: 'rgb(30,30,30)',
        mid: 'rgb(100,100,100)',
        vibrant: 'rgb(180,180,180)',
        gradient: 'linear-gradient(135deg,#111,#555)',
        textColor: '#fff',
        oppositeSolid: '#f4f4f4',
        solidTextColor: '#000',
        buttonSolid: 'rgb(200,200,200)',
        buttonTextColor: '#000',
      };
    }

    // Sort by brightness
    const sorted = samples.sort(
      (a, b) => this.brightness(a.r, a.g, a.b) - this.brightness(b.r, b.g, b.b)
    );

    const dark = this.rgb(sorted[0].r, sorted[0].g, sorted[0].b);
    const midSample = sorted[Math.floor(sorted.length / 2)];
    const mid = this.rgb(midSample.r, midSample.g, midSample.b);
    const vibrantSample = sorted[sorted.length - 1];
    const vibrant = this.rgb(vibrantSample.r, vibrantSample.g, vibrantSample.b);

    // Compute average
    const avg = samples.reduce(
      (acc, c) => ({
        r: acc.r + c.r,
        g: acc.g + c.g,
        b: acc.b + c.b,
      }),
      { r: 0, g: 0, b: 0 }
    );

    avg.r = Math.round(avg.r / samples.length);
    avg.g = Math.round(avg.g / samples.length);
    avg.b = Math.round(avg.b / samples.length);

    const oppositeSolid = this.generateOppositeSolid(avg);
    const solidTextColor = this.getContrast(oppositeSolid);

    // Button: darker version of card
    const buttonSolid = this.darkenColor(oppositeSolid, 35);
    const buttonTextColor = this.getContrast(buttonSolid);

    // Gradient
    const gradient = `linear-gradient(135deg, ${dark} 0%, ${mid} 45%, ${vibrant} 100%)`;

    return {
      dark,
      mid,
      vibrant,
      gradient,

      textColor: this.getContrast(vibrant),

      oppositeSolid,
      solidTextColor,

      buttonSolid,
      buttonTextColor,
    };
  }
}

export const ColorEngineInstance = ColorEngine.getInstance();
