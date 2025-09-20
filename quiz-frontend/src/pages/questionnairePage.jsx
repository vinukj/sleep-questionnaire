import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  Paper,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCachedQuizList } from '../hooks/useCachedQuizList';
import Navbar from '../components/Navbar';
import LoadingScreen from '../components/LoadingScreen';
import ErrorDisplay from '../components/ErrorDisplay';

const QuestionnaireSelectionScreen = () => {
  const { quizzes, isLoading, error } = useCachedQuizList();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingScreen message="Loading available questionnaires..." />;
  }

  if (error) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <ErrorDisplay 
          error={error}
          title="Failed to load questionnaires"
          onRetry={() => window.location.reload()}
        />
      </Box>
    );
  }

  // Mock data for questionnaire details (you can replace with real data from API)
  const getQuizDetails = (quizName) => {
    const details = {
      asdq: {
        duration: '15-20 min',
        questions: '25 questions',
        difficulty: 'Intermediate',
        icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
        color: 'primary',
      },
      stjn: {
        duration: '10-15 min',
        questions: '18 questions',
        difficulty: 'Easy',
        icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
        color: 'secondary',
      },
      psqi: {
        duration: '5-10 min',
        questions: '19 questions',
        difficulty: 'Easy',
        icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
        color: 'success',
      },
    };
    return details[quizName] || {
      duration: '10-15 min',
      questions: 'Multiple questions',
      difficulty: 'Easy',
      icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
      color: 'primary',
    };
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar />
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            mb: 4,
            textAlign: 'center',
          }}
        >
          <AssignmentIcon sx={{ fontSize: { xs: 48, sm: 64 }, mb: 2, opacity: 0.9 }} />
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '2rem', sm: '3rem' }
            }}
          >
            Sleep Questionnaires
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              opacity: 0.9,
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            Choose from our scientifically validated questionnaires to assess your sleep quality and patterns
          </Typography>
        </Paper>

        {/* Questionnaires Grid */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {quizzes.map((quiz, index) => {
            const details = getQuizDetails(quiz.quiz_name);
            
            return (
              <Grid item xs={12} sm={6} lg={4} key={quiz.quiz_name}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => theme.shadows[12],
                    },
                  }}
                >
                  {/* Quiz Icon & Header */}
                  <Box
                    sx={{
                      p: 3,
                      pb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${details.color}.main`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {details.icon}
                    </Box>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 0.5,
                        }}
                      >
                        {quiz.name}
                      </Typography>
                      
                      <Chip
                        label={details.difficulty}
                        size="small"
                        color={details.color}
                        variant="outlined"
                      />
                    </Box>

                    <IconButton
                      size="small"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pt: 0, pb: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        lineHeight: 1.6,
                        mb: 3,
                        minHeight: 48,
                      }}
                    >
                      {quiz.description || 'Assess your sleep patterns and quality with this scientifically validated questionnaire.'}
                    </Typography>

                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Duration:</strong> {details.duration}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Length:</strong> {details.questions}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 1 }}>
                    <Button
                      variant="contained"
                      color={details.color}
                      fullWidth
                      size="large"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => navigate(`/quiz/${quiz.quiz_name}/EN`)}
                      sx={{
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                      }}
                    >
                      Start Questionnaire
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Empty State */}
        {quizzes.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6 },
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <AssignmentIcon 
              sx={{ 
                fontSize: 64, 
                color: 'text.disabled',
                mb: 2 
              }} 
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No questionnaires available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for new sleep assessment questionnaires.
            </Typography>
          </Paper>
        )}

        {/* Info Section */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: { xs: 3, sm: 4 },
            bgcolor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.200',
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 600,
              mb: 1
            }}
          >
            💡 Tips for Better Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Answer questions honestly for the most accurate assessment<br />
            • Complete questionnaires in a quiet environment<br />
            • Consider your sleep patterns over the past month<br />
            • Take your time - there's no rush to complete quickly
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default QuestionnaireSelectionScreen;