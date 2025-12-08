import React, { useEffect, useRef, useState } from 'react';

interface AnimatedGradientBackgroundProps {
  imageUrl: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Fetch the image safely through backend proxy
 * which bypasses S3 CORS restrictions.
 */
async function fetchBlobUrl(imageUrl: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(imageUrl);
    const proxyUrl = `/api/proxy-image?url=${encoded}`;

    const res = await fetch(proxyUrl);
    if (!res.ok) return null;

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  imageUrl,
  children,
  style,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const [gradient, setGradient] = useState(
    'linear-gradient(135deg, #111, #000)'
  );

  useEffect(() => {
    let tempBlobUrl: string | null = null;

    (async () => {
      const blobUrl = await fetchBlobUrl(imageUrl);
      if (!blobUrl) return;

      tempBlobUrl = blobUrl;

      const img = new Image();
      img.src = blobUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const map: Record<string, number> = {};

        // Sample pixels for performance
        const step = 32; // bigger = faster
        for (let i = 0; i < data.length; i += 4 * step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // discard near-black pixels to avoid muddy gradients
          if (r + g + b < 60) continue;

          const key = `${r},${g},${b}`;
          map[key] = (map[key] || 0) + 1;
        }

        // Top 3 colors
        const picked = Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => `rgb(${k})`);

        // Fallback if no colors found
        if (picked.length < 2) {
          setGradient('linear-gradient(135deg,#222,#000)');
          return;
        }

        const newGradient = `linear-gradient(-45deg, ${picked.join(', ')})`;
        setGradient(newGradient);
      };
    })();

    // cleanup
    return () => {
      if (tempBlobUrl) URL.revokeObjectURL(tempBlobUrl);
    };
  }, [imageUrl]);

  return (
    <div
      ref={rootRef}
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: gradient,
        backgroundSize: '400% 400%',
        backgroundPosition: '0% 50%',
        animation: 'gradientFlow 18s ease infinite',
        transition: 'background-image 1.2s ease-in-out',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        ...style,
      }}
    >
      {children}

      <style>
        {`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        `}
      </style>
    </div>
  );
};

export default AnimatedGradientBackground;
