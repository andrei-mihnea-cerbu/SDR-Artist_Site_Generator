import { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

import { InfoResponse } from '../interfaces/info';
import { ColorEngineInstance } from '../utils/color_engine';

const NotFoundPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const [panelColor, setPanelColor] = useState('#222');
  const [textColor, setTextColor] = useState('#fff');
  const [buttonColor, setButtonColor] = useState('#111');
  const [buttonTextColor, setButtonTextColor] = useState('#fff');

  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  useEffect(() => {
    const loadPalette = async () => {
      try {
        const { data } = await axios.get<InfoResponse>('/info');

        if (data.description.imageGallery.length > 0) {
          const rel = encodeURI(data.description.imageGallery[0]);
          const full = `${bucket}/${rel}`;

          const palette = await ColorEngineInstance.extractPalette(full);
          if (palette) {
            setPanelColor(palette.oppositeSolid);
            setTextColor(palette.solidTextColor);
            setButtonColor(palette.buttonSolid);
            setButtonTextColor(palette.buttonTextColor);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadPalette();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 4,
        zIndex: 2,
      }}
    >
      {/* PANEL */}
      <Box
        sx={{
          background: panelColor,
          color: textColor,
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          maxWidth: 560,
          boxShadow: '0 0 25px rgba(0,0,0,0.45)',
        }}
      >
        {/* 404 */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', sm: '8rem' },
            fontWeight: 800,
            lineHeight: 1,
            mb: 2,
          }}
        >
          404
        </Typography>

        {/* TITLE */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
          }}
        >
          Oops! Page Not Found
        </Typography>

        {/* DESCRIPTION */}
        <Typography
          sx={{
            fontSize: { xs: '1rem', sm: '1.15rem' },
            opacity: 0.9,
            mb: 4,
          }}
        >
          Sorry, the page you’re looking for doesn’t exist. It may have been
          moved, removed, or never existed in the first place.
        </Typography>

        {/* BUTTON */}
        <Button
          variant="contained"
          onClick={() => (window.location.href = '/')}
          sx={{
            background: buttonColor,
            color: buttonTextColor,
            fontSize: '1rem',
            px: 4,
            py: 1.2,
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              background: `${buttonColor}dd`,
            },
          }}
        >
          Go Home
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
