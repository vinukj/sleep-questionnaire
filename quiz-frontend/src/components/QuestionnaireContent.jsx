// QuestionnaireContent.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { FormProvider, Controller } from "react-hook-form";
import { Box, Button, Alert, useTheme, useMediaQuery } from "@mui/material";
import QuestionRenderer from "./QuestionRenderer";

const PHONE_REGEX = /^\+91[-\s]?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const FIELD_VALIDATION = {
  spo2: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num)) return "Must be a number";
      if (num < 0 || num > 100) return "SpO2 must be between 0 and 100";
      if (!/^\d{1,3}$/.test(value)) return "SpO2 must be max 3 digits";
      return true;
    },
  },
  age: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0 || !Number.isInteger(num)) return "Enter a valid age";
      return true;
    },
  },
  height: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0) return "Enter a valid height";
      return true;
    },
  },
  weight: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0) return "Enter a valid weight";
      return true;
    },
  },
  bmi: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0) return "Enter a valid BMI";
      return true;
    },
  },
  bp: {
    pattern: {
      value: /^\d{2,3}\/\d{2,3}$/,
      message: "BP must be in the format systolic/diastolic (e.g., 120/80)",
    },
  },
  phone: {
    pattern: {
      value: PHONE_REGEX,
      message: "Phone number must be a valid Indian number starting with +91",
    },
  },
  email: {
    pattern: {
      value: EMAIL_REGEX,
      message: "Email must be a valid email address",
    },
  },
};

const isPageValid = (questions, values) => {
  return questions.every((q) => {
    // Skip validation if the field has a dependsOn condition that is not satisfied
    if (q.dependsOn) {
      const depValue = values[q.dependsOn.id];
      const matched = Array.isArray(depValue)
        ? depValue.includes(q.dependsOn.value)
        : depValue === q.dependsOn.value;
      if (!matched) return true; // Skip validation for this field
    }

    if (q.required) {
      const value = values[q.id];
      if (q.type === "checkbox") {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    }
    return true;
  });
};

const QuestionnaireContent = ({
  currentPage,
  methods,
  page,
  questionnaire,
  onPageChange,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const watchAllFields = methods.watch();
  const previousValuesRef = useRef({});
  const resetTimeoutRef = useRef(null);

  // Initial sync of previous values on mount or when currentPage changes
  useEffect(() => {
    previousValuesRef.current = { ...watchAllFields };
  }, [currentPage]);

  // Debounced reset of dependent fields to avoid performance issues
  useEffect(() => {
    // Clear previous timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Set new timeout for dependency check
    resetTimeoutRef.current = setTimeout(() => {
      currentPage?.questions.forEach((q) => {
        if (q.dependsOn) {
          const depValue = watchAllFields[q.dependsOn.id];
          const previousDepValue = previousValuesRef.current[q.dependsOn.id];
          
          // Compare values properly (handles both arrays and primitives)
          const valuesChanged = JSON.stringify(depValue) !== JSON.stringify(previousDepValue);
          
          // Only reset if the dependency value actually changed
          if (valuesChanged) {
            const dependsOnValue = q.dependsOn.value;
            let matched = false;
            
            if (Array.isArray(depValue)) {
              matched = depValue.includes(dependsOnValue);
              
              // Special handling for "Others" / "Other Diagnosis" mapping
              if (!matched && dependsOnValue === "Others") {
                matched = depValue.includes("Other Diagnosis");
              }
              if (!matched && dependsOnValue === "Other Diagnosis") {
                matched = depValue.includes("Others");
              }
            } else {
              matched = depValue === dependsOnValue;
            }

            if (!matched && watchAllFields[q.id] !== "") {
              methods.setValue(q.id, q.type === "checkbox" ? [] : "");
            }
          }
        }
      });

      // Update previous values ref
      previousValuesRef.current = { ...watchAllFields };
    }, 100); // 100ms debounce

    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [watchAllFields, currentPage, methods]);

  // Watch inputs for calculations
  const height = methods.watch("height");
  const weight = methods.watch("weight");
  const waist = methods.watch("waist");
  const hip = methods.watch("hip");

  // BMI calculation
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) ** 2);
      methods.setValue("bmi", Number.isFinite(bmi) ? bmi.toFixed(2) : "");
    } else {
      methods.setValue("bmi", "N/A"); // Set default value if calculation is not possible
    }
  }, [height, weight, methods]);

  // Waist/Hip ratio calculation
  useEffect(() => {
    const wst = parseFloat(waist);
    const hp = parseFloat(hip);
    if (wst > 0 && hp > 0) {
      const ratio = wst / hp;
      methods.setValue("waist_hip_ratio", Number.isFinite(ratio) ? ratio.toFixed(2) : "");
    } else {
      methods.setValue("waist_hip_ratio", "N/A"); // Set default value if calculation is not possible
    }
  }, [waist, hip, methods]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {currentPage?.questions.map((q) => {
          // Skip if dependency not satisfied
          if (q.dependsOn) {
            const depValue = watchAllFields[q.dependsOn.id];
            const dependsOnValue = q.dependsOn.value;
            
            // Handle both array and non-array values
            let matched = false;
            if (Array.isArray(depValue)) {
              // Check for the main value or any alternative values
              matched = depValue.includes(dependsOnValue);
              
              // Special handling for "Others" / "Other Diagnosis" mapping
              if (!matched && dependsOnValue === "Others") {
                matched = depValue.includes("Other Diagnosis");
              }
              if (!matched && dependsOnValue === "Other Diagnosis") {
                matched = depValue.includes("Others");
              }
            } else {
              matched = depValue === dependsOnValue;
            }
            
            if (!matched) return null;
          }

          return (
            <Controller
              key={q.id}
              name={q.id}
              control={methods.control}
              defaultValue={q.type === "checkbox" ? [] : ""}
              rules={{
                required: q.required
                  ? { value: true, message: `${q.label} is required` }
                  : false,
                ...(FIELD_VALIDATION[q.id] || {}),
              }}
              render={({ field }) => (
                <QuestionRenderer
                  question={q}
                  value={field.value || ""}
                  onChange={field.onChange}
                  setValue={methods.setValue}
                  error={methods.formState.errors?.[q.id]}
                />
              )}
            />
          );
        })}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 3,
            flexDirection: { xs: "column-reverse", sm: "row" },
            justifyContent: "space-between",
          }}
        >
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

          {page < questionnaire.length && (
            <Button
              onClick={() => onPageChange(page + 1)}
              variant="contained"
              fullWidth={isMobile}
              endIcon={<span aria-hidden="true">→</span>}
              sx={{ minWidth: 120 }}
              disabled={!isPageValid(currentPage.questions, watchAllFields)}
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
                "&:hover": { background: theme.palette.success.dark },
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          )}
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
