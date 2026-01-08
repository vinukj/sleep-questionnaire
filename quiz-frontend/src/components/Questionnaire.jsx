import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useQuestionnaire } from "../hooks/useQuestionnaire.js";
import logger from "../utils/logger";
import {
  Box,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "./Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";

import QuestionnaireContent from "./QuestionnaireContent";

const PageTitle = styled("h1")(({ theme }) => ({
  fontSize: "1.5rem",
  marginBottom: theme.spacing(1),
  color: theme.palette.text.primary,

  [theme.breakpoints.up("sm")]: {
    fontSize: "2rem",
    marginBottom: theme.spacing(2),
  },
}));

const PageProgress = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(1, 0),
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",

  [theme.breakpoints.up("sm")]: {
    fontSize: "1rem",
  },
}));

// Note: Navigation buttons are handled inside QuestionnaireContent.

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "100%",
  margin: theme.spacing(1, "auto"),
  boxShadow: theme.shadows[2],
  borderRadius: theme.spacing(1),
  transition: "all 0.3s ease",

  [theme.breakpoints.up("sm")]: {
    maxWidth: 800,
    margin: theme.spacing(2, "auto"),
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[3],
  },
}));

// The main Questionnaire component is defined below and uses QuestionnaireContent for rendering.

export default function Questionnaire() {
  const location = useLocation();
  const { questionnaire, loading, error } = useQuestionnaire();
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const containerRef = React.useRef(null);
  const methods = useForm({
    mode: "onChange",
    defaultValues: {},
    reValidateMode: "onChange",
  });

  const [page, setPage] = useState(1);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [responseId, setResponseId] = useState(null);

  // Scroll to top when page changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);

  // Watch inputs and calculate dependent fields (BMI, waist/hip ratio)
  const height = methods.watch("height");
  const weight = methods.watch("weight");
  const waist = methods.watch("waist");
  const hip = methods.watch("hip");

  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) * (h / 100));
      methods.setValue("bmi", Number.isFinite(bmi) ? bmi.toFixed(2) : "");
    } else {
      methods.setValue("bmi", "");
    }
  }, [height, weight, methods]);

  useEffect(() => {
    const wst = parseFloat(waist);
    const hp = parseFloat(hip);
    if (wst > 0 && hp > 0) {
      const ratio = wst / hp;
      methods.setValue("waist_hip_ratio", Number.isFinite(ratio) ? ratio.toFixed(2) : "");
    } else {
      methods.setValue("waist_hip_ratio", "");
    }
  }, [waist, hip, methods]);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleFormSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Determine if we're updating or creating
      const endpoint = isEditing && responseId 
        ? `/questionnaire/update/${responseId}` 
        : '/questionnaire/submit';
      const method = isEditing && responseId ? 'PUT' : 'POST';

      const response = await authFetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseData: data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      await response.json();
      setShowSuccess(true);
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }, [authFetch, navigate, isEditing, responseId]);

  // Pre-fill form with responseData if available
  useEffect(() => {
    const responseData = location.state?.responseData || {};
    const editingState = location.state?.isEditing || false;
    const id = location.state?.responseId || null;
    
    logger.info("Received responseData in Questionnaire:", responseData);
    logger.info("Editing mode:", editingState, "Response ID:", id);
    
    setIsEditing(editingState);
    setResponseId(id);
    
    if (responseData && Object.keys(responseData).length > 0) {
      Object.keys(responseData).forEach((key) => {
        logger.debug(`Setting field ${key} with value:`, responseData[key]);
        methods.setValue(key, responseData[key]);
      });
    }
  }, [location.state, methods]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
          <StyledCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ textAlign: 'center' }}>Loading questionnaire...</Box>
            </CardContent>
          </StyledCard>
        </Container>
      </>
    );
  }

  if (error || !questionnaire) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
          <StyledCard>
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Box sx={{ textAlign: 'center', color: 'error.main' }}>
                {error || 'Failed to load questionnaire'}
              </Box>
            </CardContent>
          </StyledCard>
        </Container>
      </>
    );
  }

  const currentPage = questionnaire.find((p) => p.page === page);

  return (
    <>
      <Navbar />
      <Container ref={containerRef} maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        <StyledCard>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {isEditing && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You are editing an existing response. Your changes will update the existing entry.
              </Alert>
            )}
            <Box component="header" sx={{ mb: { xs: 2, sm: 3 } }}>
              <PageTitle>{currentPage?.title}</PageTitle>
              <PageProgress component="nav" aria-label="questionnaire navigation">
                <span aria-label={`Page ${page} of ${questionnaire.length}`}>
                  Page {page} of {questionnaire.length}
                </span>
              </PageProgress>
            </Box>

            <QuestionnaireContent 
              currentPage={currentPage}
              methods={methods}
              page={page}
              questionnaire={questionnaire}
              onPageChange={handlePageChange}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
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
}
