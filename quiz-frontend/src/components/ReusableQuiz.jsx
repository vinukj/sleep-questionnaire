import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  IconButton,
  Stack,
  Chip,
  Fade,
  Card,
  CardContent,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

export default function ReusableQuiz({
  questions,
  onComplete,
  onExit,
  quizName,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visibleQuestions, setVisibleQuestions] = useState([]);

  useEffect(() => {
    const getVisibleQuestions = () => {
      return questions.filter((q) => {
        if (!q.dependsOn) return true;
        const parentAnswer = answers[q.dependsOn.id];
        return parentAnswer === q.dependsOn.value;
      });
    };
    
    const newVisibleQuestions = getVisibleQuestions();
    setVisibleQuestions(newVisibleQuestions);

    if (!newVisibleQuestions.find(q => q.id === visibleQuestions[currentIndex]?.id)) {
      const lastVisibleAnsweredIndex = newVisibleQuestions
        .map(q => q.id)
        .lastIndexOf(Object.keys(answers).pop());
      setCurrentIndex(Math.max(0, lastVisibleAnsweredIndex));
    }
  }, [answers, questions]);

  const currentQuestion = visibleQuestions[currentIndex];
  const progress = ((currentIndex + 1) / visibleQuestions.length) * 100;

  const handleAnswer = (answer) => {
    setAnswers((prev) => {
      const updated = { ...prev, [currentQuestion.id]: answer };
      questions.forEach((q) => {
        if (q.dependsOn?.id === currentQuestion.id && answer !== q.dependsOn.value) {
          delete updated[q.id];
        }
      });
      return updated;
    });
  };

  const goToNextQuestion = () => {
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    onComplete(answers);
  };

  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Loading quiz...</Typography>
        </Paper>
      </Container>
    );
  }

  const isAnswerSelected = !!answers[currentQuestion.id];
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        py: { xs: 2, sm: 4 },
      }}
    >
      {/* Header with close button and progress */}
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={`${currentIndex + 1} / ${visibleQuestions.length}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {quizName?.toUpperCase() || 'QUESTIONNAIRE'}
            </Typography>
          </Stack>
          
          <IconButton
            onClick={onExit}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { 
                backgroundColor: 'error.50',
                color: 'error.main'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 4 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            {Math.round(progress)}% Complete
          </Typography>
        </Box>

        {/* Question Card */}
        <Fade in={true} timeout={300}>
          <Card
            elevation={2}
            sx={{
              mb: 4,
              borderRadius: 3,
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              {/* Question Text */}
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  mb: 4,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: 'text.primary',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {currentQuestion.question}
              </Typography>

              {/* Answer Input */}
              <Box sx={{ mb: 4 }}>
                {currentQuestion.options ? (
                  // Multiple Choice
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                  >
                    <Stack spacing={1}>
                      {currentQuestion.options.map((option, idx) => (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            border: '2px solid',
                            borderColor: answers[currentQuestion.id] === option 
                              ? 'primary.main' 
                              : 'grey.300',
                            borderRadius: 2,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'primary.50',
                            },
                            backgroundColor: answers[currentQuestion.id] === option 
                              ? 'primary.50' 
                              : 'transparent',
                          }}
                        >
                          <FormControlLabel
                            value={option}
                            control={
                              <Radio
                                sx={{ 
                                  ml: 1,
                                  color: 'primary.main'
                                }}
                              />
                            }
                            label={
                              <Typography
                                variant="body1"
                                sx={{
                                  py: 1.5,
                                  fontWeight: answers[currentQuestion.id] === option ? 600 : 400,
                                  color: answers[currentQuestion.id] === option 
                                    ? 'primary.main' 
                                    : 'text.primary',
                                }}
                              >
                                {option}
                              </Typography>
                            }
                            sx={{
                              width: '100%',
                              m: 0,
                              pr: 2,
                            }}
                          />
                        </Paper>
                      ))}
                    </Stack>
                  </RadioGroup>
                ) : currentQuestion.inputType === "time" ? (
                  // Time Input
                  <TextField
                    type="time"
                    fullWidth
                    value={answers[currentQuestion.id] || "00:00"}
                    onChange={(e) => handleAnswer(e.target.value)}
                    inputProps={{
                      step: 3600,
                      min: "00:00",
                      max: "23:59",
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '1.2rem',
                      },
                    }}
                  />
                ) : (
                  // Text/Number Input
                  <TextField
                    type={currentQuestion.inputType === "number" ? "number" : "text"}
                    fullWidth
                    placeholder={
                      currentQuestion.inputType === "number" 
                        ? "Enter a number (e.g., 8)" 
                        : "Type your answer here..."
                    }
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '1.1rem',
                      },
                    }}
                  />
                )}
              </Box>

              {/* Answer Indicator */}
              {isAnswerSelected && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'success.main',
                    mb: 2,
                  }}
                >
                  <CheckCircleIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={500}>
                    Answer recorded
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goToPreviousQuestion}
            disabled={currentIndex === 0}
            sx={{
              px: 3,
              py: 1.2,
              textTransform: 'none',
              fontSize: '1rem',
              borderRadius: 2,
            }}
          >
            Previous
          </Button>

          <Button
            variant="contained"
            endIcon={isLastQuestion ? <CheckCircleIcon /> : <ArrowForwardIcon />}
            onClick={isLastQuestion ? handleSubmit : goToNextQuestion}
            disabled={!isAnswerSelected}
            sx={{
              px: 4,
              py: 1.2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
              background: isLastQuestion 
                ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': {
                background: isLastQuestion
                  ? 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)'
                  : 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              },
            }}
          >
            {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
          </Button>
        </Box>

        {/* Helper Text */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 3,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {isLastQuestion 
            ? "Review your answer and click submit when ready"
            : "Select an answer to continue to the next question"
          }
        </Typography>
      </Container>
    </Box>
  );
}
