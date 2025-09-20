import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Avatar,
  Chip,
  Paper,
  Stack,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Bedtime as BedtimeIcon,
  Analytics as AnalyticsIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { fetchAndCacheAllQuizzes } from '../service/quizCacheService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function HomeScreen() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    if (currentUser) {
      fetchAndCacheAllQuizzes();
    }
  }, [currentUser]);

  if (loading || !currentUser) {
    return <LoadingScreen message="Setting up your dashboard..." />;
  }

  const quickActions = [
    {
      title: 'Take Questionnaire',
      description: 'Answer sleep-related questions to track your progress',
      icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
      color: 'primary',
      action: () => navigate('/questionnaire'),
    },
    // {
    //   title: 'View Results',
    //   description: 'Check your latest questionnaire results and insights',
    //   icon: <AnalyticsIcon sx={{ fontSize: 32 }} />,
    //   color: 'secondary',
    //   action: () => navigate('/results'),
    // },
    // {
    //   title: 'Sleep Tracking',
    //   description: 'Monitor your sleep patterns and quality',
    //   icon: <BedtimeIcon sx={{ fontSize: 32 }} />,
    //   color: 'success',
    //   action: () => navigate('/about'),
    // },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Welcome Section */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            mb: 4,
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            alignItems="center"
          >
            <Avatar
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              {currentUser.user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flexGrow: 1 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  fontSize: { xs: '1.8rem', sm: '2.125rem' }
                }}
              >
                Welcome back, {currentUser.user.name}!
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Track your sleep, answer questionnaires, and monitor your progress toward better sleep health.
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Chip 
                  label="Sleep Tracker" 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 500 
                  }} 
                />
                <Chip 
                  label="Wellness" 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 500 
                  }} 
                />
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Quick Actions Grid */}
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 3, 
            fontWeight: 600,
            color: 'text.primary' 
          }}
        >
          Quick Actions
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
                onClick={action.action}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      color: `${action.color}.main`,
                    }}
                  >
                    {action.icon}
                  </Box>
                  
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    {action.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {action.description}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    color={action.color}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Stats Overview */}
        {/* <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 3, 
            fontWeight: 600,
            color: 'text.primary' 
          }}
        >
          Your Progress
        </Typography> */}

        {/* <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <TrendingUpIcon 
                sx={{ 
                  fontSize: 40, 
                  color: 'primary.main', 
                  mb: 1 
                }} 
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' }
                }}
              >
                0
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Questionnaires
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <BedtimeIcon 
                sx={{ 
                  fontSize: 40, 
                  color: 'secondary.main', 
                  mb: 1 
                }} 
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'secondary.main',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' }
                }}
              >
                --
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Avg Sleep
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <AnalyticsIcon 
                sx={{ 
                  fontSize: 40, 
                  color: 'success.main', 
                  mb: 1 
                }} 
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'success.main',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' }
                }}
              >
                --
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Score
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <TrendingUpIcon 
                sx={{ 
                  fontSize: 40, 
                  color: 'warning.main', 
                  mb: 1 
                }} 
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'warning.main',
                  fontSize: { xs: '1.5rem', sm: '2.125rem' }
                }}
              >
                0%
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Improvement
              </Typography>
            </Paper>
          </Grid>
        </Grid> */}
      </Container>
    </Box>
  );
}

export default HomeScreen;
