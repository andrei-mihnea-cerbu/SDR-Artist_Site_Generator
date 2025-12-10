import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const NotFoundPage: React.FC = () => {
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
        zIndex: 2, // ensures it's above MainLayout background
      }}
    >
      {/* 404 Title */}
      <Typography
        variant="h1"
        gutterBottom
        sx={{
          fontSize: { xs: '6rem', sm: '8rem' },
          fontWeight: 800,
          color: 'orange',
          lineHeight: 1,
          textShadow: '0 0 20px rgba(0,0,0,0.8)',
        }}
      >
        404
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: 'white',
          fontWeight: 700,
          fontSize: { xs: '1.8rem', sm: '2.4rem' },
          textShadow: '0 0 15px rgba(0,0,0,0.6)',
        }}
      >
        Oops! Page Not Found
      </Typography>

      {/* Description */}
      <Typography
        variant="body1"
        sx={{
          color: 'lightgray',
          maxWidth: 600,
          mb: 4,
          fontSize: { xs: '1rem', sm: '1.2rem' },
          textShadow: '0 0 10px rgba(0,0,0,0.6)',
        }}
      >
        Sorry, the page you're looking for doesn't exist. It may have been
        moved, removed, or never existed in the first place.
      </Typography>

      {/* Back Home */}
      <Button
        variant="contained"
        onClick={() => (window.location.href = '/')}
        sx={{
          fontSize: '1rem',
          padding: '0.8rem 2rem',
          fontWeight: 600,
          backgroundColor: 'orange',
          '&:hover': { backgroundColor: '#cc7a00' },
        }}
      >
        Go Home
      </Button>
    </Box>
  );
};

export default NotFoundPage;
