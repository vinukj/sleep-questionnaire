import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: '50vh', sm: '60vh' },
        gap: 2,
        p: 3,
      }}
    >
      <CircularProgress size={48} thickness={4} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;