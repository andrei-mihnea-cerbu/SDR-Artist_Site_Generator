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

  const [panelColor, setPanelColor] = useState('#222');
  const [panelTextColor, setPanelTextColor] = useState('#fff');
  const [buttonColor, setButtonColor] = useState('#444');
  const [buttonTextColor, setButtonTextColor] = useState('#fff');

  const [fadeIn, setFadeIn] = useState(false);

  const { setNotification } = useNotification();
  const bucketUrl = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // ----------------------------------------------------
  // Load artist + theme
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.removeItem('sdr-donation-text');

    (async () => {
      const res = await axios.get<InfoResponse>('/info');
      setInfo(res.data);

      const path = encodeURI(res.data.description.imageGallery[0]);
      const url = `${bucketUrl}/${path}`;

      const palette = await ColorEngineInstance.extractPalette(url);

      if (palette) {
        setPanelColor(palette.oppositeSolid);
        setPanelTextColor(palette.solidTextColor);
        setButtonColor(palette.buttonSolid);
        setButtonTextColor(palette.buttonTextColor);
      }

      setTimeout(() => setFadeIn(true), 100);
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
      else throw new Error('Missing PayPal approval link');
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

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    setMessage(txt);

    const ln = txt.split('\n').length;
    setRows(Math.min(10, Math.max(4, ln)));
  };

  if (!info) return null;

  return (
    <Fade in={fadeIn} timeout={800}>
      <Paper
        elevation={12}
        sx={{
          position: 'relative',
          zIndex: 2, // Always above MainLayout background
          maxWidth: 440,
          margin: '80px auto',
          padding: 4,
          borderRadius: 4,
          textAlign: 'center',
          backgroundColor: panelColor,
          color: panelTextColor,
          boxShadow: '0 0 30px rgba(0,0,0,0.4)',
          transition: '0.25s ease all',
        }}
      >
        {/* STEP NAV */}
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
                color: step === 1 ? panelTextColor : panelTextColor + '88',
                '&:hover': { color: panelTextColor },
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
                color: step === 2 ? panelTextColor : panelTextColor + '88',
                '&:hover': { color: panelTextColor },
                fontWeight: step === 2 ? 700 : 400,
              }}
              onClick={() => setStep(2)}
            >
              Step 2: Donation
            </Typography>
          </Tooltip>
        </Box>

        {/* PROGRESS BAR */}
        <LinearProgress
          variant="determinate"
          value={step === 1 ? 50 : 100}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 3,
            backgroundColor: panelTextColor + '22',
            '& .MuiLinearProgress-bar': { backgroundColor: buttonColor },
          }}
        />

        {/* ARTIST PHOTO */}
        <Fade in={fadeIn} timeout={1200}>
          <Box
            component="img"
            src={`${bucketUrl}/${encodeURI(info.description.imageGallery[0])}`}
            alt="artist"
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              mb: 2,
              border: `3px solid ${panelTextColor}`,
              boxShadow: '0 0 12px rgba(0,0,0,0.5)',
            }}
          />
        </Fade>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Support {info.artist.name}
        </Typography>

        {/* MAIN STEPS */}
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
                InputProps={{
                  sx: { backgroundColor: '#fff', borderRadius: 2 },
                }}
              />

              <Fade in={step === 1} timeout={600}>
                <Button
                  fullWidth
                  onClick={() => setStep(2)}
                  sx={{
                    mt: 3,
                    py: 1.4,
                    fontWeight: 600,
                    backgroundColor: buttonColor,
                    color: buttonTextColor,
                    '&:hover': {
                      backgroundColor: buttonColor + 'dd',
                    },
                  }}
                >
                  Continue
                </Button>
              </Fade>
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
                  InputLabelProps={{ style: { color: panelTextColor } }}
                  InputProps={{
                    sx: {
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      color: '#000',
                    },
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
                    color: '#000',
                  }}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </Box>

              <Fade in={step === 2} timeout={600}>
                <Button
                  fullWidth
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                  onClick={handleSubmit}
                  sx={{
                    py: 1.4,
                    fontWeight: 700,
                    backgroundColor: buttonColor,
                    color: buttonTextColor,
                    '&:hover': {
                      backgroundColor: buttonColor + 'dd',
                    },
                  }}
                >
                  {loading ? 'PROCESSING...' : 'DONATE WITH PAYPAL'}
                </Button>
              </Fade>

              <Fade in={step === 2} timeout={800}>
                <Button
                  onClick={() => setStep(1)}
                  sx={{
                    mt: 2,
                    color: panelTextColor,
                    textDecoration: 'underline',
                  }}
                >
                  ← Back to message
                </Button>
              </Fade>
            </Box>
          </Fade>
        </Box>

        {/* PAYPAL BANNER */}
        <Fade in={fadeIn} timeout={1000}>
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
        </Fade>
      </Paper>
    </Fade>
  );
}
