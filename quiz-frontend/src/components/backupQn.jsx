// import React, { useCallback, useMemo, useEffect } from "react";
// import { Box, Card, CardContent, Container, Snackbar, Alert, useTheme, useMediaQuery } from "@mui/material";
// import { styled } from "@mui/material/styles";
// import { useQuestionnaireForm } from "../hooks/useQuestionnaireForm";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import Navbar from "./Navbar";
// import QuestionnaireHeader from "./QuestionnaireHeader";
// import QuestionnaireFooter from "./QuestionnaireFooter";
// import QuestionRenderer from "./QuestionRenderer";
// import { useSanitizeInput, useCalculatedFields } from "../hooks/useQuestionnaireLogic";

// const StyledCard = styled(Card)(({ theme }) => ({
//   maxWidth: 800,
//   margin: theme.spacing(2, "auto"),
//   boxShadow: theme.shadows[3],
//   borderRadius: theme.spacing(2),
//   [theme.breakpoints.down("sm")]: {
//     margin: theme.spacing(1),
//     borderRadius: theme.spacing(1),
//   },
// }));

// const Questionnaire = ({ questionnaire }) => {
//   // State and Refs
//   const [currentPageIndex, setCurrentPageIndex] = React.useState(0);
//   const [submitError, setSubmitError] = React.useState(null);
//   const [showSuccess, setShowSuccess] = React.useState(false);
//   const containerRef = React.useRef(null);

//   // Custom hook for form management
//   const {
//     answers: formData,
//     errors: validationErrors,
//     isSubmitting,
//     isDirty,
//     setIsSubmitting,
//     setIsDirty,
//     handleAnswerChange,
//     handleDateTimeChange,
//     validateAnswers,
//     resetForm,
//     setStorageKey,
//   } = useQuestionnaireForm();

//   // Hooks
//   const { authFetch, currentUser } = useAuth();
//   const navigate = useNavigate();
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
//   // Set up storage key based on current user
//   useEffect(() => {
//     const newStorageKey = `questionnaire_${currentUser?.id || "temp"}`;
//     setStorageKey((prev) => (prev !== newStorageKey ? newStorageKey : prev));
//   }, [currentUser, setStorageKey]);

//   const sanitizeInput = useSanitizeInput();
//   const clearSavedData = useCallback(() => { resetForm(); }, [resetForm]);
//   const currentPage = questionnaire[currentPageIndex];
//   const isLastPage = currentPageIndex === questionnaire.length - 1;
//   useCalculatedFields(currentPage, formData, handleAnswerChange);

//   useEffect(() => {
//     const handleBeforeUnload = (e) => {
//       if (isDirty && !isSubmitting) {
//         e.preventDefault();
//         e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
//         return e.returnValue;
//       }
//     };
//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [isDirty, isSubmitting]);

//   const isPageComplete = useMemo(() => {
//     console.log('Checking page completion...');
//     const currentPageQuestions = currentPage.questions.filter((q) => {
//       if (!q.dependsOn) return true;
//       if (Array.isArray(q.dependsOn)) return true;
//       const dependsOnValue = formData[q.dependsOn.id];
//       console.log(`Checking dependency for ${q.id}:`, {
//         dependsOnField: q.dependsOn.id,
//         requiredValue: q.dependsOn.value,
//         actualValue: dependsOnValue
//       });
//       return dependsOnValue === q.dependsOn.value;
//     });

//     const allFieldsComplete = currentPageQuestions.every((question) => {
//       if (question.required === false) {
//         console.log(`${question.id} is not required, skipping`);
//         return true;
//       }

//       const value = formData[question.id];
//       console.log(`Checking field ${question.id}:`, {
//         type: question.type,
//         value: value,
//         isArray: Array.isArray(value)
//       });

//       // Check for empty values
//       if (value === undefined || value === null) {
//         console.log(`${question.id} is undefined/null`);
//         return false;
//       }

//       // Handle different types
//       switch (question.type) {
//         case 'date':
//           const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
//           console.log(`${question.id} date validation:`, isValidDate);
//           return isValidDate;
//         case 'time':
//           const isValidTime = /^\d{2}:\d{2}$/.test(value);
//           console.log(`${question.id} time validation:`, isValidTime);
//           return isValidTime;
//         case 'number':
//         case 'radio':
//           // Allow 0 as valid value
//           const isValid = value !== '';
//           console.log(`${question.id} number/radio validation:`, isValid);
//           return isValid;
//         default:
//           if (Array.isArray(value)) {
//             const hasValue = value.length > 0;
//             console.log(`${question.id} array validation:`, hasValue);
//             return hasValue;
//           }
//           const hasValue = value !== '';
//           console.log(`${question.id} default validation:`, hasValue);
//           return hasValue;
//       }
//     });

//     const validationResult = validateAnswers(currentPageQuestions);
//     console.log('Page validation summary:', {
//       allFieldsComplete,
//       validationResult,
//       isComplete: allFieldsComplete && validationResult
//     });

//     return allFieldsComplete && validationResult;
//   }, [currentPage, formData, validateAnswers]);

//   const handleInputChange = useCallback((questionId, value, type = "text") => {
//     const sanitizedValue = sanitizeInput(value, type);
//     handleAnswerChange(questionId, sanitizedValue);
//   }, [sanitizeInput, handleAnswerChange]);

//   const handleCheckboxChange = useCallback((questionId, option, isChecked) => {
//     const sanitizedOption = sanitizeInput(option);
//     const currentAnswers = formData[questionId] || [];
//     const newAnswers = isChecked ? [...currentAnswers, sanitizedOption] : currentAnswers.filter((a) => a !== sanitizedOption);
//     handleAnswerChange(questionId, newAnswers);
//   }, [sanitizeInput, handleAnswerChange, formData]);

//   const goToNextPage = useCallback(() => {
//     if (!isLastPage) {
//       const currentPageQuestions = currentPage.questions.filter((q) => {
//         if (!q.dependsOn) return true;
//         if (Array.isArray(q.dependsOn)) return true;
//         return formData[q.dependsOn.id] === q.dependsOn.value;
//       });
//       if (validateAnswers(currentPageQuestions)) {
//         setCurrentPageIndex((prev) => prev + 1);
//         containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//       }
//     }
//   }, [isLastPage, currentPage, formData, validateAnswers]);

//   const goToPreviousPage = useCallback(() => {
//     if (currentPageIndex > 0) {
//       setCurrentPageIndex((prev) => prev - 1);
//       containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//     }
//   }, [currentPageIndex]);

//   const handleFormSubmit = useCallback(async () => {
//     setIsSubmitting(true);
//     setSubmitError(null);
//     try {
//       const allQuestions = questionnaire.flatMap((page) => page.questions.filter((q) => {
//         if (!q.dependsOn) return true;
//         if (Array.isArray(q.dependsOn)) return true;
//         return formData[q.dependsOn.id] === q.dependsOn.value;
//       }));
//       if (!validateAnswers(allQuestions)) {
//         throw new Error("Please correct all validation errors before submitting.");
//       }
//       const sanitizedData = Object.keys(formData).reduce((acc, key) => {
//         const value = formData[key];
//         if (Array.isArray(value)) {
//           const otherKey = `${key}_other`;
//           const otherText = formData[otherKey];
//           if (value.includes("Others") && otherText) {
//             acc[key] = value.map((v) => v === "Others" ? `Others: ${sanitizeInput(otherText)}` : sanitizeInput(v));
//           } else {
//             acc[key] = value.map((v) => sanitizeInput(v));
//           }
//         } else {
//           if (!key.endsWith("_other")) {
//             acc[key] = sanitizeInput(value);
//           }
//         }
//         return acc;
//       }, {});
//       const response = await authFetch("/questionnaire/submit", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ responseData: sanitizedData }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         const errorMessage = errorData.message || `Server error: ${response.status}`;
//         throw new Error(errorMessage);
//       }
//       const result = await response.json();
//       clearSavedData();
//       setShowSuccess(true);
//       setTimeout(() => navigate("/home"), 2000);
//     } catch (err) {
//       setSubmitError(err.message || "Failed to submit");
//       setTimeout(() => {
//         const errorElement = document.querySelector('[data-testid="submit-error"]');
//         if (errorElement) errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
//       }, 100);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [questionnaire, formData, validateAnswers, authFetch, sanitizeInput, clearSavedData, navigate]);
//   // ...existing code...
//   return (
//     <>
//       <Navbar />
//       <Container ref={containerRef} maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
//         <StyledCard>
//           <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
//             <QuestionnaireHeader
//               title={currentPage.title}
//               page={currentPage.page}
//               totalPages={questionnaire.length}
//               isMobile={isMobile}
//             />
//             <Box sx={{ mt: 3 }}>
//               {currentPage.questions.map((question) => {
//                 if (question.dependsOn && !Array.isArray(question.dependsOn)) {
//                   const depId = question.dependsOn.id;
//                   const requiredVal = question.dependsOn.value;
//                   if (formData[depId] !== requiredVal) return null;
//                 }
//                 return (
//                   <QuestionRenderer
//                     key={question.id}
//                     question={question}
//                     value={formData[question.id] ?? ""}
//                     validationError={validationErrors[question.id]}
//                     isMobile={isMobile}
//                     handleInputChange={handleInputChange}
//                     handleCheckboxChange={handleCheckboxChange}
//                     formData={formData}
//                   />
//                 );
//               })}
//             </Box>
//             <QuestionnaireFooter
//               currentPageIndex={currentPageIndex}
//               isLastPage={isLastPage}
//               isPageComplete={isPageComplete}
//               isSubmitting={isSubmitting}
//               submitError={submitError}
//               goToPreviousPage={goToPreviousPage}
//               goToNextPage={goToNextPage}
//               handleFormSubmit={handleFormSubmit}
//               isMobile={isMobile}
//               setSubmitError={setSubmitError}
//             />
//           </CardContent>
//         </StyledCard>
//         <Snackbar
//           open={showSuccess}
//           autoHideDuration={6000}
//           onClose={() => setShowSuccess(false)}
//           anchorOrigin={{ vertical: "top", horizontal: "center" }}
//         >
//           <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: "100%" }}>
//             ✅ Questionnaire submitted successfully! Redirecting to home page...
//           </Alert>
//         </Snackbar>
//       </Container>
//     </>
//   );

// }
// export default Questionnaire;
