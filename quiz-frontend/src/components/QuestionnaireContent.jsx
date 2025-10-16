// QuestionnaireContent.jsx
import React from "react";
import { FormProvider, Controller } from "react-hook-form";
import { Box, Button, Alert, TextField, useTheme, useMediaQuery } from "@mui/material";
import QuestionRenderer from "./QuestionRenderer";
import { useEffect } from "react";

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
};

const isPageValid = (questions, values) => {
  for (let q of questions) {
    if (q.required === false) continue;

    if (q.dependsOn) {
      const depValue = values[q.dependsOn.id];
      const matched = Array.isArray(depValue)
        ? depValue.includes(q.dependsOn.value)
        : depValue === q.dependsOn.value;
      if (!matched) continue;
    }

    const val = values[q.id];
    if (!val || (Array.isArray(val) && val.length === 0)) return false;

    if (q.type === "tel" && !PHONE_REGEX.test(val.trim())) return false;
    if (q.type === "email" && !EMAIL_REGEX.test(val.trim())) return false;

    if (FIELD_VALIDATION[q.id]) {
      const result = FIELD_VALIDATION[q.id].validate?.(val);
      if (result !== true) return false;
    }
  }
  return true;
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
    methods.setValue("bmi", "");
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
    methods.setValue("waist_hip_ratio", "");
  }
}, [waist, hip, methods]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {currentPage?.questions.map((q) => {
          // Skip if dependency not satisfied
          if (q.dependsOn) {
            const depValue = watchAllFields[q.dependsOn.id];
            const matched = Array.isArray(depValue)
              ? depValue.includes(q.dependsOn.value)
              : depValue === q.dependsOn.value;
            if (!matched) return null;
          }

          return (
            <Controller
              key={q.id}
              name={q.id}
              control={methods.control}
              defaultValue={q.type === "checkbox" ? [] : ""}
              rules={{
                required: q.required !== false ? { value: true, message: "This field is required" } : false,
                ...(FIELD_VALIDATION[q.id] || {}),
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
