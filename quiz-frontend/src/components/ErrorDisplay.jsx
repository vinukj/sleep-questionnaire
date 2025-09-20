import React from 'react';
import { Box, Alert, AlertTitle, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = "Something went wrong",
  showRetry = true 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: '40vh', sm: '50vh' },
        p: 3,
        maxWidth: 500,
        mx: 'auto',
      }}
    >
      <Alert 
        severity="error" 
        sx={{ 
          width: '100%',
          borderRadius: 2,
          '& .MuiAlert-message': {
            width: '100%',
          }
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>
        {error}
      </Alert>
      
      {showRetry && onRetry && (
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ 
            mt: 2,
            textTransform: 'none',
          }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};

export default ErrorDisplay;