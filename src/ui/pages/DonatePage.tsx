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
import ColorThief from 'color-thief-browser';

import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { Artist } from '../interfaces/artist';
import { Description } from '../interfaces/description';
import { useNotification } from '../context/NotificationProvider';

interface InfoResponse {
  artist: Artist;
  description: Description;
}

const getContrast = (hexOrRgb: string) => {
  if (hexOrRgb.startsWith('rgb')) {
    const nums = hexOrRgb
      .replace(/[^\d,]/g, '')
      .split(',')
      .map((n) => parseInt(n.trim(), 10));
    const [r, g, b] = nums;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#000' : '#fff';
  }

  const hex = hexOrRgb.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.55 ? '#000' : '#fff';
};

const DonatePage: React.FC = () => {
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState(4);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  // Theme state
  const [panelColor, setPanelColor] = useState('rgba(0,0,0,0.8)');
  const [textColor, setTextColor] = useState('#fff');

  const { setNotification } = useNotification();
  const bucketUrl = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // Load info + generate theme
  useEffect(() => {
    localStorage.removeItem('sdr-donation-text');

    axios.get<InfoResponse>('/info').then(async (res) => {
      setInfo(res.data);

      const rel = res.data.description.imageGallery[0];
      const encoded = encodeURI(rel);
      const imgUrl = `${bucketUrl}/${encoded}`;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;

      img.onload = () => {
        const thief = new ColorThief();

        const dominant = thief.getColor(img); // [r,g,b]
        const palette = thief.getPalette(img, 6) || [];

        const rgb = (arr: number[]) => `rgb(${arr[0]},${arr[1]},${arr[2]})`;

        const vibrant = rgb(palette[0] || dominant);
        const muted = rgb(palette[2] || [40, 40, 40]);

        // Panel
        setPanelColor(`${muted}dd`);

        // Auto text color (white or black)
        setTextColor(getContrast(vibrant));
      };
    });
  }, []);

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
        (link: any) => link.rel === 'approve'
      )?.href;

      if (approvalLink) window.location.href = approvalLink;
      else throw new Error('Approval link not found');
    } catch (err) {
      console.error('Failed to create PayPal order:', err);
      setNotification(
        'Could not initiate donation. Please try again.',
        'error'
      );
      setLoading(false);
      document.body.style.cursor = 'default';
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessage(text);
    const lineCount = text.split('\n').length;
    setRows(Math.min(10, Math.max(4, lineCount)));
  };

  if (!info) return null;

  const relativePath = info.description.imageGallery[0];
  const encodedPath = encodeURI(relativePath);
  const photoUrl = `${bucketUrl}/${encodedPath}`;

  return (
    <AnimatedGradientBackground
      imageUrl={photoUrl}
    >
      <Paper
        elevation={10}
        sx={{
          maxWidth: 420,
          margin: '80px auto',
          padding: 4,
          borderRadius: 4,
          textAlign: 'center',
          backgroundColor: panelColor,
          color: textColor,
          overflow: 'hidden',
          position: 'relative',
          transition: '0.3s ease background-color',
        }}
      >
        {/* Step Navigation */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          <Tooltip title="Write your message" arrow>
            <Typography
              variant="subtitle2"
              sx={{
                color: step === 1 ? textColor : '#aaa',
                cursor: 'pointer',
                '&:hover': { color: textColor },
              }}
              onClick={() => setStep(1)}
            >
              Step 1: Message
            </Typography>
          </Tooltip>

          <Tooltip title="Set your donation amount" arrow>
            <Typography
              variant="subtitle2"
              sx={{
                color: step === 2 ? textColor : '#aaa',
                cursor: 'pointer',
                '&:hover': { color: textColor },
              }}
              onClick={() => setStep(2)}
            >
              Step 2: Donation
            </Typography>
          </Tooltip>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={step === 1 ? 50 : 100}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#0070BA',
            },
          }}
        />

        {/* Artist Image */}
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
            boxShadow: '0 0 15px rgba(0,0,0,0.5)',
          }}
        />

        <Typography variant="h6" gutterBottom>
          Support {info.artist.name}
        </Typography>

        {/* Step Content */}
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
                onClick={() => setStep(2)}
                fullWidth
                sx={{
                  background: textColor === '#fff' ? '#0070BA' : '#005f96',
                  mt: 3,
                  py: 1.4,
                  fontWeight: 600,
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
                  fullWidth
                  variant="outlined"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                onClick={handleSubmit}
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                sx={{
                  backgroundColor: '#0070BA',
                  py: 1.4,
                  fontWeight: 700,
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

        {/* PayPal banner */}
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
};

export default DonatePage;
