// src/utils/ColorEngine.ts

export interface ExtractedPalette {
  dark: string;
  mid: string;
  vibrant: string;
  gradient: string;
  textColor: string;
  oppositeSolid: string;
}


class ColorEngine {
  private static instance: ColorEngine;
  private cache = new Map<string, any>();

  static getInstance() {
    if (!ColorEngine.instance) {
      ColorEngine.instance = new ColorEngine();
    }
    return ColorEngine.instance;
  }

  private constructor() {}

  // --------------------------
  // Helpers
  // --------------------------

  private rgb(r: number, g: number, b: number) {
    return `rgb(${r},${g},${b})`;
  }

  private brightness(r: number, g: number, b: number) {
    return (r * 0.299 + g * 0.587 + b * 0.114);
  }

  private saturation(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
  }

  private getContrast(hexOrRgb: string) {
    let r = 0, g = 0, b = 0;

    if (hexOrRgb.startsWith("rgb")) {
      const nums = hexOrRgb
        .replace(/[^\d,]/g, "")
        .split(",")
        .map(n => parseInt(n.trim(), 10));
      [r, g, b] = nums;
    } else {
      const hex = hexOrRgb.replace("#", "");
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    const luminance = this.brightness(r, g, b) / 255;
    return luminance > 0.55 ? "#000" : "#fff";
  }

  // --------------------------
  // Proxy-safe fetch → Blob URL
  // --------------------------
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

  // --------------------------
  // Load image into HTMLImageElement
  // --------------------------
  private loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  // --------------------------
  // Solid opposite color generator
  // --------------------------
  private generateOppositeSolid(bg: { r: number; g: number; b: number }) {
    const bright = this.brightness(bg.r, bg.g, bg.b);

    // Dark background → light panel
    if (bright < 130) {
      return "#f4f4f4"; // clean light
    }

    // Light background → dark panel
    return "#1a1a1a";
  }

  // --------------------------
  // MAIN PALETTE EXTRACTOR
  // --------------------------
  async extractPalette(imageUrl: string): Promise<ExtractedPalette | null> {
  if (this.cache.has(imageUrl)) {
    return this.cache.get(imageUrl) as ExtractedPalette;
  }

  const blobUrl = await this.fetchBlobUrl(imageUrl);
  if (!blobUrl) return null;

  const img = await this.loadImage(blobUrl);
  if (!img) return null;

  const palette = this.processImage(img);

  this.cache.set(imageUrl, palette);
  return palette;
}


  // --------------------------
  // Process image to extract colors
  // --------------------------
  private processImage(img: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const samples: { r: number; g: number; b: number }[] = [];

    for (let i = 0; i < data.length; i += 4 * 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const bright = this.brightness(r, g, b);
      const sat = this.saturation(r, g, b);

      if (bright > 220) continue; // too bright/white
      if (sat < 0.18) continue; // gray, not useful

      samples.push({ r, g, b });
    }

    if (samples.length === 0) {
      // Fallback palette
      return {
        dark: "rgb(20,20,20)",
        mid: "rgb(80,80,80)",
        vibrant: "rgb(160,160,160)",
        gradient: "linear-gradient(135deg,#111,#000)",
        textColor: "#fff",
        oppositeSolid: "#f4f4f4",
      };
    }

    // Sort by brightness
    const sorted = samples.sort(
      (a, b) => this.brightness(a.r, a.g, a.b) - this.brightness(b.r, b.g, b.b)
    );

    // Extract key colors
    const dark = this.rgb(sorted[0].r, sorted[0].g, sorted[0].b);

    const midSample = sorted[Math.floor(sorted.length / 2)];
    const mid = this.rgb(midSample.r, midSample.g, midSample.b);

    const vibrantSample = sorted[sorted.length - 1];
    const vibrant = this.rgb(vibrantSample.r, vibrantSample.g, vibrantSample.b);

    // Average color (for opposite panel)
    const avg = samples.reduce(
      (acc, c) => {
        acc.r += c.r; acc.g += c.g; acc.b += c.b;
        return acc;
      },
      { r: 0, g: 0, b: 0 }
    );

    avg.r = Math.round(avg.r / samples.length);
    avg.g = Math.round(avg.g / samples.length);
    avg.b = Math.round(avg.b / samples.length);

    const oppositeSolid = this.generateOppositeSolid(avg);

    const gradient = `linear-gradient(135deg, ${dark} 0%, ${mid} 45%, ${vibrant} 100%)`;

    return {
      dark,
      mid,
      vibrant,
      gradient,
      textColor: this.getContrast(mid),
      oppositeSolid,
    };
  }
}

export const ColorEngineInstance = ColorEngine.getInstance();
