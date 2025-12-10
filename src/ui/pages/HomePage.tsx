import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
  SvgIcon,
  Fade,
  Grid,
} from '@mui/material';
import axios from 'axios';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LanguageIcon from '@mui/icons-material/Language';
import StorefrontIcon from '@mui/icons-material/Storefront';

import * as simpleIcons from 'simple-icons';

import { Artist } from '../interfaces/artist';
import { Social } from '../interfaces/social';
import { InfoResponse } from '../interfaces/info';

import { ColorEngineInstance } from '../utils/color_engine';

// =====================================================
// ICON HELPERS
// =====================================================

const createSimpleIcon = (icon: any) => {
  if (!icon) return null;
  return (
    <SvgIcon
      component="svg"
      viewBox="0 0 24 24"
      sx={{
        width: { xs: 26, md: 32 },
        height: { xs: 26, md: 32 },
        fill: `#${icon.hex}`,
      }}
    >
      <path d={icon.path} />
    </SvgIcon>
  );
};

const getPlatformIcon = (s: Social) => {
  const name = s.name.toLowerCase();
  const url = s.url.toLowerCase();

  if (name.includes('spotify')) return createSimpleIcon(simpleIcons.siSpotify);
  if (name.includes('apple') || url.includes('music.apple'))
    return createSimpleIcon(simpleIcons.siApple);
  if (name.includes('youtube') || url.includes('youtu'))
    return createSimpleIcon(simpleIcons.siYoutube);
  if (name.includes('tiktok')) return createSimpleIcon(simpleIcons.siTiktok);

  if (name.includes('music'))
    return <MusicNoteIcon sx={{ fontSize: { xs: 26, md: 32 } }} />;

  if (name.includes('instagram'))
    return createSimpleIcon(simpleIcons.siInstagram);
  if (name.includes('facebook'))
    return createSimpleIcon(simpleIcons.siFacebook);

  if (name.includes('patreon')) return createSimpleIcon(simpleIcons.siPatreon);
  if (name.includes('paypal')) return createSimpleIcon(simpleIcons.siPaypal);
  if (name.includes('gofundme'))
    return createSimpleIcon(simpleIcons.siGofundme);

  if (name.includes('website') || name.includes('site'))
    return <LanguageIcon sx={{ fontSize: { xs: 26, md: 32 } }} />;

  if (name.includes('merch'))
    return <StorefrontIcon sx={{ fontSize: { xs: 26, md: 32 } }} />;

  return createSimpleIcon(simpleIcons.siInternetarchive);
};

// =====================================================
// MAIN PAGE
// =====================================================

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [latest, setLatest] = useState<any>(null);

  const [panelColor, setPanelColor] = useState('#fff');
  const [textColor, setTextColor] = useState('#000');
  const [buttonColor, setButtonColor] = useState('#333');
  const [buttonTextColor, setButtonTextColor] = useState('#fff');

  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;
  const [fadeIn, setFadeIn] = useState(false);

  // =====================================================
  // LOAD INFO
  // =====================================================
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get<InfoResponse>(`/info`);

        setArtist(data.artist);
        setSocials(
          data.socials.slice().sort((a, b) => a.name.localeCompare(b.name))
        );
        setLatest(data.latestReleases);

        if (data.description.imageGallery.length > 0) {
          const rel = encodeURI(data.description.imageGallery[0]);
          const full = `${bucket}/${rel}`;
          setPhotoUrl(full);

          const palette = await ColorEngineInstance.extractPalette(full);
          if (palette) {
            setPanelColor(palette.oppositeSolid);
            setTextColor(palette.solidTextColor);
            setButtonColor(palette.buttonSolid);
            setButtonTextColor(palette.buttonTextColor);
          }
        }
      } catch (err) {
        console.error('Error loading info:', err);
      } finally {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 150);
      }
    };

    load();
  }, []);

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* ===================================================== */}
      {/* BACKGROUND BLUR + KEN BURNS */}
      {/* ===================================================== */}
      {photoUrl && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(4px) brightness(0.55)',
            transform: 'scale(1.06)',
            animation: 'kenburns 22s ease-in-out infinite',
            zIndex: -2,
            '@keyframes kenburns': {
              '0%': { transform: 'scale(1.06)' },
              '50%': { transform: 'scale(1.12)' },
              '100%': { transform: 'scale(1.06)' },
            },
          }}
        />
      )}

      {/* OVERLAY */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.45)',
          zIndex: -1,
        }}
      />

      <Fade in={fadeIn} timeout={700}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1400,
            mx: 'auto',
            pt: 4,
            pb: 6,
            px: 2,
          }}
        >
          {/* ===================================================== */}
          {/* TITLE */}
          {/* ===================================================== */}
          <Box
            sx={{
              mx: 'auto',
              mb: 4,
              p: 2,
              px: 4,
              width: 'fit-content',
              textAlign: 'center',
              borderRadius: 4,
              background: panelColor,
              color: textColor,
              boxShadow: '0 0 25px rgba(0,0,0,0.35)',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {artist?.name}
            </Typography>
          </Box>

          {/* ===================================================== */}
          {/* LAYOUT */}
          {/* ===================================================== */}
          <Grid container spacing={4}>
            {/* LEFT COLUMN — SOCIALS */}
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 480,
                  bgcolor: panelColor,
                  color: textColor,
                  p: 2,
                  borderRadius: 4,
                  boxShadow: '0 0 20px rgba(0,0,0,0.35)',
                }}
              >
                <Stack spacing={2}>
                  {socials.map((s, idx) => (
                    <Fade key={s.id} in={fadeIn} timeout={500 + idx * 80}>
                      <Button
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        fullWidth
                        startIcon={getPlatformIcon(s)}
                        sx={{
                          py: { xs: 1.8, md: 2 },
                          borderRadius: 2,
                          fontSize: { xs: 18, md: 22 },
                          justifyContent: 'center',
                          gap: { xs: 1.5, md: 2 },
                          textTransform: 'none',
                          background: buttonColor,
                          color: buttonTextColor,
                          boxShadow: '0 0 12px rgba(0,0,0,0.25)',
                          '&:hover': {
                            transform: 'scale(1.03)',
                            background: buttonColor + 'dd',
                          },
                        }}
                      >
                        {s.name}
                      </Button>
                    </Fade>
                  ))}
                </Stack>
              </Box>
            </Grid>

            {/* RIGHT COLUMN — LATEST RELEASES */}
            <Grid size={{ xs: 12, md: 8 }}>
              {latest && (
                <Box
                  sx={{
                    background: panelColor,
                    color: textColor,
                    borderRadius: 4,
                    p: 3,
                    boxShadow: '0 0 20px rgba(0,0,0,0.35)',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      textAlign: 'center',
                      mb: 3,
                      p: 1,
                      borderRadius: 2,
                      background: buttonColor,
                      color: buttonTextColor,
                      display: 'inline-block',
                      mx: 'auto',
                    }}
                  >
                    Latest Releases
                  </Typography>

                  <Grid container spacing={3} justifyContent="center">
                    {/* YOUTUBE */}
                    {latest.youtube && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            width: { xs: '92%', md: 500 },
                            mx: 'auto',
                            background: '#ffffff18',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                            boxShadow: '0 0 10px rgba(0,0,0,0.25)',
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              mb: 2,
                            }}
                          >
                            <img
                              src={latest.youtube.thumbnailUrl}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 6,
                              }}
                            />
                          </Box>

                          <Typography fontWeight={700} sx={{ mb: 1 }}>
                            📺 YouTube Release
                          </Typography>

                          <Typography variant="body2">
                            {latest.youtube.title}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* SPOTIFY */}
                    {latest.spotify && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            width: { xs: '92%', md: 500 },
                            mx: 'auto',
                            background: '#ffffff18',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                            boxShadow: '0 0 10px rgba(0,0,0,0.25)',
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              mb: 2,
                            }}
                          >
                            <img
                              src={latest.spotify.imageUrl}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 6,
                              }}
                            />
                          </Box>

                          <Typography fontWeight={700} sx={{ mb: 1 }}>
                            🎵 Spotify Release
                          </Typography>

                          <Typography variant="body2">
                            {latest.spotify.name}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Box>
  );
}
