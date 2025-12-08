import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
  useMediaQuery,
  Fade,
  SvgIcon
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

// Interfaces
import { Artist } from '../interfaces/artist';
import { Description } from '../interfaces/description';
import { Social, SocialLabel } from '../interfaces/social';

// SIMPLE ICONS
import * as simpleIcons from "simple-icons";

// Types
interface InfoResponse {
  artist: Artist;
  description: Description;
  socials: Social[];
}

interface GroupedSocials {
  [groupName: string]: Social[];
}

// Animations
const fadeIn = {
  opacity: 0,
  transform: 'translateY(20px)',
  animation: 'fadeUp .8s ease forwards',
};

// Convert SimpleIcon to MUI SvgIcon
const createSimpleIcon = (icon: any) => {
  if (!icon) return null;
  return (
    <SvgIcon
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 24, height: 24, fill: `#${icon.hex}` }}
    >
      <path d={icon.path} />
    </SvgIcon>
  );
};

// ICON DETECTION — best possible matching
import MusicNoteIcon from "@mui/icons-material/MusicNote";

const getPlatformIcon = (s: Social) => {
  const name = s.name.toLowerCase();
  const url = (s.originalUrl || s.url).toLowerCase();

  // SPECIFIC MUSIC PLATFORMS
  if (name.includes("spotify")) 
    return createSimpleIcon(simpleIcons.siSpotify);

  // Apple Music does NOT exist in Simple Icons → use generic Apple
  if (
    name.includes("apple") || 
    url.includes("music.apple")
  )
    return createSimpleIcon(simpleIcons.siApple);

  // YouTube
  if (name.includes("youtube") || url.includes("youtu"))
    return createSimpleIcon(simpleIcons.siYoutube);

  // TikTok
  if (name.includes("tiktok"))
    return createSimpleIcon(simpleIcons.siTiktok);

  // GENERIC MUSIC (Amazon Music, Deezer, Pandora, Tidal, etc.)
  if (
    name.includes("music") || 
    url.includes("music.") || 
    url.includes("/music")
  ) {
    return <MusicNoteIcon sx={{ width: 24, height: 24 }} />;
  }

  // SOCIAL MEDIA
  if (name.includes("instagram"))
    return createSimpleIcon(simpleIcons.siInstagram);

  if (name.includes("facebook"))
    return createSimpleIcon(simpleIcons.siFacebook);

  // SUPPORT / DONATION
  if (name.includes("patreon"))
    return createSimpleIcon(simpleIcons.siPatreon);

  if (name.includes("paypal"))
    return createSimpleIcon(simpleIcons.siPaypal);

  if (name.includes("gofundme"))
    return createSimpleIcon(simpleIcons.siGofundme);

  // WEBSITE / OTHER (generic internet icon)
  return createSimpleIcon(simpleIcons.siInternetarchive);
};


// COMPONENT ----------------------------------------------------------------

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupedSocials>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const apiUrl = import.meta.env.VITE_API_URL;
  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  // Fetch info + social labels
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [infoRes, labelsRes] = await Promise.all([
          axios.get<InfoResponse>(`${apiUrl}/info`),
          axios.get<SocialLabel[]>(`${apiUrl}/socials/labels`),
        ]);

        const { artist, description, socials } = infoRes.data;
        const labels = labelsRes.data;

        setArtist(artist);

        // Banner
        if (description.imageGallery?.length > 0) {
          const path = encodeURI(description.imageGallery[0]);
          setBanner(`${bucket}/${path}`);
        }

        // Map labels
        const labelMap: Record<string, string> = {};
        labels.forEach((l) => (labelMap[l.id] = l.name));

        // Group socials
        const grouped: GroupedSocials = {};

        socials.forEach((s) => {
          if (s.socialLabelsList.length === 0) {
            if (!grouped["Other"]) grouped["Other"] = [];
            grouped["Other"].push(s);
          } else {
            s.socialLabelsList.forEach((labelId) => {
              const group = labelMap[labelId] || "Other";
              if (!grouped[group]) grouped[group] = [];
              grouped[group].push(s);
            });
          }
        });

        setGroups(grouped);
      } catch (err) {
        console.error("Failed to load homepage:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // LOADING
  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          background: "#000",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // PAGE ------------------------------------------------------------------

  return (
    <>
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
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          background: "linear-gradient(135deg, #0f0f1f, #1a1a33, #0e0e19)",
          color: "white",
          overflow: "hidden",
        }}
      >
        {/* LEFT PANEL ------------------------------------------------------- */}
        <Box
          sx={{
            flex: 1,
            p: 4,
            mt: 4,
            mb: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            overflowY: "auto",
          }}
        >
          {/* Artist Name */}
          <Box sx={{ ...fadeIn, animationDelay: "0.1s" }}>
            <Typography
              variant={isMobile ? "h4" : "h3"}
              sx={{ fontWeight: "bold", textAlign: isMobile ? "center" : "left" }}
            >
              {artist?.name}
            </Typography>
          </Box>

          {/* Groups */}
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
                    textAlign: "center",
                    textTransform: "uppercase",
                    mb: 1,
                    letterSpacing: 1,
                  }}
                >
                  {groupName}
                </Typography>

                <Stack spacing={1.5}>
                  {items.map((s) => (
                    <Button
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      fullWidth
                      sx={{
                        py: 1.8,
                        borderRadius: 2,
                        textTransform: "none",
                        background:
                          "linear-gradient(90deg, #6A5ACD,#7B68EE,#6A5ACD)",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        fontSize: 16,
                        fontWeight: 600,
                        gap: 1.5,
                        '&:hover': {
                          transform: "scale(1.03)",
                          transition: "0.2s",
                        },
                      }}
                      startIcon={getPlatformIcon(s)}
                    >
                      {s.name}
                    </Button>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* RIGHT PANEL (IMAGE) ---------------------------------------------- */}
        <Fade in timeout={900}>
          <Box
            sx={{
              flex: 1,
              position: "relative",
              minHeight: "100vh",
              backgroundColor: "#000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 2,
            }}
          >
            {banner ? (
              <Box
                component="img"
                src={banner}
                alt="Banner"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Typography>No Banner</Typography>
            )}
          </Box>
        </Fade>
      </Box>
    </>
  );
};

export default HomePage;
