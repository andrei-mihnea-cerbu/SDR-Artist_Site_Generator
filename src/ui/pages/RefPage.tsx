import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const RefPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const bucketUrl = process.env.REACT_APP_S3_PUBLIC_BASE_URL;

  useEffect(() => {
    const load = async () => {
      try {
        document.body.style.cursor = 'wait';
        const res = await axios.get<InfoResponse>('/info');
        console.log('Response from /info:', res.data);
        const { socials, description } = res.data;

        if (description.imageGallery.length > 0) {
          const relativePath = description.imageGallery[0];
          const encodedPath = encodeURI(relativePath);
          const fullUrl = `${bucketUrl}/${encodedPath}`;

          setBackgroundImage(fullUrl);
        }

        console.log(description.imageGallery);

        const matchedSocial = socials.find(
          (social) =>
            social.name.toLowerCase().toLowerCase().replace(/\s+/g, '') ===
            name?.toLowerCase().replace(/\s+/g, '')
        );

        console.log('Matched social:', matchedSocial);

        if (matchedSocial) {
          setTimeout(() => {
            window.location.href = matchedSocial.originalUrl;
          }, 500);
          return;
        } else {
          setNotFound(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch info:', err);
        setNotFound(true);
        setLoading(false);
      } finally {
        document.body.style.cursor = 'default';
      }
    };

    load();
  }, [name]);

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
          flexDirection: 'column',
          textAlign: 'center',
        }}
      >
        {loading ? (
          <>
            <Typography variant="h6" color="white" mb={2}>
              Redirecting...
            </Typography>
            <CircularProgress color="inherit" />
          </>
        ) : notFound ? (
          <Typography variant="h5" color="white" px={2}>
            This link can’t be found.
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
};

export default RefPage;
