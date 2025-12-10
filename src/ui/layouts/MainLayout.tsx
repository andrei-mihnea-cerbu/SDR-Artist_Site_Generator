import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { InfoResponse } from '../interfaces/info';
import { ColorEngineInstance } from '../utils/color_engine';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get<InfoResponse>('/info');

        if (data.description?.imageGallery?.length > 0) {
          const rel = encodeURI(data.description.imageGallery[0]);
          const full = `${bucket}/${rel}`;
          setPhotoUrl(full);

          // Optional: load palette (not used here, but keeps logic consistent)
          await ColorEngineInstance.extractPalette(full);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ===================================================== */}
      {/* BACKGROUND IMAGE — now fully visible, no overlay */}
      {/* ===================================================== */}
      {photoUrl && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(6px) brightness(0.85)', // slightly brightened since overlay removed
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
      {/* PAGE CONTENT — zIndex: 2 */}
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
