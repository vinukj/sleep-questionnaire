import React, { useCallback, useMemo, useEffect } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Select,
  MenuItem,
  Button,
  Container,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import RadioQuestion from "./questions/RadioQuestion";
import DateTimeQuestion from "./questions/DateTimeQuestion";
import { useQuestionnaireForm } from "../hooks/useQuestionnaireForm";
import { styled } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import Navbar from "./Navbar";

const API_URL = import.meta.env.VITE_API_URL || "";

/* Styled components */
const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 800,
  margin: theme.spacing(2, "auto"),
  boxShadow: theme.shadows[3],
  borderRadius: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    margin: theme.spacing(1),
    borderRadius: theme.spacing(1),
  },
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
  },
}));

const QuestionBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
  },
}));

const FooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    marginTop: theme.spacing(3),
    flexDirection: "column",
    gap: theme.spacing(2),
  },
}));

const Questionnaire = ({ questionnaire }) => {
  // State and Refs
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0);
  const [submitError, setSubmitError] = React.useState(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const containerRef = React.useRef(null);

  // Custom hook for form management
  const {
    answers: formData,
    errors: validationErrors,
    isSubmitting,
    isDirty,
    setIsSubmitting,
    setIsDirty,
    handleAnswerChange,
    handleDateTimeChange,
    validateAnswers,
    resetForm,
    setStorageKey,
  } = useQuestionnaireForm();

  // Hooks
  const { authFetch, currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Constants
  const MAX_TEXT_LENGTH = 1000;
  const MAX_TEXTAREA_LENGTH = 2000;

  // Set up storage key based on current user
  useEffect(() => {
    const newStorageKey = `questionnaire_${currentUser?.id || "temp"}`;
    setStorageKey((prev) => (prev !== newStorageKey ? newStorageKey : prev));
  }, [currentUser, setStorageKey]);

  // Derived
  const currentPage = questionnaire[currentPageIndex];
  const isLastPage = currentPageIndex === questionnaire.length - 1;
  const progress = ((currentPageIndex + 1) / questionnaire.length) * 100;

  // --- Sanitization ---
  const sanitizeInput = useCallback((value, type = "text") => {
    if (typeof value !== "string") return value;

    let sanitized = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    switch (type) {
      case "email":
        sanitized = sanitized.toLowerCase().trim();
        break;
      case "tel":
        sanitized = sanitized.replace(/[^\d\+\-\s\(\)]/g, "");
        break;
      case "number":
        sanitized = sanitized.replace(/[^\d.-]/g, "");
        break;
      case "textarea":
        if (sanitized.length > MAX_TEXTAREA_LENGTH) {
          sanitized = sanitized.substring(0, MAX_TEXTAREA_LENGTH);
        }
        break;
      default:
        if (sanitized.length > MAX_TEXT_LENGTH) {
          sanitized = sanitized.substring(0, MAX_TEXT_LENGTH);
        }
    }

    return sanitized;
  }, []);

  const clearSavedData = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // --- Calculated fields ---
  // Note: this supports calculated questions only when question.dependsOn is an array of field IDs.
  useEffect(() => {
    const updateCalculatedFields = () => {
      currentPage.questions.forEach((question) => {
        if (
          question.calculated &&
          Array.isArray(question.dependsOn) &&
          question.formula
        ) {
          const dependencies = question.dependsOn;
          const values = {};
          let canCalculate = true;

          dependencies.forEach((depId) => {
            const numeric = Number(formData[depId]);
            if (numeric === 0 || Number.isNaN(numeric)) {
              // treat 0 as valid; only skip if missing or NaN
              if (
                formData[depId] === undefined ||
                formData[depId] === null ||
                formData[depId] === ""
              ) {
                canCalculate = false;
              }
            }
            values[depId] = numeric;
          });

          if (canCalculate) {
            try {
              const calculate = new Function(
                ...dependencies,
                `return ${question.formula}`
              );
              const result = calculate(
                ...dependencies.map((dep) => values[dep])
              );
              const roundedResult = Math.round(result * 100) / 100;
              const currentValue = formData[question.id];
              if (
                currentValue === undefined ||
                String(currentValue) !== String(roundedResult)
              ) {
                handleAnswerChange(question.id, String(roundedResult));
              }
            } catch (err) {
              console.error("Calculation error for", question.id, err);
            }
          }
        }
      });
    };

    const debouncedUpdate = setTimeout(updateCalculatedFields, 100);
    return () => clearTimeout(debouncedUpdate);
  }, [currentPage, formData, handleAnswerChange]);

  // --- Unsaved changes warning ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Page completion memo
  const isPageComplete = useMemo(() => {
    const currentPageQuestions = currentPage.questions.filter((q) => {
      if (!q.dependsOn) return true;
      if (Array.isArray(q.dependsOn)) return true;
      return formData[q.dependsOn.id] === q.dependsOn.value;
    });

    // Check if all required fields are filled
    const allFieldsComplete = currentPageQuestions.every((question) => {
      // Skip if question is not required
      if (question.required === false) return true;

      const value = formData[question.id];
      
      // Check for empty values
      if (value === undefined || value === null || value === '') return false;
      
      // For arrays (checkbox groups), ensure at least one option is selected
      if (Array.isArray(value)) return value.length > 0;
      
      // For date/time, ensure it's a valid format
      if (question.type === 'date') {
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      }
      if (question.type === 'time') {
        return /^\d{2}:\d{2}$/.test(value);
      }

      return true;
    });

    return allFieldsComplete && validateAnswers(currentPageQuestions);
  }, [currentPage, formData, validateAnswers]);

  // --- Handlers ---
  const handleInputChange = useCallback(
    (questionId, value, type = "text") => {
      const sanitizedValue = sanitizeInput(value, type);
      handleAnswerChange(questionId, sanitizedValue);
    },
    [sanitizeInput, handleAnswerChange]
  );

  const handleCheckboxChange = useCallback(
    (questionId, option, isChecked) => {
      const sanitizedOption = sanitizeInput(option);
      const currentAnswers = formData[questionId] || [];
      const newAnswers = isChecked
        ? [...currentAnswers, sanitizedOption]
        : currentAnswers.filter((a) => a !== sanitizedOption);
      handleAnswerChange(questionId, newAnswers);
    },
    [sanitizeInput, handleAnswerChange, formData]
  );

  // Navigation
  const goToNextPage = useCallback(() => {
    if (!isLastPage) {
      const currentPageQuestions = currentPage.questions.filter((q) => {
        if (!q.dependsOn) return true;
        if (Array.isArray(q.dependsOn)) return true;
        return formData[q.dependsOn.id] === q.dependsOn.value;
      });

      if (validateAnswers(currentPageQuestions)) {
        setCurrentPageIndex((prev) => prev + 1);
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [isLastPage, currentPage, formData, validateAnswers]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPageIndex]);

  // Submission
  const handleFormSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get all visible questions from all pages
      const allQuestions = questionnaire.flatMap((page) =>
        page.questions.filter((q) => {
          if (!q.dependsOn) return true;
          if (Array.isArray(q.dependsOn)) return true;
          return formData[q.dependsOn.id] === q.dependsOn.value;
        })
      );

      if (!validateAnswers(allQuestions)) {
        throw new Error(
          "Please correct all validation errors before submitting."
        );
      }

      // Prepare sanitized payload
      const sanitizedData = Object.keys(formData).reduce((acc, key) => {
        const value = formData[key];
        if (Array.isArray(value)) {
          const otherKey = `${key}_other`;
          const otherText = formData[otherKey];
          if (value.includes("Others") && otherText) {
            acc[key] = value.map((v) =>
              v === "Others"
                ? `Others: ${sanitizeInput(otherText)}`
                : sanitizeInput(v)
            );
          } else {
            acc[key] = value.map((v) => sanitizeInput(v));
          }
        } else {
          if (!key.endsWith("_other")) {
            acc[key] = sanitizeInput(value);
          }
        }
        return acc;
      }, {});

      const response = await authFetch("/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseData: sanitizedData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Form Submitted Successfully!", result);
      clearSavedData();
      setShowSuccess(true);

      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Failed to submit");
      setTimeout(() => {
        const errorElement = document.querySelector(
          '[data-testid="submit-error"]'
        );
        if (errorElement)
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    questionnaire,
    formData,
    validateAnswers,
    authFetch,
    sanitizeInput,
    clearSavedData,
    navigate,
  ]);

  // --- Render single question ---
  const renderQuestion = (question) => {
    const { id, type, label, options } = question;
    const value = formData[id] ?? "";

    switch (type) {
      case "text":
      case "email":
      case "tel":
        return (
          <QuestionBox key={id}>
            <TextField
              fullWidth
              type={type}
              label={label}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value, type)}
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              error={!!validationErrors[id]}
              helperText={validationErrors[id]}
              required={question.required !== false}
              inputProps={{
                "aria-label": label,
                maxLength: MAX_TEXT_LENGTH,
                autoComplete:
                  type === "email" ? "email" : type === "tel" ? "tel" : "off",
              }}
            />
          </QuestionBox>
        );

      case "number":
        return (
          <QuestionBox key={id}>
            <TextField
              fullWidth
              type="number"
              label={label}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value, "number")}
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              error={!!validationErrors[id]}
              helperText={validationErrors[id]}
              required={question.required !== false}
              disabled={question.calculated}
              inputProps={{
                min: 0,
                step: label.includes("ratio") ? 0.01 : 1,
                "aria-label": label,
              }}
            />
          </QuestionBox>
        );

      case "date":
      case "time":
        return (
          <QuestionBox key={id}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <FormControl fullWidth error={!!validationErrors[id]}>
                <FormLabel
                  component="legend"
                  sx={{
                    fontSize: isMobile ? "0.9rem" : "1rem",
                    fontWeight: 600,
                    color: "text.primary",
                    mb: 1,
                  }}
                >
                  {label}
                </FormLabel>
                <DateTimeQuestion
                  question={{
                    dateLabel: type === "date" ? label : undefined,
                    timeLabel: type === "time" ? label : undefined,
                  }}
                  dateValue={type === "date" ? value : null}
                  timeValue={type === "time" ? value : null}
                  onDateChange={(date) => {
                    handleAnswerChange(id, date ? dayjs(date).format("YYYY-MM-DD") : "");
                  }}
                  onTimeChange={(time) => {
                    handleAnswerChange(id, time ? dayjs(time).format("HH:mm") : "");
                  }}
                  error={!!validationErrors[id]}
                />
              </FormControl>
            </LocalizationProvider>
          </QuestionBox>
        );

      case "radio":
        return (
          <QuestionBox key={id}>
            <RadioQuestion
              question={{
                text: label,
                options: options.map((option) => {
                  if (option === "< 15 min")
                    return { value: "lt15", label: "< 15 min" };
                  if (option === "15-30 min")
                    return { value: "15to30", label: "15-30 min" };
                  if (option === "> 30 min")
                    return { value: "gt30", label: "> 30 min" };
                  return { value: option, label: option };
                }),
              }}
              value={value}
              onChange={(newValue) => handleAnswerChange(id, newValue)}
              error={!!validationErrors[id]}
            />
          </QuestionBox>
        );

      case "checkbox": {
        const currentAnswers = formData[id] || [];
        const otherOptionChecked =
          question.otherOption &&
          currentAnswers.includes(question.otherOption.option);
        const otherTextValue = formData[`${id}_other`] || "";

        return (
          <QuestionBox key={id}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel
                component="legend"
                sx={{
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                {label}
              </FormLabel>
              <FormGroup>
                {options?.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={currentAnswers.includes(option)}
                        onChange={(e) =>
                          handleCheckboxChange(id, option, e.target.checked)
                        }
                        size={isMobile ? "small" : "medium"}
                      />
                    }
                    label={option}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: isMobile ? "0.85rem" : "0.9rem",
                      },
                    }}
                  />
                ))}
              </FormGroup>
              {question.otherOption && otherOptionChecked && (
                <TextField
                  fullWidth
                  label="Please specify"
                  value={otherTextValue}
                  onChange={(e) =>
                    handleInputChange(`${id}_other`, e.target.value)
                  }
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ mt: 1 }}
                  required
                />
              )}
            </FormControl>
          </QuestionBox>
        );
      }

      case "dropdown":
        return (
          <QuestionBox key={id}>
            <FormControl fullWidth variant="outlined">
              <FormLabel
                sx={{
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                {label}
              </FormLabel>
              <Select
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                displayEmpty
                size={isMobile ? "small" : "medium"}
              >
                <MenuItem value="" disabled>
                  <em>Select an option</em>
                </MenuItem>
                {options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </QuestionBox>
        );

      case "textarea":
        return (
          <QuestionBox key={id}>
            <TextField
              fullWidth
              multiline
              rows={isMobile ? 3 : 4}
              label={label}
              value={value}
              onChange={(e) =>
                handleInputChange(id, e.target.value, "textarea")
              }
              variant="outlined"
              error={!!validationErrors[id]}
              required={question.required !== false}
              inputProps={{
                maxLength: MAX_TEXTAREA_LENGTH,
                "aria-label": label,
              }}
              helperText={
                validationErrors[id] ||
                `${String(value).length}/${MAX_TEXTAREA_LENGTH} characters`
              }
            />
          </QuestionBox>
        );

      default:
        return (
          <QuestionBox key={id}>
            <Typography variant="body2" color="error">
              Unsupported question type: {type}
            </Typography>
          </QuestionBox>
        );
    }
  };

  return (
    <>
      <Navbar />
      <Container
        ref={containerRef}
        maxWidth="md"
        sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}
      >
        <StyledCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <ProgressContainer>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  component="h1"
                  color="primary"
                  fontWeight={600}
                >
                  {currentPage.title}
                </Typography>
                <Chip
                  label={`${currentPage.page}/${questionnaire.length}`}
                  color="primary"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            </ProgressContainer>

            <Box sx={{ mt: 3 }}>
              {currentPage.questions.map((question) => {
                // Visibility: supports dependsOn as object {id, value}
                if (question.dependsOn && !Array.isArray(question.dependsOn)) {
                  const depId = question.dependsOn.id;
                  const requiredVal = question.dependsOn.value;
                  if (formData[depId] !== requiredVal) return null;
                }
                return renderQuestion(question);
              })}
            </Box>

            <FooterContainer>
              <Box sx={{ display: "flex", gap: 1 }}>
                {currentPageIndex > 0 && (
                  <Button
                    onClick={goToPreviousPage}
                    variant="outlined"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      minWidth: { xs: 100, sm: 120 },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    ← Back
                  </Button>
                )}
              </Box>

              {submitError && (
                <Box sx={{ width: "100%", mb: 2 }} data-testid="submit-error">
                  <Alert severity="error" onClose={() => setSubmitError(null)}>
                    {submitError}
                  </Alert>
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1 }}>
                {isLastPage ? (
                  <Button
                    onClick={handleFormSubmit}
                    disabled={!isPageComplete || isSubmitting}
                    variant="contained"
                    size={isMobile ? "medium" : "large"}
                    startIcon={
                      isSubmitting ? <CircularProgress size={20} /> : null
                    }
                    sx={{
                      minWidth: { xs: 120, sm: 140 },
                      py: { xs: 1, sm: 1.5 },
                    }}
                    aria-label="Submit questionnaire"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                ) : (
                  <Button
                    onClick={goToNextPage}
                    disabled={!isPageComplete}
                    variant="contained"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      minWidth: { xs: 120, sm: 140 },
                      py: { xs: 1, sm: 1.5 },
                    }}
                  >
                    Next →
                  </Button>
                )}
              </Box>
            </FooterContainer>
          </CardContent>
        </StyledCard>

        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            ✅ Questionnaire submitted successfully! Redirecting to home page...
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default Questionnaire;
