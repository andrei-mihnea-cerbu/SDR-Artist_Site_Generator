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
import ColorThief from 'color-thief-browser';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LanguageIcon from '@mui/icons-material/Language';
import StorefrontIcon from '@mui/icons-material/Storefront';

import * as simpleIcons from 'simple-icons';

import { Artist } from '../interfaces/artist';
import { Social, SocialLabel } from '../interfaces/social';
import { InfoResponse } from '../interfaces/info';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

// -------------------------------------------------
// UTILITIES
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

const getContrast = (hexOrRgb: string) => {
  let hex = hexOrRgb;

  if (hex.startsWith('rgb')) {
    const nums = hex
      .replace(/[^\d,]/g, '')
      .split(',')
      .map((n) => parseInt(n.trim(), 10));
    const [r, g, b] = nums;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#000' : '#fff';
  }

  // HEX fallback
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000' : '#fff';
};

// -------------------------------------------------
// ICON MAPPER
// -------------------------------------------------

const getPlatformIcon = (s: Social) => {
  const name = s.name.toLowerCase();
  const url = (s.originalUrl || s.url).toLowerCase();

  // SPECIFIC MUSIC APPS
  if (name.includes('spotify')) return createSimpleIcon(simpleIcons.siSpotify);
  if (name.includes('apple') || url.includes('music.apple'))
    return createSimpleIcon(simpleIcons.siApple);
  if (name.includes('youtube') || url.includes('youtu'))
    return createSimpleIcon(simpleIcons.siYoutube);
  if (name.includes('tiktok')) return createSimpleIcon(simpleIcons.siTiktok);

  // GENERIC MUSIC
  if (name.includes('music') || url.includes('/music'))
    return <MusicNoteIcon />;

  // SOCIAL
  if (name.includes('instagram'))
    return createSimpleIcon(simpleIcons.siInstagram);
  if (name.includes('facebook'))
    return createSimpleIcon(simpleIcons.siFacebook);

  // SUPPORT
  if (name.includes('patreon')) return createSimpleIcon(simpleIcons.siPatreon);
  if (name.includes('paypal')) return createSimpleIcon(simpleIcons.siPaypal);
  if (name.includes('gofundme'))
    return createSimpleIcon(simpleIcons.siGofundme);

  // WEBSITE
  if (name.includes('website') || name.includes('site'))
    return <LanguageIcon />;

  // MERCH
  if (name.includes('merch')) return <StorefrontIcon />;

  // FALLBACK
  return createSimpleIcon(simpleIcons.siInternetarchive);
};

// -------------------------------------------------
// COMPONENT
// -------------------------------------------------

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, Social[]>>({});

  const [bgGradient, setBgGradient] = useState(
    'linear-gradient(135deg,#111,#000)'
  );
  const [panelColor, setPanelColor] = useState('rgba(255,255,255,0.12)');
  const [buttonGradient, setButtonGradient] = useState(
    'linear-gradient(90deg,#ffffff22,#ffffff44)'
  );
  const [textColor, setTextColor] = useState('#fff');

  const apiUrl = import.meta.env.VITE_API_URL;
  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // -------------------------------------------------
  // LOAD DATA + AUTO COLOR EXTRACTION
  // -------------------------------------------------

  useEffect(() => {
    const load = async () => {
      try {
        const [infoRes, labelsRes] = await Promise.all([
          axios.get<InfoResponse>(`/info`),
          axios.get<SocialLabel[]>(`${apiUrl}/socials/labels`),
        ]);

        const { artist, description, socials } = infoRes.data;
        const labels = labelsRes.data;

        setArtist(artist);

        if (description.imageGallery.length > 0) {
          const rel = encodeURI(description.imageGallery[0]);
          const full = `${bucket}/${rel}`;
          setBanner(full);

          // Extract dominant + palette using color-thief-browser
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = full;

          img.onload = () => {
            const thief = new ColorThief();

            const dominant = thief.getColor(img); // [r,g,b]
            const palette = thief.getPalette(img, 6) || []; // [[r,g,b],...]

            const rgb = (arr: number[]) => `rgb(${arr[0]},${arr[1]},${arr[2]})`;

            const vibrant = rgb(palette[0] || dominant);
            const darkVibrant = rgb(palette[1] || dominant);
            const muted = rgb(palette[2] || [40, 40, 40]);

            setBgGradient(
              `linear-gradient(135deg, ${darkVibrant}, ${muted}, #000)`
            );

            setPanelColor(`${muted}aa`);
            setButtonGradient(
              `linear-gradient(90deg, ${vibrant}aa, ${darkVibrant}dd)`
            );

            setTextColor(getContrast(vibrant));
          };
        }

        // ------- Group Socials -------
        const labelMap: Record<string, string> = {};
        labels.forEach((l) => (labelMap[l.id] = l.name));

        const grouped: Record<string, Social[]> = {};

        socials.forEach((s) => {
          if (!s.socialLabelsList.length) {
            (grouped['Other'] ||= []).push(s);
          } else {
            s.socialLabelsList.forEach((id) => {
              const group = labelMap[id] || 'Other';
              (grouped[group] ||= []).push(s);
            });
          }
        });

        setGroups(grouped);
      } catch (err) {
        console.error('Error loading info:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // -------------------------------------------------
  // LOADING SCREEN
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
  // RENDER PAGE
  // -------------------------------------------------

  return (
    <AnimatedGradientBackground
      imageUrl={banner ?? ''}
      dynamicGradient={bgGradient}
      style={{
        color: textColor,
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 650, textAlign: 'center' }}>
        {/* ARTIST NAME */}
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
          {artist?.name}
        </Typography>

        {/* BANNER */}
        {banner && (
          <Box
            component="img"
            src={banner}
            alt="banner"
            sx={{
              width: '100%',
              borderRadius: 3,
              mb: 4,
            }}
          />
        )}

        {/* GLASS PANEL */}
        <Box
          sx={{
            backdropFilter: 'blur(14px)',
            borderRadius: 4,
            p: 3,
            background: panelColor,
            boxShadow: '0 0 35px #0007',
          }}
        >
          {Object.entries(groups).map(([group, items]) => (
            <Box key={group} sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.8,
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {group}
              </Typography>

              <Stack spacing={2}>
                {items.map((s) => (
                  <Button
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    sx={{
                      py: 1.6,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: 16,
                      justifyContent: 'flex-start',
                      gap: 1.6,
                      color: textColor,
                      background: buttonGradient,
                      boxShadow: '0 0 12px #0006',
                      transition: '0.2s',
                      '&:hover': { transform: 'scale(1.02)' },
                    }}
                    startIcon={getPlatformIcon(s)}
                  >
                    {s.name}
                  </Button>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>
    </AnimatedGradientBackground>
  );
}
