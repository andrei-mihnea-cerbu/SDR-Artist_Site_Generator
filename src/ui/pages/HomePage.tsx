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
import { Social, SocialLabel } from '../interfaces/social';
import { InfoResponse } from '../interfaces/info';

import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { ColorEngineInstance } from '../utils/color_engine';

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

// ICON MAPPER
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
  const [banner, setBanner] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, Social[]>>({});

  // Theme colors
  const [panelColor, setPanelColor] = useState('rgba(255,255,255,1)');
  const [buttonGradient, setButtonGradient] = useState(
    'linear-gradient(90deg,#ffffff,#eeeeee)'
  );
  const [textColor, setTextColor] = useState('#000');

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

          const palette = await ColorEngineInstance.extractPalette(full);

          if (palette) {
            const { vibrant, dark, textColor, oppositeSolid } = palette;

            // Panel uses opposite solid background
            setPanelColor(oppositeSolid);

            // Buttons use gradient based on palette
            setButtonGradient(
              `linear-gradient(90deg, ${vibrant}dd, ${dark}ee)`
            );

            setTextColor(textColor);
          }
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
      style={{
        color: textColor,
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 650 }}>
        {/* MAIN PANEL (solid color, includes title & image) */}
        <Box
          sx={{
            background: panelColor,
            borderRadius: 4,
            p: 3,
            boxShadow: '0 0 25px rgba(0,0,0,0.35)',
            textAlign: 'center',
          }}
        >
          {/* ARTIST NAME */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              color: textColor,
            }}
          >
            {artist?.name}
          </Typography>

          {/* BANNER IMAGE INSIDE PANEL */}
          {banner && (
            <Box
              component="img"
              src={banner}
              alt="banner"
              sx={{
                width: '100%',
                borderRadius: 3,
                mb: 4,
                boxShadow: '0 0 20px rgba(0,0,0,0.3)',
              }}
            />
          )}

          {/* SOCIAL GROUPS */}
          {Object.entries(groups).map(([group, items]) => (
            <Box key={group} sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.7,
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: textColor,
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
                      boxShadow: '0 0 12px rgba(0,0,0,0.25)',
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
