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

interface InfoResponse {
  artist: Artist;
  description: Description;
}

const DonatePage: React.FC = () => {
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState(4);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  const { setNotification } = useNotification();
  const bucketUrl = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  useEffect(() => {
    localStorage.removeItem('sdr-donation-text');
    axios.get<InfoResponse>('/info').then((res) => setInfo(res.data));
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
  const photoUrl = info.description.imageGallery[0]
    ? `${bucketUrl}/${encodedPath}`
    : '';

  return (
    <AnimatedGradientBackground imageUrl={photoUrl}>
      <Paper
        elevation={10}
        sx={{
          maxWidth: 420,
          margin: '80px auto',
          padding: 4,
          borderRadius: 4,
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
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
                color: step === 1 ? 'white' : '#888',
                cursor: 'pointer',
                transition: 'color 0.3s',
                '&:hover': { color: 'white' },
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
                color: step === 2 ? 'white' : '#888',
                cursor: 'pointer',
                transition: 'color 0.3s',
                '&:hover': { color: 'white' },
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
              transition: 'width 0.5s ease-in-out',
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
            border: '3px solid white',
            boxShadow: '0 0 15px rgba(255,255,255,0.3)',
          }}
        />

        <Typography variant="h6" gutterBottom>
          Support {info.artist.name}
        </Typography>

        {/* Step Content Container */}
        <Box
          sx={{
            position: 'relative',
            height: 'auto',
            minHeight: 230,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          {/* Step 1 */}
          <Fade in={step === 1} timeout={400} unmountOnExit>
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                transition: 'opacity 0.4s ease',
              }}
            >
              <TextField
                multiline
                rows={rows}
                fullWidth
                placeholder="Say something kind..."
                value={message}
                onChange={handleMessageChange}
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 2,
                  mt: 1,
                  textarea: { fontSize: '1rem', lineHeight: 1.4 },
                }}
              />

              <Button
                variant="contained"
                onClick={() => setStep(2)}
                fullWidth
                sx={{
                  backgroundColor: '#0070BA',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 1.4,
                  mt: 3,
                  '&:hover': { backgroundColor: '#005c99' },
                }}
              >
                Continue
              </Button>
            </Box>
          </Fade>

          {/* Step 2 */}
          <Fade in={step === 2} timeout={400} unmountOnExit>
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                transition: 'opacity 0.4s ease',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                }}
              >
                <TextField
                  type="number"
                  label="Amount"
                  variant="outlined"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                  InputProps={{
                    sx: { backgroundColor: 'white', borderRadius: 1 },
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
                  inputProps={{ min: 0 }}
                />

                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    minWidth: 80,
                    height: '56px',
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
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.4,
                  '&:hover': { backgroundColor: '#005c99' },
                }}
              >
                {loading ? 'PROCESSING...' : 'DONATE WITH PAYPAL'}
              </Button>

              <Button
                onClick={() => setStep(1)}
                sx={{
                  mt: 2,
                  color: 'white',
                  textDecoration: 'underline',
                  textTransform: 'none',
                }}
              >
                ← Back to message
              </Button>
            </Box>
          </Fade>
        </Box>

        {/* PayPal banner (always visible) */}
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
            boxShadow: '0 0 8px rgba(255,255,255,0.3)',
          }}
        />
      </Paper>
    </AnimatedGradientBackground>
  );
};

export default DonatePage;
