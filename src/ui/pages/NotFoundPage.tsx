import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const NotFoundPage: React.FC = () => {
  const resourcesUrl = import.meta.env.VITE_RESOURCES_URL;

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source
          src={`${resourcesUrl}/banners/home-banner.mp4`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Dark overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.85)', // very dark
          zIndex: 1,
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          textAlign: 'center',
        }}
      >
        {/* 404 Title */}
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontSize: { xs: '6rem', sm: '8rem' },
            fontWeight: 'bold',
            color: 'orange',
            lineHeight: 1,
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
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
            fontWeight: 'bold',
          }}
        >
          Oops! Page Not Found
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            color: 'gray',
            fontSize: { xs: '1rem', sm: '1.2rem' },
            maxWidth: 600,
            marginBottom: 4,
          }}
        >
          Sorry, the page you’re looking for doesn’t exist. It might have been
          removed or you may have mistyped the URL.
        </Typography>

        {/* Back Home */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => (window.location.href = '/')}
          sx={{
            fontSize: '1rem',
            padding: '0.8rem 2rem',
          }}
        >
          Go Home
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
