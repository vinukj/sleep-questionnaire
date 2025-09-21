import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Grid,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';


import '../styles/ResultsScreen.css'; // We'll create this CSS file next

import Navbar from './Navbar';

const ResultsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { score, quizName } = location.state || {};

  if (!score) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert
            severity="warning"
            icon={<AssessmentIcon />}
            sx={{
              p: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%',
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              No Results Found
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please complete a questionnaire to see your results.
            </Typography>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/questionnaire')}
              sx={{ mt: 1 }}
            >
              Take a Questionnaire
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }

  const componentLabels = {
    c1: 'Subjective Sleep Quality',
    c2: 'Sleep Latency',
    c3: 'Sleep Duration',
    c4: 'Sleep Efficiency',
    c5: 'Sleep Disturbances',
    c6: 'Use of Medication',
    c7: 'Daytime Dysfunction',
  };

  const hasDetailedComponents = score.c1 !== undefined;

  // Determine score color and status
  const getScoreColor = (globalScore) => {
    if (globalScore <= 5) return { color: 'success', status: 'Excellent' };
    if (globalScore <= 10) return { color: 'warning', status: 'Good' };
    return { color: 'error', status: 'Needs Attention' };
  };

  const scoreInfo = getScoreColor(score.globalScore);

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.default' }}>
      <Navbar />
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Success Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white',
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            mb: 4,
            textAlign: 'center',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: { xs: 48, sm: 64 }, mb: 2 }} />
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              fontSize: { xs: '2rem', sm: '3rem' }
            }}
          >
            Quiz Complete!
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            Here are your results for the {quizName?.toUpperCase() || 'Sleep'} questionnaire
          </Typography>
          
          <Chip
            label={new Date().toLocaleDateString()}
            sx={{
              mt: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 500,
            }}
          />
        </Paper>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Main Score Card */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${scoreInfo.color === 'success' ? '#e8f5e8' : scoreInfo.color === 'warning' ? '#fff4e6' : '#ffebee'} 0%, white 50%)`,
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <AssessmentIcon 
                  sx={{ 
                    fontSize: 48, 
                    color: `${scoreInfo.color}.main`,
                    mb: 2 
                  }} 
                />
                
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Global Sleep Score
                </Typography>
                
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    color: `${scoreInfo.color}.main`,
                    mb: 2,
                    fontSize: { xs: '3rem', sm: '4rem' }
                  }}
                >
                  {score.globalScore}
                </Typography>

                <Chip
                  label={scoreInfo.status}
                  color={scoreInfo.color}
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                  }}
                />

                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                      px: 2,
                    }}
                  >
                    {score.interpretation}
                  </Typography>
                </Box>

                {/* Score Range Indicator */}
                <Box sx={{ mt: 3, px: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Score Range: 0 (Best) - 21 (Worst)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(score.globalScore / 21) * 100}
                    color={scoreInfo.color}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Breakdown */}
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Component Breakdown
                </Typography>
                
                {hasDetailedComponents ? (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {Object.keys(componentLabels).map((key) => (
                      <Box key={key}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {componentLabels[key]}
                          </Typography>
                          <Chip
                            label={score[key]}
                            size="small"
                            color={score[key] <= 1 ? 'success' : score[key] <= 2 ? 'warning' : 'error'}
                            sx={{ minWidth: 40, fontWeight: 600 }}
                          />
                        </Box>
                        {key !== 'c7' && <Divider />}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Detailed breakdown is not available for this questionnaire type.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations Card */}
          <Grid item xs={12}>
            <Card elevation={1} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  💡 Recommendations for Better Sleep
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      Sleep Schedule
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Maintain consistent bedtime and wake times, even on weekends.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      Sleep Environment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Keep your bedroom cool, dark, and quiet for optimal sleep.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      Pre-Sleep Routine
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Develop relaxing activities before bed to signal sleep time.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      Lifestyle Factors
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Limit caffeine, exercise regularly, and manage stress levels.
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => navigate('/questionnaire')}
            size="large"
            sx={{
              px: 3,
              py: 1.2,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Take Another Quiz
          </Button>
          
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/home')}
            size="large"
            sx={{
              px: 3,
              py: 1.2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Back to Dashboard
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Placeholder for download functionality
              console.log('Download results');
            }}
            size="large"
            sx={{
              px: 3,
              py: 1.2,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Export Results
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ResultsScreen;