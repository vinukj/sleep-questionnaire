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
import PredictionResultModal from "./PredictionResultModal.jsx";

import QuestionnaireContent from "./QuestionnaireContent";

const PageHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

const PageTitleContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
});

const PageTitle = styled("h1")(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "#1a1a1a",
  margin: 0,
  lineHeight: 1.3,

  [theme.breakpoints.up("sm")]: {
    fontSize: "1.75rem",
  },
}));

const PatientNameText = styled("p")({
  fontSize: "0.875rem",
  color: "#6B7280",
  margin: 0,
  fontWeight: 500,
});

const ProgressDots = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  alignItems: "center",
}));

const ProgressDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "completed",
})(({ active, completed }) => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  backgroundColor: completed ? "#3B82F6" : active ? "#3B82F6" : "transparent",
  border: `2px solid ${completed || active ? "#3B82F6" : "#D1D5DB"}`,
  transition: "all 0.3s ease",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 1000,
  margin: "0 auto",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  transition: "all 0.3s ease",
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
  const [patientName, setPatientName] = useState("");
  const [predictionData, setPredictionData] = useState(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);

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

  // Set default value for surgery_sleep_apnea to "No"
  useEffect(() => {
    const currentValue = methods.getValues("surgery_sleep_apnea");
    if (currentValue === undefined || currentValue === null || currentValue === "") {
      methods.setValue("surgery_sleep_apnea", "No");
    }
  }, [methods]);

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

      const result = await response.json();
      
      // If prediction data is available, show the modal
      if (result.prediction) {
        setPredictionData(result.prediction);
        setShowPredictionModal(true);
      } else {
        // If no prediction, show success message directly
        setShowSuccess(true);
        setTimeout(() => navigate("/home"), 2000);
      }
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
    
    // Extract patient name for display
    if (responseData.name) {
      setPatientName(responseData.name);
    }
    
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
      <Box ref={containerRef} sx={{ maxWidth: 1000, width: "100%", margin: "0 auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
        <PageHeader>
          <PageTitleContainer>
            <PageTitle>{currentPage?.title || "Questionnaire"}</PageTitle>
            {patientName && page > 1 && (
              <PatientNameText>Patient: {patientName}</PatientNameText>
            )}
          </PageTitleContainer>
          <ProgressDots>
            {questionnaire.map((_, index) => (
              <ProgressDot 
                key={index + 1} 
                active={page === index + 1}
                completed={page > index + 1}
              />
            ))}
          </ProgressDots>
        </PageHeader>
        
        <StyledCard>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            {isEditing && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                You are editing an existing response. Your changes will update the existing entry.
              </Alert>
            )}

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
            sx={{ width: "100%", borderRadius: 2 }}
          >
            ✅ Questionnaire submitted successfully! Redirecting to home page...
          </Alert>
        </Snackbar>

        {/* Prediction Result Modal */}
        <PredictionResultModal
          open={showPredictionModal}
          onClose={() => {
            setShowPredictionModal(false);
            setShowSuccess(true);
            setTimeout(() => navigate("/home"), 2000);
          }}
          prediction={predictionData}
        />
      </Box>
    </>
  );
}
