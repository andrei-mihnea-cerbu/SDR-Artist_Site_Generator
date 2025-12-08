import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
  useMediaQuery,
  Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

import { Artist } from '../interfaces/artist';
import { Description } from '../interfaces/description';
import { Social, SocialLabel } from '../interfaces/social';

// ICONS -----------------------------------------------------
import {
  Globe,
  Youtube,
  Instagram,
  Facebook,
  Music,
  Mail,
  MessageCircle,
  Smartphone,
} from 'lucide-react';

// ICON DETECTION --------------------------------------------
const getSocialIcon = (social: Social) => {
  const name = social.name.toLowerCase();
  const url = social.url.toLowerCase();

  // YouTube
  if (name.includes('youtube') || url.includes('youtu')) return <Youtube size={20} />;

  // Instagram
  if (name.includes('instagram') || url.includes('instagram')) return <Instagram size={20} />;

  // Facebook
  if (name.includes('facebook') || url.includes('facebook')) return <Facebook size={20} />;

  // TikTok
  if (name.includes('tiktok') || url.includes('tiktok')) return <Music size={20} />;

  // Spotify
  if (name.includes('spotify') || url.includes('spotify')) return <Music size={20} />;

  // Apple Music
  if (
    url.includes('music.apple') ||
    url.includes('itunes') ||
    name.includes('apple')
  ) {
    return <Music size={20} />;
  }

  // WhatsApp
  if (name.includes('whatsapp') || url.includes('whatsapp')) return <MessageCircle size={20} />;

  // Phone
  if (name.includes('phone')) return <Smartphone size={20} />;

  // Email
  if (
    name.includes('email') ||
    url.includes('mailto:') ||
    url.includes('mail') ||
    url.includes('gmail')
  ) {
    return <Mail size={20} />;
  }

  // DEFAULT → Globe
  return <Globe size={20} />;
};


// TYPES ------------------------------------------------------
interface InfoResponse {
  artist: Artist;
  description: Description;
  socials: Social[];
}

interface GroupedSocials {
  [groupName: string]: Social[];
}

// ANIMATION STYLE -------------------------------------------
const fadeIn = {
  opacity: 0,
  transform: 'translateY(20px)',
  animation: 'fadeUp .8s ease forwards',
};

// COMPONENT --------------------------------------------------
const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupedSocials>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const bucketUrl = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // FETCH DATA ------------------------------------------------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [infoRes, labelsRes] = await Promise.all([
          axios.get<InfoResponse>('/info'),
          axios.get<SocialLabel[]>('/socials/labels'),
        ]);

        const { artist, description, socials } = infoRes.data;
        const labels = labelsRes.data;

        setArtist(artist);

        // Banner
        if (description.imageGallery?.length > 0) {
          const path = encodeURI(description.imageGallery[0]);
          setBanner(`${bucketUrl}/${path}`);
        }

        // --- LABEL MAP ---
        const labelMap: Record<string, string> = {};
        labels.forEach((l) => (labelMap[l.id] = l.name));

        // --- GROUP SOCIALS ---
        const grouped: GroupedSocials = {};

        socials.forEach((s) => {
          if (s.socialLabelsList.length === 0) {
            if (!grouped['Other']) grouped['Other'] = [];
            grouped['Other'].push(s);
          } else {
            s.socialLabelsList.forEach((labelId) => {
              const groupName = labelMap[labelId] || 'Other';
              if (!grouped[groupName]) grouped[groupName] = [];
              grouped[groupName].push(s);
            });
          }
        });

        setGroups(grouped);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // LOADING SCREEN -------------------------------------------
  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // PAGE ------------------------------------------------------
  return (
    <>
      {/* Animation Keyframes */}
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          background: 'linear-gradient(135deg, #0d0d0f, #1a1a2e, #162447)',
          color: 'white',
          overflow: 'hidden',
        }}
      >
        {/* LEFT PANEL (NAME + SOCIALS) ------------------------ */}
        <Box
          sx={{
            flex: 1,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isMobile ? 'flex-start' : 'center',
            gap: 3,
          }}
        >
          {/* NAME */}
          <Box sx={{ ...fadeIn, animationDelay: '0.10s' }}>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              sx={{
                fontWeight: 'bold',
                textAlign: isMobile ? 'center' : 'left',
              }}
            >
              {artist?.name}
            </Typography>
          </Box>

          {/* SOCIAL GROUPS */}
          <Stack spacing={4} mt={2}>
            {Object.entries(groups).map(([groupName, items], idx) => (
              <Box
                key={groupName}
                sx={{ ...fadeIn, animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    opacity: 0.7,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {groupName}
                </Typography>

                <Stack spacing={1.5}>
                  {items.map((s) => (
                    <Button
                      key={s.id}
                      variant="contained"
                      fullWidth
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        py: 1.7,
                        borderRadius: 3,
                        textTransform: 'none',
                        background:
                          'linear-gradient(90deg, #7f5af0, #6246ea, #4f3bd1)',
                        fontSize: 16,
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 1.5,
                        boxShadow: '0 0 0 rgba(127,90,240,0)',
                        transition: '0.25s ease',
                        '&:hover': {
                          transform: 'scale(1.03)',
                          boxShadow: '0 8px 25px rgba(127,90,240,0.35)',
                        },
                      }}
                    >
                      {getSocialIcon(s)}
                      {s.name}
                    </Button>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* RIGHT PANEL (BANNER) ------------------------------- */}
        <Fade in timeout={900}>
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              minHeight: isMobile ? 300 : '100vh',
            }}
          >
            {banner ? (
              <>
                <Box
                  component="img"
                  src={banner}
                  alt="Banner"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    animation: 'fadeUp 1s ease forwards',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6))',
                  }}
                />
              </>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: '#111',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: 0.6,
                }}
              >
                <Typography>No Banner</Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Box>
    </>
  );
};

export default HomePage;
