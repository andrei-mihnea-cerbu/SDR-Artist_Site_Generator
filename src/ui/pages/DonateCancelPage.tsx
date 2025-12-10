import React from 'react';
import { Box, Typography, Button, Fade } from '@mui/material';

const DonateCancelPage: React.FC = () => {
  return (
    <Fade in timeout={800}>
      <Box
        sx={{
          position: 'relative',
          zIndex: 2, // ensure card is above MainLayout background
          maxWidth: 500,
          margin: '120px auto',
          padding: 4,
          borderRadius: 4,
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.75)',
          color: 'white',
          boxShadow: '0 0 20px rgba(0,0,0,0.6)',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Donation Cancelled
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
              px: 3,
              py: 1.2,
            }}
          >
            Retry Donation
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default DonateCancelPage;
