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

        // Use image for color palette only (background now handled by MainLayout)
        if (data.description.imageGallery.length > 0) {
          const rel = encodeURI(data.description.imageGallery[0]);
          const full = `${bucket}/${rel}`;

          const palette = await ColorEngineInstance.extractPalette(full);
          if (palette) {
            setPanelColor(palette.oppositeSolid);
            setTextColor(palette.solidTextColor);
            setButtonColor(palette.buttonSolid);
            setButtonTextColor(palette.buttonTextColor);
          }
        }
      } finally {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 150);
      }
    };

    load();
  }, []);

  if (loading)
    return (
      <>
        <CircularProgress color="inherit" />
      </>
    );

  return (
    <>
      <Fade in={fadeIn} timeout={700}>
        <Box sx={{ mx: 'auto', pt: 4, pb: 10, px: 2 }}>
          {/* TITLE */}
          <Box
            sx={{
              mx: 'auto',
              mb: 4,
              p: 2,
              maxWidth: 600,
              textAlign: 'center',
              borderRadius: 4,
              background: panelColor,
              color: textColor,
              boxShadow: '0 0 25px rgba(0,0,0,0.35)',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {artist?.name}
            </Typography>
          </Box>

          {/* GRID */}
          <Grid container spacing={4}>
            {/* SOCIALS */}
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 500,
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
                        fullWidth
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={getPlatformIcon(s)}
                        sx={{
                          py: { xs: 1.8, md: 2 },
                          borderRadius: 2,
                          fontSize: { xs: 18, md: 22 },
                          background: buttonColor,
                          color: buttonTextColor,
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

            {/* LATEST RELEASES */}
            <Grid size={{ xs: 12, md: 7 }}>
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
                      width: 'fit-content',
                      mx: 'auto',
                    }}
                  >
                    Latest Releases
                  </Typography>

                  <Grid container spacing={3}>
                    {latest.youtube && (
                      <Grid
                        size={{ xs: 12 }}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <a
                          href={`https://www.youtube.com/watch?v=${latest.youtube.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            textDecoration: 'none',
                            width: '100%',
                            maxWidth: 420,
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              background: '#ffffff18',
                              borderRadius: 3,
                              p: 2,
                              textAlign: 'center',
                              boxShadow: '0 0 10px rgba(0,0,0,0.25)',
                              transition: 'transform 0.2s',
                              color: textColor,
                              '& *': { color: textColor },
                              cursor: 'pointer',
                              '&:hover': { transform: 'scale(1.03)' },
                            }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                borderRadius: 3,
                                overflow: 'hidden',
                                mb: 2,
                              }}
                            >
                              <img
                                src={latest.youtube.thumbnailUrl}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>

                            <Typography fontWeight={700}>
                              📺 YouTube Release
                            </Typography>
                            <Typography variant="body2">
                              {latest.youtube.title}
                            </Typography>
                          </Box>
                        </a>
                      </Grid>
                    )}

                    {latest.spotify && (
                      <Grid
                        size={{ xs: 12 }}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <a
                          href={latest.spotify.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            textDecoration: 'none',
                            width: '100%',
                            maxWidth: 420,
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              background: '#ffffff18',
                              borderRadius: 3,
                              p: 2,
                              textAlign: 'center',
                              boxShadow: '0 0 10px rgba(0,0,0,0.25)',
                              transition: 'transform 0.2s',
                              color: textColor,
                              '& *': { color: textColor },
                              cursor: 'pointer',
                              '&:hover': { transform: 'scale(1.03)' },
                            }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                borderRadius: 3,
                                overflow: 'hidden',
                                mb: 2,
                              }}
                            >
                              <img
                                src={latest.spotify.imageUrl ?? ''}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>

                            <Typography fontWeight={700}>
                              🎵 Spotify Release
                            </Typography>
                            <Typography variant="body2">
                              {latest.spotify.name}
                            </Typography>
                          </Box>
                        </a>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </>
  );
}
