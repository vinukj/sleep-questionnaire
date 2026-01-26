// QuestionnaireContent.jsx
import React, { useEffect, useRef } from "react";
import { FormProvider, Controller } from "react-hook-form";
import { Box, Button, Alert, useTheme, useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";
import QuestionRenderer from "./QuestionRenderer";

const PHONE_REGEX = /^\+91[-\s]?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Section styling
const SectionContainer = styled(Box)({
  padding: "1rem",
  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  borderRadius: "0.5rem",
  marginBottom: "1.25rem",
});

const SectionHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  marginBottom: "0.75rem",
});

const SectionIcon = styled(Box)({
  fontSize: "1.25rem",
});

const SectionTitle = styled("h2")({
  fontSize: "0.938rem",
  fontWeight: 600,
  color: "#1F2937",
  margin: 0,
});

const QuestionGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "0.75rem",
  "@media (min-width: 600px)": {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
});

const QuestionWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDependent",
})(({ isDependent }) => ({
  gridColumn: isDependent ? "1 / -1" : "auto",
}));

// Helper function to group questions into sections
const getQuestionSections = (pageTitle, questions) => {
  if (pageTitle === "Patient Information") {
    return [
      {
        title: "Identity",
        icon: "🆔",
        questions: questions.filter(q => ["hospital_id", "name"].includes(q.id)),
      },
      {
        title: "Demographics",
        icon: "👤",
        questions: questions.filter(q => ["gender", "age", "occupation", "phone", "email"].includes(q.id)),
      },
    ];
  }
  
  if (pageTitle === "Sleep History and Habits" || pageTitle === "Sleep History & Habits") {
    return [
      {
        title: "Main Complaints",
        icon: "📝",
        questions: questions.filter(q => ["presenting_complaints"].includes(q.id)),
      },
      {
        title: "Sleep Schedule",
        icon: "🌙",
        questions: questions.filter(q => ["bedtime", "sleep_latency"].includes(q.id)),
      },
      {
        title: null,
        icon: null,
        questions: questions.filter(q => ["night_awakenings", "avg_sleep_hours", "shift_worker", "shift_pattern"].includes(q.id)),
      },
    ];
  }

  if(pageTitle==="Sleepiness Scales"){
    return [{
      title:"Epworth Sleepiness Scale",
      questions: questions.filter(q=>["epworth_score"].includes(q.id))
    },
    {
      title:"Indian Sleepiness Scale",
      questions:questions.filter(q=>["iss_q1","iss_q2a","iss_q2b","iss_q3","iss_q4","iss_q5","iss_q6","iss_q7","iss_q8a","iss_q8b","iss_q8c","iss_q8d","iss_q8e"].includes(q.id))
    }
  ]
  }
  
  if (pageTitle === "Clinical Examination") {
    return [
      {
        title: "Physical Measurements",
        icon: "📏",
        questions: questions.filter(q => ["height", "weight", "bmi", "waist", "hip", "waist_hip_ratio", "neck"].includes(q.id)),
      },
      {
        title: "Vital Signs",
        icon: "❤️",
        questions: questions.filter(q => ["bp", "pulse", "spo2", "mallampati"].includes(q.id)),
      },
    ];
  }

  if (pageTitle === "Co-morbidities and Medications") {
    return [
      {
        title: "Comorbid Illnesses",
        icon: "🩺",
        questions: questions.filter(q => ["hypertension", "diabetes", "ihd", "stroke", "hypothyroidism"].includes(q.id)),
      },
      {
        title: "Other Illnessses",
        icon: "🏥",
        questions: questions.filter(q => ["neurological_disorder", "respiratory_disorder"].includes(q.id)),
      },
      {
        title: "Surgery & Medications",
        icon: "💊",
        questions: questions.filter(q => ["surgery_sleep_apnea", "surgery_type", "medications", "medications_other"].includes(q.id)),
      },
    ];
  }
  
  // For other pages, return all questions without section containers
  return [
    {
      title: null,
      icon: null,
      questions: questions,
    },
  ];
};

// eslint-disable-next-line react-refresh/only-export-components
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
      if (!/^\d{1,3}$/.test(value)) return "Height must be max 3 digits";
      return true;
    },
  },

  weight: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0) return "Enter a valid weight";
      if (!/^\d{1,3}$/.test(value)) return "Weight must be max 3 digits";
      return true;
    },
  },

  waist: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0) return "Enter a valid waist circumference";
      if (!/^\d{1,3}$/.test(value)) return "Waist circumference must be max 3 digits";
      return true;
    },
  },

  hip: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0) return "Enter a valid hip circumference";
      if (!/^\d{1,3}$/.test(value)) return "Hip circumference must be max 3 digits";
      return true;
    },
  },

  neck: {
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num) || num <= 0) return "Enter a valid neck circumference";
      if (!/^\d{1,2}$/.test(value)) return "Neck circumference must be max 2 digits";
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
      value: /^\d{1,3}\/\d{1,3}$/,
      message: "BP must be in the format systolic/diastolic (e.g., 120/80), max 3 digits each",
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
  const previousValuesRef = useRef(watchAllFields);
  const resetTimeoutRef = useRef(null);

  // Reset dependent fields when parent field changes
  useEffect(() => {
    // Clear previous timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Set new timeout for dependency check (no debounce needed for clearing)
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

            // Clear dependent field if condition is not met
            if (!matched) {
              const currentValue = watchAllFields[q.id];
              const hasValue = q.type === "checkbox" 
                ? (Array.isArray(currentValue) && currentValue.length > 0)
                : (currentValue !== "" && currentValue !== null && currentValue !== undefined);
              
              if (hasValue) {
                const emptyValue = q.type === "checkbox" ? [] : "";
                methods.setValue(q.id, emptyValue, { shouldValidate: false, shouldDirty: true });
                console.log(`Cleared dependent field: ${q.id} (parent: ${q.dependsOn.id} = ${depValue})`);
              }
            }
          }
        }
      });

      // Update previous values ref
      previousValuesRef.current = { ...watchAllFields };
    }, 0); // No debounce - clear immediately

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
        {getQuestionSections(currentPage?.title, currentPage?.questions || []).map((section, sectionIdx) => (
          <React.Fragment key={sectionIdx}>
            {section.title ? (
              <SectionContainer>
                <SectionHeader>
                  <SectionIcon>{section.icon}</SectionIcon>
                  <SectionTitle>{section.title}</SectionTitle>
                </SectionHeader>
                <QuestionGrid>
                  {section.questions.map((q) => {
                    // Skip if dependency not satisfied
                    if (q.dependsOn) {
                      const depValue = watchAllFields[q.dependsOn.id];
                      const dependsOnValue = q.dependsOn.value;
                      
                      let matched = false;
                      if (Array.isArray(depValue)) {
                        matched = depValue.includes(dependsOnValue);
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
                      <QuestionWrapper key={q.id} isDependent={!!q.dependsOn || q.id === "restless_legs" || q.id === "recommended_workup" || q.id === "mallampati"}>
                        <Controller
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
                      </QuestionWrapper>
                    );
                  })}
                </QuestionGrid>
              </SectionContainer>
            ) : (
              // No section container, render questions directly in grid
              <QuestionGrid>
                {section.questions.map((q) => {
                  if (q.dependsOn) {
                    const depValue = watchAllFields[q.dependsOn.id];
                    const dependsOnValue = q.dependsOn.value;
                    
                    let matched = false;
                    if (Array.isArray(depValue)) {
                      matched = depValue.includes(dependsOnValue);
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
                    <QuestionWrapper key={q.id} isDependent={!!q.dependsOn || q.id === "restless_legs" || q.id === "recommended_workup" || q.id === "mallampati"}>
                      <Controller
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
                    </QuestionWrapper>
                  );
                })}
              </QuestionGrid>
            )}
          </React.Fragment>
        ))}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 4,
            pt: 3,
            borderTop: "1px solid #E5E7EB",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          {page > 1 && (
            <Button
              onClick={() => onPageChange(page - 1)}
              variant="outlined"
              fullWidth={isMobile}
              startIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              }
              sx={{
                minWidth: 120,
                height: "38px",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "6px",
                borderColor: "#E5E7EB",
                color: "#374151",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#D1D5DB",
                  backgroundColor: "#F9FAFB",
                },
              }}
            >
              Back
            </Button>
          )}

          {page < questionnaire.length && (
            <Button
              onClick={() => onPageChange(page + 1)}
              variant="contained"
              fullWidth={isMobile}
              endIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              }
              disabled={!isPageValid(currentPage.questions, watchAllFields)}
              sx={{
                minWidth: 140,
                height: "38px",
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "6px",
                backgroundColor: "#3B82F6",
                textTransform: "none",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  backgroundColor: "#2563EB",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                },
                "&:disabled": {
                  backgroundColor: "#9CA3AF",
                },
              }}
            >
              Save & Continue
            </Button>
          )}

          {page === questionnaire.length && (
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              fullWidth={isMobile}
              endIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
              sx={{
                minWidth: 140,
                height: "38px",
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "6px",
                backgroundColor: "#10B981",
                textTransform: "none",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  backgroundColor: "#059669",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                },
                "&:disabled": {
                  backgroundColor: "#9CA3AF",
                },
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
