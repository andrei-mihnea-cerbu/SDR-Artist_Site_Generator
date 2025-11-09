import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

const DonateCancelPage: React.FC = () => {
  const imageUrl = '/resources/image-banner.jpg'; // You can replace this with any fallback or dynamic image

  return (
    <AnimatedGradientBackground imageUrl={imageUrl}>
      <Box
        sx={{
          maxWidth: 500,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: 'white',
          padding: 4,
          borderRadius: 4,
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h4" gutterBottom>
          ⚠️ Donation Cancelled
        </Typography>
        <Typography variant="body1" gutterBottom>
          Your donation was not completed. If this was a mistake, you can try
          again below.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={() => (window.location.href = '/donation')}
            sx={{
              backgroundColor: '#0070BA',
              '&:hover': { backgroundColor: '#005c99' },
              color: 'white',
              fontWeight: 600,
            }}
          >
            Retry Donation
          </Button>
        </Box>
      </Box>
    </AnimatedGradientBackground>
  );
};

export default DonateCancelPage;
