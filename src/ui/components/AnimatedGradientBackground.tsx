import React, { useEffect, useRef, useState } from 'react';

interface AnimatedGradientBackgroundProps {
  imageUrl: string; // Required: image to extract colors from
  dynamicGradient?: string | null; // Optional: override gradient from parent
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  imageUrl,
  dynamicGradient,
  children,
  style,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [gradient, setGradient] = useState<string>(
    'linear-gradient(135deg,#111,#000)'
  );

  // Helper to produce rgb string
  const rgb = (r: number, g: number, b: number) => `rgb(${r},${g},${b})`;

  // If parent supplies a gradient (HomePage / DonatePage)
  useEffect(() => {
    if (dynamicGradient && rootRef.current) {
      setGradient(dynamicGradient);
    }
  }, [dynamicGradient]);

  // If no dynamicGradient was provided → auto extract from image
  useEffect(() => {
    if (dynamicGradient) return; // skip extraction if provided by parent

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Sampling every 24 pixels → great performance + accurate enough
      const map: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4 * 24) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = `${r},${g},${b}`;
        map[key] = (map[key] || 0) + 1;
      }

      // Extract top 3 colors
      const topColors = Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => `rgb(${key})`);

      if (topColors.length >= 2) {
        const newGradient = `linear-gradient(-45deg, ${topColors.join(', ')})`;
        setGradient(newGradient);
      }
    };
  }, [imageUrl, dynamicGradient]);

  return (
    <div
      ref={rootRef}
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: gradient,
        backgroundSize: '400% 400%',
        backgroundPosition: '0% 50%',
        animation: 'gradientFlow 15s ease infinite',
        transition: 'background-image 1s ease-in-out',
        color: 'white',
        ...style,
      }}
    >
      {children}

      {/* KEYFRAMES (global-safe inline) */}
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
