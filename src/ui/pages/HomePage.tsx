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
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import axios from 'axios';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import StorefrontIcon from '@mui/icons-material/Storefront';

import * as simpleIcons from 'simple-icons';

import { Artist } from '../interfaces/artist';
import { Social } from '../interfaces/social';
import { InfoResponse } from '../interfaces/info';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { ColorEngineInstance } from '../utils/color_engine';

// ICON BUILDER
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

// PLATFORM ICONS
const getPlatformIcon = (s: Social) => {
  const name = s.name.toLowerCase();
  const url = s.url.toLowerCase();

  if (name.includes('spotify')) return createSimpleIcon(simpleIcons.siSpotify);
  if (name.includes('apple') || url.includes('music.apple'))
    return createSimpleIcon(simpleIcons.siApple);
  if (name.includes('youtube') || url.includes('youtu'))
    return createSimpleIcon(simpleIcons.siYoutube);
  if (name.includes('tiktok')) return createSimpleIcon(simpleIcons.siTiktok);
  if (name.includes('instagram'))
    return createSimpleIcon(simpleIcons.siInstagram);
  if (name.includes('facebook'))
    return createSimpleIcon(simpleIcons.siFacebook);
  if (name.includes('patreon')) return createSimpleIcon(simpleIcons.siPatreon);
  if (name.includes('paypal')) return createSimpleIcon(simpleIcons.siPaypal);
  if (name.includes('gofundme'))
    return createSimpleIcon(simpleIcons.siGofundme);
  if (name.includes('merch')) return <StorefrontIcon />;

  return <MusicNoteIcon />;
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [latest, setLatest] = useState<any>(null);

  // Dynamic palette
  const [panelColor, setPanelColor] = useState('#fff');
  const [textColor, setTextColor] = useState('#000');
  const [bgTextColor, setBgTextColor] = useState('#fff');

  const [buttonColor, setButtonColor] = useState('#333');
  const [buttonTextColor, setButtonTextColor] = useState('#fff');

  const [fadeIn, setFadeIn] = useState(false);

  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // Format titles by removing parenthesis like "(Official Video)"
  const formatTitle = (title: string) =>
    title.replace(/ *\([^)]*\) */g, '').trim();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get<InfoResponse>('/info');

        setArtist(data.artist);
        setSocials(
          data.socials.slice().sort((a, b) => a.name.localeCompare(b.name))
        );
        setLatest(data.latestReleases);

        if (data.description.imageGallery.length > 0) {
          const rel = encodeURI(data.description.imageGallery[0]);
          const full = `${bucket}/${rel}`;
          setPhotoUrl(full);

          // Extract UI palette from image
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
        setTimeout(() => setFadeIn(true), 100);
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

  const youtube = latest?.youtube;
  const spotify = latest?.spotify;

  // PAGE ================================
  return (
    <AnimatedGradientBackground
      imageUrl={photoUrl ?? ''}
      style={{
        color: bgTextColor,
        padding: '30px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Fade in={fadeIn} timeout={700}>
        <Box sx={{ width: '100%', maxWidth: 1400 }}>
          {/* ARTIST NAME */}
          <Typography
            variant="h2"
            align="center"
            sx={{
              mb: 4,
              fontWeight: 900,
              textShadow: '0 0 25px rgba(0,0,0,0.5)',
            }}
          >
            {artist?.name}
          </Typography>

          <Grid container spacing={4}>
            {/* LEFT COLUMN — SOCIAL LINKS */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  background: panelColor,
                  borderRadius: 4,
                  p: 3,
                  boxShadow: '0 0 25px rgba(0,0,0,0.35)',
                  color: textColor,
                }}
              >
                <Stack spacing={2}>
                  {socials.map((s, idx) => (
                    <Fade key={s.id} in={fadeIn} timeout={600 + idx * 120}>
                      <Button
                        href={s.url}
                        target="_blank"
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

            {/* RIGHT COLUMN — BANNER + LATEST RELEASES */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* BANNER PANEL */}
                <Box
                  sx={{
                    background: panelColor,
                    borderRadius: 4,
                    p: 3,
                    boxShadow: '0 0 25px rgba(0,0,0,0.35)',
                    color: textColor,
                  }}
                >
                  {photoUrl && (
                    <Box
                      component="img"
                      src={photoUrl}
                      alt="banner"
                      sx={{
                        width: '100%',
                        borderRadius: 3,
                        boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                      }}
                    />
                  )}
                </Box>

                {/* LATEST RELEASES — SEPARATE TRANSPARENT DIV */}
                <Box
                  sx={{
                    borderRadius: 4,
                    p: 3,
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 25px rgba(0,0,0,0.25)',
                  }}
                >
                  <Typography
                    variant="h5"
                    align="center"
                    sx={{ mb: 3, fontWeight: 700, color: textColor }}
                  >
                    Latest Releases
                  </Typography>

                  <Grid container spacing={3}>
                    {/* YOUTUBE CARD */}
                    {youtube && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: panelColor,
                            boxShadow: '0 0 12px rgba(0,0,0,0.25)',
                            cursor: 'pointer',
                            '&:hover': { transform: 'scale(1.03)' },
                            transition: '0.25s',
                          }}
                          onClick={() =>
                            window.open(
                              `https://youtube.com/watch?v=${youtube.videoId}`,
                              '_blank'
                            )
                          }
                        >
                          <CardMedia
                            component="img"
                            image={youtube.thumbnailUrl}
                            sx={{ height: 180 }}
                          />
                          <CardContent
                            sx={{ textAlign: 'center', color: textColor }}
                          >
                            <Typography variant="subtitle1" fontWeight={700}>
                              🎬 YouTube Release
                            </Typography>
                            <Typography variant="body2">
                              {formatTitle(youtube.title)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* SPOTIFY CARD */}
                    {spotify && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: panelColor,
                            boxShadow: '0 0 12px rgba(0,0,0,0.25)',
                            cursor: 'pointer',
                            '&:hover': { transform: 'scale(1.03)' },
                            transition: '0.25s',
                          }}
                          onClick={() =>
                            window.open(spotify.spotifyUrl, '_blank')
                          }
                        >
                          <CardMedia
                            component="img"
                            image={spotify.imageUrl}
                            sx={{ height: 180 }}
                          />
                          <CardContent
                            sx={{ textAlign: 'center', color: textColor }}
                          >
                            <Typography variant="subtitle1" fontWeight={700}>
                              🎵 Spotify Release
                            </Typography>
                            <Typography variant="body2">
                              {spotify.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </AnimatedGradientBackground>
  );
}
