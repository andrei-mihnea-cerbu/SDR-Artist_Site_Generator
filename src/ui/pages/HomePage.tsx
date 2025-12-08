import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
  SvgIcon,
} from '@mui/material';
import axios from 'axios';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LanguageIcon from '@mui/icons-material/Language';
import StorefrontIcon from '@mui/icons-material/Storefront';

import * as simpleIcons from 'simple-icons';

import { Artist } from '../interfaces/artist';
import { Social } from '../interfaces/social';
import { InfoResponse } from '../interfaces/info';

import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { ColorEngineInstance } from '../utils/color_engine';

// -------------------------------------------------
// ICON UTILS
// -------------------------------------------------

const createSimpleIcon = (icon: any) => {
  if (!icon) return null;
  return (
    <SvgIcon
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 22, height: 22, fill: `#${icon.hex}` }}
    >
      <path d={icon.path} />
    </SvgIcon>
  );
};

const getPlatformIcon = (s: Social) => {
  const name = s.name.toLowerCase();
  const url = (s.originalUrl || s.url).toLowerCase();

  if (name.includes('spotify')) return createSimpleIcon(simpleIcons.siSpotify);
  if (name.includes('apple') || url.includes('music.apple'))
    return createSimpleIcon(simpleIcons.siApple);
  if (name.includes('youtube') || url.includes('youtu'))
    return createSimpleIcon(simpleIcons.siYoutube);
  if (name.includes('tiktok')) return createSimpleIcon(simpleIcons.siTiktok);

  if (name.includes('music')) return <MusicNoteIcon />;

  if (name.includes('instagram'))
    return createSimpleIcon(simpleIcons.siInstagram);
  if (name.includes('facebook'))
    return createSimpleIcon(simpleIcons.siFacebook);

  if (name.includes('patreon')) return createSimpleIcon(simpleIcons.siPatreon);
  if (name.includes('paypal')) return createSimpleIcon(simpleIcons.siPaypal);
  if (name.includes('gofundme'))
    return createSimpleIcon(simpleIcons.siGofundme);

  if (name.includes('website') || name.includes('site'))
    return <LanguageIcon />;

  if (name.includes('merch')) return <StorefrontIcon />;

  return createSimpleIcon(simpleIcons.siInternetarchive);
};

// -------------------------------------------------
// COMPONENT
// -------------------------------------------------

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);

  // Palette
  const [panelColor, setPanelColor] = useState('#fff');
  const [textColor, setTextColor] = useState('#000'); // panel text
  const [bgTextColor, setBgTextColor] = useState('#fff'); // gradient text

  const [buttonColor, setButtonColor] = useState('#333');
  const [buttonTextColor, setButtonTextColor] = useState('#fff');

  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // -------------------------------------------------
  // LOAD DATA + APPLY COLOR PALETTE
  // -------------------------------------------------

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get<InfoResponse>(`/info`);

        setArtist(data.artist);
        setSocials(data.socials); // ⬅ NO GROUPING — exactly as requested

        if (data.description.imageGallery.length > 0) {
          const rel = encodeURI(data.description.imageGallery[0]);
          const full = `${bucket}/${rel}`;
          setPhotoUrl(full);

          const palette = await ColorEngineInstance.extractPalette(full);

          if (palette) {
            setPanelColor(palette.oppositeSolid);
            setTextColor(palette.solidTextColor);
            setBgTextColor(palette.textColor);

            setButtonColor(palette.buttonSolid);
            setButtonTextColor(palette.buttonTextColor);
          }
        }
      } catch (err) {
        console.error('Error loading info:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // -------------------------------------------------
  // LOADING
  // -------------------------------------------------

  if (loading)
    return (
      <Box
        sx={{
          height: '100vh',
          bgcolor: '#000',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );

  // -------------------------------------------------
  // PAGE RENDER
  // -------------------------------------------------

  return (
    <AnimatedGradientBackground
      imageUrl={photoUrl ?? ''}
      style={{
        color: bgTextColor,
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 650 }}>
        {/* MAIN PANEL */}
        <Box
          sx={{
            background: panelColor,
            borderRadius: 4,
            p: 3,
            textAlign: 'center',
            boxShadow: '0 0 25px rgba(0,0,0,0.35)',
            color: textColor,
          }}
        >
          {/* NAME */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: textColor,
            }}
          >
            {artist?.name}
          </Typography>

          {/* IMAGE */}
          {photoUrl && (
            <Box
              component="img"
              src={photoUrl}
              alt="artist"
              sx={{
                width: '100%',
                borderRadius: 3,
                mb: 4,
                boxShadow: '0 0 20px rgba(0,0,0,0.3)',
              }}
            />
          )}

          {/* SOCIAL LIST — NO GROUPS */}
          <Stack spacing={2}>
            {socials.map((s) => (
              <Button
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                startIcon={getPlatformIcon(s)}
                sx={{
                  py: 1.6,
                  borderRadius: 2,
                  fontSize: 16,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  background: buttonColor,
                  color: buttonTextColor,
                  boxShadow: '0 0 12px rgba(0,0,0,0.25)',
                  transition: '0.2s',
                  '&:hover': {
                    transform: 'scale(1.03)',
                    background: buttonColor + 'dd',
                  },
                }}
              >
                {s.name}
              </Button>
            ))}
          </Stack>
        </Box>
      </Box>
    </AnimatedGradientBackground>
  );
}
