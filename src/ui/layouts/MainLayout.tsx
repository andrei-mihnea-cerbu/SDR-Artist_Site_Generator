import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { InfoResponse } from '../interfaces/info';
import { ColorEngineInstance } from '../utils/color_engine';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get<InfoResponse>('/info');

        if (data.description?.imageGallery?.length > 0) {
          const rel = encodeURI(data.description.imageGallery[0]);
          const full = `${bucket}/${rel}`;
          setPhotoUrl(full);

          await ColorEngineInstance.extractPalette(full);
        }
      } finally {
        setLoading(false);

        // Trigger fade-in slightly after load
        setTimeout(() => setFadeIn(true), 100);
      }
    };

    load();
  }, []);

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ===================================================== */}
      {/* BACKGROUND IMAGE — fades in + kenburns */}
      {/* ===================================================== */}
      {photoUrl && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            opacity: fadeIn ? 1 : 0, // fade animation
            transition: 'opacity 1.3s ease-in-out', // smooth fade
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(6px) brightness(0.65)',
            transform: 'scale(1.1)',
            animation: 'kenburns 22s ease-in-out infinite',
            zIndex: 1,
            pointerEvents: 'none',

            '@keyframes kenburns': {
              '0%': { transform: 'scale(1.08)' },
              '50%': { transform: 'scale(1.13)' },
              '100%': { transform: 'scale(1.08)' },
            },
          }}
        />
      )}

      {/* ===================================================== */}
      {/* FOREGROUND CONTENT — zIndex 2 */}
      {/* ===================================================== */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {loading ? (
          <Box
            sx={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <CircularProgress color="inherit" />
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

export default MainLayout;
