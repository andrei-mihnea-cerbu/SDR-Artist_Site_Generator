import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
  SvgIcon,
} from "@mui/material";
import axios from "axios";
import { Vibrant } from "node-vibrant/node";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import LanguageIcon from "@mui/icons-material/Language";
import StorefrontIcon from "@mui/icons-material/Storefront";

import * as simpleIcons from "simple-icons";

import { Artist } from "../interfaces/artist";
import { Social, SocialLabel } from "../interfaces/social";
import { Description } from "../interfaces/description";

// ---------------- Utilities ----------------------

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

const getContrast = (hex: string) => {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000" : "#fff";
};

// ---------------- Icon Mapper ----------------------

const getPlatformIcon = (s: Social) => {
  const name = s.name.toLowerCase();
  const url = (s.originalUrl || s.url).toLowerCase();

  // MUSIC — specific
  if (name.includes("spotify")) return createSimpleIcon(simpleIcons.siSpotify);

  if (name.includes("apple") || url.includes("music.apple"))
    return createSimpleIcon(simpleIcons.siApple);

  if (name.includes("youtube") || url.includes("youtu"))
    return createSimpleIcon(simpleIcons.siYoutube);

  if (name.includes("tiktok"))
    return createSimpleIcon(simpleIcons.siTiktok);

  // GENERIC MUSIC
  if (
    name.includes("music") ||
    url.includes("music.") ||
    url.includes("/music")
  ) {
    return <MusicNoteIcon />;
  }

  // SOCIAL MEDIA
  if (name.includes("instagram"))
    return createSimpleIcon(simpleIcons.siInstagram);

  if (name.includes("facebook"))
    return createSimpleIcon(simpleIcons.siFacebook);

  // SUPPORT
  if (name.includes("patreon"))
    return createSimpleIcon(simpleIcons.siPatreon);

  if (name.includes("paypal"))
    return createSimpleIcon(simpleIcons.siPaypal);

  if (name.includes("gofundme"))
    return createSimpleIcon(simpleIcons.siGofundme);

  // WEBSITE
  if (name.includes("website") || name.includes("site"))
    return <LanguageIcon />;

  // MERCH
  if (name.includes("merch"))
    return <StorefrontIcon />;

  // FALLBACK
  return createSimpleIcon(simpleIcons.siInternetarchive);
};

// ---------------- Component ------------------------

interface InfoResponse {
  artist: Artist;
  description: Description;
  socials: Social[];
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, Social[]>>({});

  const [bgGradient, setBgGradient] = useState<string>(
    "linear-gradient(135deg, #111, #000)"
  );
  const [panelColor, setPanelColor] = useState("rgba(255,255,255,0.12)");
  const [buttonGradient, setButtonGradient] = useState(
    "linear-gradient(90deg, #ffffff22, #ffffff44)"
  );
  const [textColor, setTextColor] = useState("#fff");

  const apiUrl = import.meta.env.VITE_API_URL;
  const bucket = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  useEffect(() => {
    const load = async () => {
      try {
        const [infoRes, labelsRes] = await Promise.all([
          axios.get<InfoResponse>(`${apiUrl}/info`),
          axios.get<SocialLabel[]>(`${apiUrl}/socials/labels`),
        ]);

        const { artist, description, socials } = infoRes.data;
        const labels = labelsRes.data;

        setArtist(artist);

        // Banner
        if (description.imageGallery.length > 0) {
          const rel = encodeURI(description.imageGallery[0]);
          const full = `${bucket}/${rel}`;
          setBanner(full);

          const palette = await Vibrant.from(full).getPalette();
          const vibrant = palette.Vibrant?.hex || "#663399";
          const darkVibrant = palette.DarkVibrant?.hex || "#331a66";
          const muted = palette.Muted?.hex || "#222";

          setBgGradient(
            `linear-gradient(135deg, ${darkVibrant}dd, ${muted}cc, #000)`
          );

          setPanelColor(`${muted}aa`);

          setButtonGradient(
            `linear-gradient(90deg, ${vibrant}aa, ${darkVibrant}dd)`
          );

          setTextColor(getContrast(vibrant));
        }

        const labelMap: Record<string, string> = {};
        labels.forEach((l) => (labelMap[l.id] = l.name));

        const grouped: Record<string, Social[]> = {};

        socials.forEach((s) => {
          if (s.socialLabelsList.length === 0) {
            (grouped["Other"] ||= []).push(s);
          } else {
            s.socialLabelsList.forEach((id) => {
              (grouped[labelMap[id] || "Other"] ||= []).push(s);
            });
          }
        });

        setGroups(grouped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading)
    return (
      <Box
        sx={{
          height: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: bgGradient,
        color: textColor,
        p: 3,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 650,
          mx: "auto",
          textAlign: "center",
        }}
      >
        {/* ARTIST NAME */}
        <Typography
          variant="h3"
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {artist?.name}
        </Typography>

        {/* BANNER */}
        {banner && (
          <Box
            component="img"
            src={banner}
            alt="banner"
            sx={{
              width: "100%",
              borderRadius: 3,
              mb: 4,
            }}
          />
        )}

        {/* PANEL */}
        <Box
          sx={{
            backdropFilter: "blur(12px)",
            borderRadius: 4,
            p: 3,
            background: panelColor,
            boxShadow: "0 0 40px #0007",
          }}
        >
          {Object.entries(groups).map(([group, items], idx) => (
            <Box key={group} sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.8,
                  mb: 2,
                  textTransform: "uppercase",
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
                      textTransform: "none",
                      fontSize: 16,
                      justifyContent: "flex-start",
                      gap: 1.6,
                      color: textColor,
                      background: buttonGradient,
                      boxShadow: "0 0 10px #0006",
                      "&:hover": {
                        transform: "scale(1.02)",
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
        </Box>
      </Box>
    </Box>
  );
}
