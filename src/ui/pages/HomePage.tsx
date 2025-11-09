import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { Artist } from '../interfaces/artist';
import { Description } from '../interfaces/description';
import { Social } from '../interfaces/social';

interface InfoResponse {
  artist: Artist;
  description: Description;
  socials: Social[];
}

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const bucketUrl = import.meta.env.VITE_S3_PUBLIC_BASE_URL;

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        document.body.style.cursor = 'wait';

        const res = await axios.get<InfoResponse>('/info');
        const { socials, description } = res.data;

        const websiteSocial = socials.find(
          (social) => social.name.toLowerCase() === 'website'
        );

        if (websiteSocial) {
          window.location.href = websiteSocial.originalUrl;
          return;
        }

        if (description.imageGallery.length > 0) {
          const relativePath = description.imageGallery[0];
          const encodedPath = encodeURI(relativePath);
          const fullUrl = `${bucketUrl}/${encodedPath}`;

          setBackgroundImage(fullUrl);
        }
        document.body.style.cursor = 'default';
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch info:', err);
      }
    };

    fetchInfo();
  }, []);

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
          cursor: 'wait',
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {/* Dark overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" color="white" textAlign="center" px={2}>
          Main site is not configured.
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;
