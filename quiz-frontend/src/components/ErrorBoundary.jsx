import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Could send to error tracking service here
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box sx={{ 
            py: 8, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '100vh'
          }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'error.main' }}>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              We're sorry, but something unexpected happened.
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                onClick={() => window.location.href = '/'}
                sx={{ mr: 2 }}
              >
                Go to Home
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
            {import.meta.env.DEV && (
              <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                <Typography variant="code" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error?.toString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;