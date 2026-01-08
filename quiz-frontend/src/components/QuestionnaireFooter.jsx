import React from "react";
import { Box, Button, CircularProgress, Alert } from "@mui/material";

const QuestionnaireFooter = ({
  currentPageIndex,
  isLastPage,
  isPageComplete,
  isSubmitting,
  submitError,
  goToPreviousPage,
  goToNextPage,
  handleFormSubmit,
  isMobile,
  setSubmitError,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
    <Box sx={{ display: "flex", gap: 1 }}>
      {currentPageIndex > 0 && (
        <Button
          onClick={goToPreviousPage}
          variant="outlined"
          size={isMobile ? "medium" : "large"}
          sx={{ minWidth: { xs: 100, sm: 120 }, py: { xs: 1, sm: 1.5 } }}
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
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          sx={{ minWidth: { xs: 120, sm: 140 }, py: { xs: 1, sm: 1.5 } }}
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
          sx={{ minWidth: { xs: 120, sm: 140 }, py: { xs: 1, sm: 1.5 } }}
        >
          Next →
        </Button>
      )}
    </Box>
  </Box>
);

export default QuestionnaireFooter;
