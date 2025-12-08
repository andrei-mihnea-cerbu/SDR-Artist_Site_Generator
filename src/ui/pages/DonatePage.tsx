import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  Fade,
  Paper,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import axios from 'axios';

import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { Artist } from '../interfaces/artist';
import { Description } from '../interfaces/description';
import { useNotification } from '../context/NotificationProvider';

import { ColorEngineInstance } from '../utils/color_engine';

interface InfoResponse {
  artist: Artist;
  description: Description;
}

export default function DonatePage() {
  const [info, setInfo] = useState<InfoResponse | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState(4);

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  // Fully solid UI colors (no transparency)
  const [panelColor, setPanelColor] = useState('#222');
  const [textColor, setTextColor] = useState('#fff');

  const { setNotification } = useNotification();
  const bucketUrl = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // ----------------------------------------------------
  // Load artist + theme extracted via ColorEngine
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.removeItem('sdr-donation-text');

    (async () => {
      const res = await axios.get<InfoResponse>('/info');
      setInfo(res.data);

      const rel = res.data.description.imageGallery[0];
      const encoded = encodeURI(rel);
      const imgUrl = `${bucketUrl}/${encoded}`;

      // Centralized palette + text color
      const palette = await ColorEngineInstance.extractPalette(imgUrl);

      if (palette) {
        // Use SOLID opposite color for donation card background
        setPanelColor(palette.oppositeSolid);
        setTextColor(palette.textColor);
      }
    })();
  }, []);

  // ----------------------------------------------------
  // Submit donation
  // ----------------------------------------------------
  const handleSubmit = async () => {
    try {
      setLoading(true);
      document.body.style.cursor = 'wait';

      localStorage.setItem('sdr-donation-text', message);

      const res = await axios.post('/api/paypal/donate/create', {
        artistName: info?.artist.name,
        amount,
        currency,
      });

      const approvalLink = res.data.links?.find(
        (l: any) => l.rel === 'approve'
      )?.href;

      if (approvalLink) window.location.href = approvalLink;
      else throw new Error('Approval link not found');
    } catch (err) {
      console.error(err);
      setNotification(
        'Could not initiate donation. Please try again.',
        'error'
      );
      setLoading(false);
      document.body.style.cursor = 'default';
    }
  };

  // ----------------------------------------------------
  // Dynamic textarea sizing
  // ----------------------------------------------------
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessage(text);

    const lines = text.split('\n').length;
    setRows(Math.min(10, Math.max(4, lines)));
  };

  if (!info) return null;

  const relativePath = info.description.imageGallery[0];
  const encodedPath = encodeURI(relativePath);
  const photoUrl = `${bucketUrl}/${encodedPath}`;

  return (
    <AnimatedGradientBackground imageUrl={photoUrl}>
      <Paper
        elevation={12}
        sx={{
          maxWidth: 440,
          margin: '80px auto',
          padding: 4,
          borderRadius: 4,
          textAlign: 'center',
          backgroundColor: panelColor, // SOLID color only
          color: textColor,
          boxShadow: '0 0 30px rgba(0,0,0,0.4)',
          transition: '0.25s ease all',
        }}
      >
        {/* --------------------------- STEP NAV --------------------------- */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            userSelect: 'none',
          }}
        >
          <Tooltip title="Write your message">
            <Typography
              variant="subtitle2"
              sx={{
                cursor: 'pointer',
                color: step === 1 ? textColor : '#777',
                '&:hover': { color: textColor },
                fontWeight: step === 1 ? 700 : 400,
              }}
              onClick={() => setStep(1)}
            >
              Step 1: Message
            </Typography>
          </Tooltip>

          <Tooltip title="Select donation amount">
            <Typography
              variant="subtitle2"
              sx={{
                cursor: 'pointer',
                color: step === 2 ? textColor : '#777',
                '&:hover': { color: textColor },
                fontWeight: step === 2 ? 700 : 400,
              }}
              onClick={() => setStep(2)}
            >
              Step 2: Donation
            </Typography>
          </Tooltip>
        </Box>

        {/* --------------------------- PROGRESS --------------------------- */}
        <LinearProgress
          variant="determinate"
          value={step === 1 ? 50 : 100}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { backgroundColor: '#0070BA' },
          }}
        />

        {/* --------------------------- ARTIST PHOTO --------------------------- */}
        <Box
          component="img"
          src={photoUrl}
          alt="artist"
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            objectFit: 'cover',
            mb: 2,
            border: `3px solid ${textColor}`,
            boxShadow: '0 0 12px rgba(0,0,0,0.5)',
          }}
        />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Support {info.artist.name}
        </Typography>

        {/* --------------------------- CONTENT --------------------------- */}
        <Box sx={{ minHeight: 230, position: 'relative', mb: 2 }}>
          {/* STEP 1 */}
          <Fade in={step === 1} timeout={400} unmountOnExit>
            <Box sx={{ position: 'absolute', width: '100%' }}>
              <TextField
                multiline
                rows={rows}
                fullWidth
                placeholder="Say something kind..."
                value={message}
                onChange={handleMessageChange}
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  '& textarea': { fontSize: '1rem' },
                }}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={() => setStep(2)}
                sx={{
                  mt: 3,
                  py: 1.4,
                  fontWeight: 600,
                  backgroundColor: '#0070BA',
                }}
              >
                Continue
              </Button>
            </Box>
          </Fade>

          {/* STEP 2 */}
          <Fade in={step === 2} timeout={400} unmountOnExit>
            <Box sx={{ position: 'absolute', width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  type="number"
                  label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  InputProps={{
                    sx: { backgroundColor: '#fff', borderRadius: 1 },
                    startAdornment: (
                      <InputAdornment position="start">
                        {currency === 'USD'
                          ? '$'
                          : currency === 'EUR'
                            ? '€'
                            : '£'}
                      </InputAdornment>
                    ),
                  }}
                />

                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    minWidth: 80,
                  }}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={loading || !amount || parseFloat(amount) <= 0}
                sx={{
                  py: 1.4,
                  fontWeight: 700,
                  backgroundColor: '#0070BA',
                }}
              >
                {loading ? 'PROCESSING...' : 'DONATE WITH PAYPAL'}
              </Button>

              <Button
                onClick={() => setStep(1)}
                sx={{
                  mt: 2,
                  color: textColor,
                  textDecoration: 'underline',
                }}
              >
                ← Back to message
              </Button>
            </Box>
          </Fade>
        </Box>

        {/* --------------------------- PAYPAL LOGO --------------------------- */}
        <Box
          component="img"
          src="/static/paypal-banner.jpg"
          alt="Powered by PayPal"
          sx={{
            width: '65%',
            mt: 3,
            borderRadius: 2,
            backgroundColor: '#fff',
            padding: 1,
          }}
        />
      </Paper>
    </AnimatedGradientBackground>
  );
}
