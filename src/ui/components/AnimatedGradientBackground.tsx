import React, { useEffect, useRef } from 'react';

interface AnimatedGradientBackgroundProps {
  imageUrl: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  imageUrl,
  children,
  style,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const colorMap: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4 * 24) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = `${r},${g},${b}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      const sortedColors = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([color]) => `rgb(${color})`);

      if (sortedColors.length > 1 && rootRef.current) {
        rootRef.current.style.backgroundImage = `linear-gradient(-45deg, ${sortedColors.join(', ')})`;
        rootRef.current.style.backgroundSize = '400% 400%';
        rootRef.current.style.animation = 'gradientFlow 15s ease infinite';
        rootRef.current.style.backgroundPosition = '0% 50%';
      }
    };
  }, [imageUrl]);

  return (
    <div
      ref={rootRef}
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111', // fallback if gradient fails
        color: 'white',
        animation: 'gradientFlow 15s ease infinite',
        backgroundSize: '400% 400%',
        backgroundPosition: '0% 50%',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedGradientBackground;
