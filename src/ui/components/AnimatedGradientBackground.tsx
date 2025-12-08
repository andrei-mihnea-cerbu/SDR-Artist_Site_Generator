// src/components/AnimatedGradientBackground.tsx

import React, { useEffect, useState } from 'react';
import { ColorEngineInstance } from '../utils/color_engine';

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
  const [gradient, setGradient] = useState('linear-gradient(135deg,#111,#000)');

  useEffect(() => {
    let revoked: string | null = null;

    (async () => {
      const palette = await ColorEngineInstance.extractPalette(imageUrl);
      if (!palette) return;

      // use internal gradient from the engine
      setGradient(palette.gradient);

      // revoke ObjectURL if engine created one
      if (palette.blobUrl) revoked = palette.blobUrl;
    })();

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [imageUrl]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: gradient,
        backgroundSize: '400% 400%',
        backgroundPosition: '0% 50%',
        animation: 'gradientFlow 16s ease infinite',
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
