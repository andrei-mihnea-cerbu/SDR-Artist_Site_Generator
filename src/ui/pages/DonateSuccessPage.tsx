import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

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
        // Load donation message from local storage
        const message = localStorage.getItem('sdr-donation-text') || '';

        const res = await axios.post('/api/paypal/donate/capture', {
          orderId: token,
          message, // include message in body
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

  const imageUrl = '/resources/image-banner.jpg';

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
        {status === 'loading' && (
          <>
            <Typography variant="h5" gutterBottom>
              Please wait while we confirm your donation...
            </Typography>
            <CircularProgress color="inherit" />
          </>
        )}

        {status === 'success' && (
          <>
            <Typography variant="h4" gutterBottom>
              🎉 Thank you for your support!
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
              sx={{ mt: 3, color: 'white', borderColor: 'white' }}
              onClick={() => (window.location.href = '/')}
            >
              Return to Home
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <Typography variant="h5" gutterBottom color="error">
              ❌ We couldn’t complete your donation.
            </Typography>
            <Typography variant="body1" gutterBottom>
              Something went wrong while verifying your payment. Please try
              again.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 3, color: 'white', borderColor: 'white' }}
              onClick={() => (window.location.href = '/donation')}
            >
              Back to Donation Page
            </Button>
          </>
        )}
      </Box>
    </AnimatedGradientBackground>
  );
};

export default DonateSuccessPage;
