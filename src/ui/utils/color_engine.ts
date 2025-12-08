// src/utils/ColorEngine.ts

export interface ExtractedPalette {
  dark: string;
  mid: string;
  vibrant: string;
  gradient: string;

  textColor: string; // text on gradient
  oppositeSolid: string; // card background
  solidTextColor: string; // readable text on card

  buttonSolid: string; // darker card for buttons
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
  // Basic Helpers
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

  private clamp(x: number, min = 0, max = 255) {
    return Math.min(max, Math.max(min, x));
  }

  // -----------------------------------------------------
  // HEX <-> RGB
  // -----------------------------------------------------
  private rgbToHex(r: number, g: number, b: number) {
    return (
      '#' +
      [r, g, b]
        .map((v) => {
          const h = v.toString(16);
          return h.length === 1 ? '0' + h : h;
        })
        .join('')
    );
  }

  private parseColor(c: string): { r: number; g: number; b: number } {
    if (c.startsWith('rgb')) {
      const [r, g, b] = c
        .replace(/[^\d,]/g, '')
        .split(',')
        .map((n) => parseInt(n, 10));
      return { r, g, b };
    }

    const hex = c.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  // -----------------------------------------------------
  // Opposite Color Generator (HSL Inversion)
  // -----------------------------------------------------
  private oppositeColorHex(r: number, g: number, b: number): string {
    // Convert to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const l = (max + min) / 2 / 255;
    const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1)) / 255;

    // Hue calculation
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h = Math.round((h * 60 + 360) % 360);

    // invert hue
    const oppositeHue = (h + 180) % 360;

    // Lightness: flip dark/light
    const newLightness = l < 0.45 ? 0.85 : 0.18;

    // Convert HSL → RGB
    const C = (1 - Math.abs(2 * newLightness - 1)) * s;
    const X = C * (1 - Math.abs(((oppositeHue / 60) % 2) - 1));
    const m = newLightness - C / 2;

    let r2 = 0,
      g2 = 0,
      b2 = 0;

    if (oppositeHue < 60) [r2, g2, b2] = [C, X, 0];
    else if (oppositeHue < 120) [r2, g2, b2] = [X, C, 0];
    else if (oppositeHue < 180) [r2, g2, b2] = [0, C, X];
    else if (oppositeHue < 240) [r2, g2, b2] = [0, X, C];
    else if (oppositeHue < 300) [r2, g2, b2] = [X, 0, C];
    else [r2, g2, b2] = [C, 0, X];

    return this.rgbToHex(
      this.clamp(Math.round((r2 + m) * 255)),
      this.clamp(Math.round((g2 + m) * 255)),
      this.clamp(Math.round((b2 + m) * 255))
    );
  }

  // -----------------------------------------------------
  // Contrast
  // -----------------------------------------------------
  private getContrast(color: string): string {
    const { r, g, b } = this.parseColor(color);
    return this.brightness(r, g, b) > 140 ? '#000' : '#fff';
  }

  // -----------------------------------------------------
  // Darken
  // -----------------------------------------------------
  private darken(color: string, amt: number): string {
    const { r, g, b } = this.parseColor(color);

    return this.rgbToHex(
      this.clamp(r - amt),
      this.clamp(g - amt),
      this.clamp(b - amt)
    );
  }

  // -----------------------------------------------------
  // Load & Process Image
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
  // Main Palette Generator
  // -----------------------------------------------------
  async extractPalette(imageUrl: string): Promise<ExtractedPalette | null> {
    if (this.cache.has(imageUrl)) return this.cache.get(imageUrl)!;

    const blobUrl = await this.fetchBlobUrl(imageUrl);
    if (!blobUrl) return null;

    const img = await this.loadImage(blobUrl);
    if (!img) return null;

    const palette = this.processImage(img);
    this.cache.set(imageUrl, palette);
    return palette;
  }

  // -----------------------------------------------------
  // Process Image Pixels
  // -----------------------------------------------------
  private processImage(img: HTMLImageElement): ExtractedPalette {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const samples: { r: number; g: number; b: number }[] = [];

    for (let i = 0; (i += 4 * 40), i < data.length; ) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (this.brightness(r, g, b) > 230) continue;
      if (this.saturation(r, g, b) < 0.18) continue;

      samples.push({ r, g, b });
    }

    // Fallback palette
    if (samples.length === 0) {
      return {
        dark: 'rgb(30,30,30)',
        mid: 'rgb(100,100,100)',
        vibrant: 'rgb(180,180,180)',
        gradient: 'linear-gradient(135deg,#111,#555)',
        textColor: '#fff',
        oppositeSolid: '#222',
        solidTextColor: '#fff',
        buttonSolid: '#111',
        buttonTextColor: '#fff',
      };
    }

    const sorted = samples.sort(
      (a, b) => this.brightness(a.r, a.g, a.b) - this.brightness(b.r, b.g, b.b)
    );

    const dark = this.rgb(sorted[0].r, sorted[0].g, sorted[0].b);
    const mid = this.rgb(
      sorted[Math.floor(sorted.length / 2)].r,
      sorted[Math.floor(sorted.length / 2)].g,
      sorted[Math.floor(sorted.length / 2)].b
    );
    const vibrant = this.rgb(
      sorted[sorted.length - 1].r,
      sorted[sorted.length - 1].g,
      sorted[sorted.length - 1].b
    );

    // Compute average color
    const avg = samples.reduce(
      (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
      { r: 0, g: 0, b: 0 }
    );
    avg.r = Math.round(avg.r / samples.length);
    avg.g = Math.round(avg.g / samples.length);
    avg.b = Math.round(avg.b / samples.length);

    const oppositeSolid = this.oppositeColorHex(avg.r, avg.g, avg.b);
    const solidTextColor = this.getContrast(oppositeSolid);

    const buttonSolid = this.darken(oppositeSolid, 30);
    const buttonTextColor = this.getContrast(buttonSolid);

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
