import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Button, Fade } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const DonateSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    const captureDonation = async () => {
      try {
        const message = localStorage.getItem('sdr-donation-text') || '';

        const res = await axios.post('/api/paypal/donate/capture', {
          orderId: token,
          message,
        });

        setDetails(res.data);
        setStatus('success');
      } catch (err) {
        console.error('Error capturing PayPal order:', err);
        setStatus('error');
      }
    };

    captureDonation();
  }, [searchParams]);

  return (
    <Fade in timeout={700}>
      <Box
        sx={{
          position: 'relative',
          zIndex: 2, // Always above MainLayout background
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
        {/* LOADING */}
        {status === 'loading' && (
          <>
            <Typography variant="h5" gutterBottom>
              Please wait while we confirm your donation...
            </Typography>
            <CircularProgress color="inherit" />
          </>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <>
            <Typography variant="h4" gutterBottom>
              Thank you for your support!
            </Typography>

            {details?.payer?.name?.given_name && (
              <Typography variant="h6" gutterBottom>
                Hi {details.payer.name.given_name}, your donation was
                successful.
              </Typography>
            )}

            <Typography variant="body1" gutterBottom>
              Payment ID: <strong>{details?.id}</strong>
            </Typography>

            <Button
              variant="outlined"
              sx={{
                mt: 3,
                color: 'white',
                borderColor: 'white',
                fontWeight: 600,
                px: 3,
                py: 1.2,
                '&:hover': { borderColor: '#ccc' },
              }}
              onClick={() => (window.location.href = '/')}
            >
              Return to Home
            </Button>
          </>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <>
            <Typography variant="h5" gutterBottom color="error">
              We couldn’t complete your donation.
            </Typography>

            <Typography variant="body1" gutterBottom>
              Something went wrong while verifying your payment. Please try
              again.
            </Typography>

            <Button
              variant="outlined"
              sx={{
                mt: 3,
                color: 'white',
                borderColor: 'white',
                fontWeight: 600,
                px: 3,
                py: 1.2,
              }}
              onClick={() => (window.location.href = '/donation')}
            >
              Back to Donation Page
            </Button>
          </>
        )}
      </Box>
    </Fade>
  );
};

export default DonateSuccessPage;
