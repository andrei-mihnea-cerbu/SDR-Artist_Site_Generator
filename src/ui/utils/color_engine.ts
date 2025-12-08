// src/utils/ColorEngine.ts
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
    return (r + g + b) / 3;
  }

  private saturation(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
  }

  private getContrast(hexOrRgb: string) {
    let r = 0,
      g = 0,
      b = 0;

    if (hexOrRgb.startsWith("rgb")) {
      const nums = hexOrRgb
        .replace(/[^\d,]/g, "")
        .split(",")
        .map((n) => parseInt(n));
      [r, g, b] = nums;
    } else {
      const hex = hexOrRgb.replace("#", "");
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
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
  // Main color extraction function
  // --------------------------
  async extractPalette(imageUrl: string) {
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl);
    }

    const blobUrl = await this.fetchBlobUrl(imageUrl);
    if (!blobUrl) return null;

    const img = await this.loadImage(blobUrl);
    if (!img) return null;

    const palette = this.processImage(img);

    // Store result into cache
    this.cache.set(imageUrl, palette);

    return palette;
  }

  // --------------------------
  // Utility: Load image into HTMLImageElement
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
  // Extract dark, vibrant, muted colors
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

      if (bright > 220) continue; // sky, white
      if (sat < 0.18) continue; // gray, dull

      samples.push({ r, g, b });
    }

    if (samples.length === 0) {
      return {
        dark: "rgb(20,20,20)",
        mid: "rgb(80,80,80)",
        vibrant: "rgb(160,160,160)",
        gradient: "linear-gradient(135deg,#111,#000)",
        textColor: "#fff",
      };
    }

    const sorted = samples.sort(
      (a, b) =>
        this.brightness(a.r, a.g, a.b) -
        this.brightness(b.r, b.g, b.b)
    );

    const dark = this.rgb(sorted[0].r, sorted[0].g, sorted[0].b);
    const mid =
      sorted[Math.floor(sorted.length / 2)] &&
      this.rgb(
        sorted[Math.floor(sorted.length / 2)].r,
        sorted[Math.floor(sorted.length / 2)].g,
        sorted[Math.floor(sorted.length / 2)].b
      );

    const vibrant =
      sorted[sorted.length - 1] &&
      this.rgb(
        sorted[sorted.length - 1].r,
        sorted[sorted.length - 1].g,
        sorted[sorted.length - 1].b
      );

    const gradient = `linear-gradient(135deg, ${dark} 0%, ${mid} 45%, ${vibrant} 100%)`;

    return {
      dark,
      mid,
      vibrant,
      gradient,
      textColor: this.getContrast(vibrant),
    };
  }
}

export const ColorEngineInstance = ColorEngine.getInstance();
