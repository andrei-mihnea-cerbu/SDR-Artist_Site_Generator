import React, { useEffect, useRef, useState } from "react";

interface AnimatedGradientBackgroundProps {
  imageUrl: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

async function fetchBlobUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { mode: "cors" }).catch(() => null);
    if (!res || !res.ok) return null;
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
    "linear-gradient(135deg,#111,#000)"
  );

  // Extract gradient from image
  useEffect(() => {
    let cleanupUrl: string | null = null;

    (async () => {
      const blobUrl = await fetchBlobUrl(imageUrl);
      if (!blobUrl) return;

      cleanupUrl = blobUrl;

      const img = new Image();
      img.src = blobUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const map: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4 * 24) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const key = `${r},${g},${b}`;
          map[key] = (map[key] || 0) + 1;
        }

        const top = Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => `rgb(${k})`);

        if (top.length > 1)
          setGradient(`linear-gradient(-45deg, ${top.join(", ")})`);
      };
    })();

    return () => {
      if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
    };
  }, [imageUrl]);

  return (
    <div
      ref={rootRef}
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: gradient,
        backgroundSize: "400% 400%",
        backgroundPosition: "0% 50%",
        animation: "gradientFlow 15s ease infinite",
        transition: "background-image 1s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
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
