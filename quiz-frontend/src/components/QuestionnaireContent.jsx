// QuestionnaireContent.jsx
import React from 'react';
import { FormProvider, Controller } from "react-hook-form";
import {
  Box,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import QuestionRenderer from "./QuestionRenderer";

const PHONE_REGEX = /^\+91[-\s]?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const QuestionnaireContent = ({ 
  currentPage, 
  methods, 
  page, 
  questionnaire, 
  onPageChange, 
  onSubmit, 
  isSubmitting, 
  submitError 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const watchAllFields = methods.watch();

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {currentPage?.questions.map((q) => {
          if (q.dependsOn) {
            const dependentValue = watchAllFields[q.dependsOn.id];
            if (dependentValue !== q.dependsOn.value) {
              if (watchAllFields[q.id]) {
                methods.setValue(q.id, q.type === "checkbox" ? [] : "");
                if (q.type === "checkbox" && q.otherOption) {
                  methods.setValue(`${q.id}_other`, "");
                }
              }
              return null;
            }
          }

          const isRequired = q.dependsOn
            ? watchAllFields[q.dependsOn.id] === q.dependsOn.value && q.required !== false
            : q.required !== false;

          return (
            <Controller
              key={q.id}
              name={q.id}
              control={methods.control}
              defaultValue={q.type === "checkbox" ? [] : ""}
              rules={{
                required: isRequired ? { value: true, message: "This field is required" } : false,
                ...(q.type === "tel"
                  ? { pattern: { value: PHONE_REGEX, message: "Use +91 followed by 10 digits" } }
                  : {}),
                ...(q.type === "email"
                  ? { pattern: { value: EMAIL_REGEX, message: "Enter a valid email address" } }
                  : {}),
              }}
              render={({ field }) => (
                <QuestionRenderer
                  question={q}
                  value={field.value}
                  onChange={field.onChange}
                  setValue={methods.setValue}
                  error={methods.formState.errors?.[q.id]}
                />
              )}
            />
          );
        })}

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mt: 3, 
          flexDirection: { xs: 'column-reverse', sm: 'row' }, 
          justifyContent: 'space-between' 
        }}>
          <Box sx={{ order: { xs: 2, sm: 1 } }}>
            {page > 1 && (
              <Button
                onClick={() => onPageChange(page - 1)}
                variant="outlined"
                fullWidth={isMobile}
                startIcon={<span aria-hidden="true">←</span>}
                sx={{ minWidth: 120 }}
              >
                Back
              </Button>
            )}
          </Box>
          <Box sx={{ order: { xs: 1, sm: 2 }, width: isMobile ? "100%" : "auto" }}>
            {page < questionnaire.length && (
              <Button
                onClick={() => onPageChange(page + 1)}
                variant="contained"
                fullWidth={isMobile}
                endIcon={<span aria-hidden="true">→</span>}
                sx={{ minWidth: 120 }}
                disabled={currentPage.questions.some((q) => {
                  if (q.required === false) return false;
                  if (q.dependsOn) {
                    const dependentValue = watchAllFields[q.dependsOn.id];
                    if (dependentValue !== q.dependsOn.value) return false;
                  }
                  const value = watchAllFields[q.id];
                  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
                  if (isEmpty) return true;
                  if (q.type === "tel") {
                    return !(typeof value === "string" && PHONE_REGEX.test(value.trim()));
                  }
                  if (q.type === "email") {
                    return !(typeof value === "string" && EMAIL_REGEX.test(value.trim()));
                  }
                  return false;
                })}
              >
                Next
              </Button>
            )}

            {page === questionnaire.length && (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                fullWidth={isMobile}
                sx={{
                  minWidth: 120,
                  background: theme.palette.success.main,
                  "&:hover": {
                    background: theme.palette.success.dark,
                  },
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </Box>
        </Box>

        {submitError && (
          <Box mt={2}>
            <Alert severity="error">{submitError}</Alert>
          </Box>
        )}
      </form>
    </FormProvider>
  );
};

export default QuestionnaireContent;