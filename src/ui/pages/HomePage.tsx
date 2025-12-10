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

import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { ColorEngineInstance } from '../utils/color_engine';

// ICON HELPERS -----------------------------------------

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
  const url = s.url.toLowerCase();

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

// MAIN COMPONENT -----------------------------------------

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [latest, setLatest] = useState<any>(null);

  const [panelColor, setPanelColor] = useState('#fff');
  const [textColor, setTextColor] = useState('#000');
  const [bgTextColor, setBgTextColor] = useState('#fff');
  const [buttonColor, setButtonColor] = useState('#333');
  const [buttonTextColor, setButtonTextColor] = useState('#fff');

  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;
  const [fadeIn, setFadeIn] = useState(false);

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
            setBgTextColor(palette.textColor);
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
    <AnimatedGradientBackground
      imageUrl={photoUrl ?? ''}
      style={{
        color: bgTextColor,
        minHeight: '100vh',
        padding: '30px 10px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Fade in={fadeIn} timeout={700}>
        <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
          {/* Title */}
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
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {artist?.name}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* LEFT SOCIALS COLUMN */}
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: { xs: '90%', md: '100%' },
                  maxWidth: 420,
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
                          py: 1.6,
                          borderRadius: 2,
                          fontSize: 16,
                          textTransform: 'none',
                          background: buttonColor,
                          color: buttonTextColor,
                          boxShadow: '0 0 12px rgba(0,0,0,0.25)',
                          justifyContent: 'center', // Center text
                          '& .MuiButton-startIcon': {
                            position: 'absolute',
                            left: 16, // keep icon left
                          },
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

            {/* RIGHT COLUMN */}
            <Grid size={{ xs: 12, md: 8 }}>
              {/* Banner */}
              {photoUrl && (
                <Box
                  sx={{
                    width: { xs: '90%', md: '100%' },
                    mx: 'auto',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 0 25px rgba(0,0,0,0.35)',
                    mb: 4,
                  }}
                >
                  <img
                    src={photoUrl}
                    alt="artist"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '260px',
                      objectFit: 'contain', // NO CROPPING
                    }}
                  />
                </Box>
              )}

              {/* Latest Releases */}
              {latest && (
                <Box
                  sx={{
                    width: { xs: '90%', md: '100%' },
                    mx: 'auto',
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

                  <Grid container spacing={3}>
                    {/* YouTube */}
                    {latest.youtube && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            background: '#ffffff18',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                            boxShadow: '0 0 10px rgba(0,0,0,0.25)',
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              paddingTop: '56.25%',
                            }}
                          >
                            <img
                              src={latest.youtube.thumbnailUrl}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </Box>

                          <Typography fontWeight={700} sx={{ mt: 1 }}>
                            📺 YouTube Release
                          </Typography>
                          <Typography variant="body2">
                            {latest.youtube.title}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* Spotify */}
                    {latest.spotify && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            background: '#ffffff18',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                            boxShadow: '0 0 10px rgba(0,0,0,0.25)',
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              paddingTop: '56.25%',
                            }}
                          >
                            <img
                              src={latest.spotify.imageUrl}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </Box>

                          <Typography fontWeight={700} sx={{ mt: 1 }}>
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
    </AnimatedGradientBackground>
  );
}
