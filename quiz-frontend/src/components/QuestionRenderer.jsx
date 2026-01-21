// QuestionRenderer.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  Typography,
  FormHelperText,
  IconButton,
  Button,
  ButtonGroup,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import logger from "../utils/logger";
import class1Image from "../assets/malampatti/class1.jpg";
import class2Image from "../assets/malampatti/class2.jpg";
import class3Image from "../assets/malampatti/class3.jpg";
import class4Image from "../assets/malampatti/class4.jpg";

const QuestionBox = ({ children }) => <Box sx={{ mb: 2, width: '100%' }}>{children}</Box>;

const QuestionContainer = styled(Box)(({ theme }) => ({
  minHeight: "64px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1rem 1.5rem",
  backgroundColor: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  gap: "1rem",
  width: "100%",
  boxSizing: "border-box",
  [theme.breakpoints.down('sm')]: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "0.875rem 1rem",
    gap: "0.75rem",
  },
}));

const QuestionLabel = styled(FormLabel)(({ theme }) => ({
  fontSize: "0.938rem",
  fontWeight: 400,
  color: "#1F2937",
  marginBottom: 0,
  flex: "1 1 auto",
  minWidth: 0,
  lineHeight: "1.4",
  maxWidth: "70%",
  [theme.breakpoints.down('sm')]: {
    fontSize: "0.875rem",
    width: "100%",
    maxWidth: "100%",
    wordWrap: "break-word",
    overflowWrap: "break-word",
  },
}));

// Individual Button Group for Radio Options
const RadioButtonGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "0.5rem",
  justifyContent: "flex-end",
  alignItems: "center",
  flexWrap: "nowrap",
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    justifyContent: "stretch",
    gap: "0.375rem",
    width: "100%",
    flexWrap: "wrap",
  },
}));

const RadioButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isActive",
})(({ isActive, theme }) => ({
  padding: "0.5rem 1.5rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  border: `2px solid ${isActive ? "#3B82F6" : "#E5E7EB"}`,
  borderRadius: "8px",
  textTransform: "none",
  minWidth: "80px",
  height: "auto",
  minHeight: "38px",
  backgroundColor: isActive ? "#3B82F6" : "#fff",
  color: isActive ? "#fff" : "#374151",
  whiteSpace: "normal",
  wordBreak: "break-word",
  lineHeight: 1.3,
  textAlign: "center",
  "&:hover": {
    backgroundColor: isActive ? "#2563EB" : "#F9FAFB",
    borderColor: isActive ? "#2563EB" : "#D1D5DB",
  },
  [theme.breakpoints.down('sm')]: {
    flex: 1,
    minWidth: "0",
    padding: "0.5rem 0.75rem",
    fontSize: "0.813rem",
    minHeight: "36px",
  },
}));

// Number Stepper
const NumberStepperContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  border: "1px solid #E5E7EB",
  borderRadius: "6px",
  overflow: "hidden",
  backgroundColor: "#fff",
  height: "38px",
});

const StepperButton = styled(IconButton)({
  width: "38px",
  height: "38px",
  borderRadius: 0,
  fontSize: "1.125rem",
  color: "#6B7280",
  "&:hover": {
    backgroundColor: "#F3F4F6",
  },
});

const StepperInput = styled("input")({
  width: "60px",
  textAlign: "center",
  border: "none",
  outline: "none",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#1F2937",
  "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "&[type=number]": {
    MozAppearance: "textfield",
  },
});

// Card Selection Button
const CardSelectionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})(({ isSelected, theme }) => ({
  padding: "0.5rem",
  fontSize: "0.813rem",
  minHeight: "38px",
  fontWeight: 600,
  position: "relative",
  backgroundColor: isSelected ? "#EFF6FF" : "#fff",
  border: `2px solid ${isSelected ? "#3B82F6" : "#E5E7EB"}`,
  color: isSelected ? "#3B82F6" : "#374151",
  borderRadius: "6px",
  textTransform: "none",
  lineHeight: 1.3,
  textAlign: "center",
  width: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  wordBreak: "break-word",
  height: "auto",
  "&:hover": {
    backgroundColor: isSelected ? "#DBEAFE" : "#F9FAFB",
    borderColor: isSelected ? "#2563EB" : "#D1D5DB",
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: "0.75rem",
    padding: "0.5rem 0.375rem",
    minHeight: "36px",
  },
}));

// Checkmark Icon
const CheckIcon = styled(Box)({
  position: "absolute",
  top: "4px",
  right: "4px",
  width: "14px",
  height: "14px",
});

// Pill Button
const PillButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})(({ isSelected, theme }) => ({
  padding: "0.5rem 1rem",
  fontSize: "0.813rem",
  fontWeight: 500,
  border: `2px solid ${isSelected ? "#3B82F6" : "#E5E7EB"}`,
  backgroundColor: isSelected ? "#3B82F6" : "transparent",
  color: isSelected ? "#fff" : "#6B7280",
  borderRadius: "9999px",
  textTransform: "none",
  minWidth: "auto",
  maxWidth: "100%",
  whiteSpace: "normal",
  wordBreak: "break-word",
  lineHeight: 1.3,
  height: "auto",
  minHeight: "38px",
  boxSizing: "border-box",
  "&:hover": {
    backgroundColor: isSelected ? "#2563EB" : "#F3F4F6",
    borderColor: isSelected ? "#2563EB" : "#D1D5DB",
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: "0.75rem",
    padding: "0.5rem 0.75rem",
    minHeight: "36px",
  },
}));

// Range Slider Container
const SliderContainer = styled(Box)({
  paddingTop: "0.25rem",
});

const StyledSlider = styled("input")({
  width: "100%",
  height: "6px",
  borderRadius: "3px",
  background: "linear-gradient(to right, #3B82F6 0%, #3B82F6 50%, #E5E7EB 50%, #E5E7EB 100%)",
  outline: "none",
  WebkitAppearance: "none",
  appearance: "none",
  "&::-webkit-slider-thumb": {
    WebkitAppearance: "none",
    appearance: "none",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#3B82F6",
    cursor: "pointer",
    border: "2px solid #fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  "&::-moz-range-thumb": {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#3B82F6",
    cursor: "pointer",
    border: "2px solid #fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
});

const SliderLabels = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  marginTop: "0.25rem",
  fontSize: "0.75rem",
  color: "#9CA3AF",
});

// Time Input with Icon
const TimeInputContainer = styled(Box)({
  height: "38px",
  padding: "0.5rem 0.75rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  border: "2px solid #E5E7EB",
  borderRadius: "6px",
  background: "#ffffff",
  cursor: "pointer",
  "&:hover": {
    borderColor: "#D1D5DB",
  },
  "&:focus-within": {
    borderColor: "#3B82F6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
  },
});

// Large Multi-Select Card Button
const MultiSelectCard = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})(({ isSelected, theme }) => ({
  padding: "0.875rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  minHeight: "56px",
  justifyContent: "flex-start",
  textAlign: "left",
  position: "relative",
  backgroundColor: isSelected ? "#3B82F6" : "#fff",
  border: `2px solid ${isSelected ? "#3B82F6" : "#E5E7EB"}`,
  color: isSelected ? "#fff" : "#1F2937",
  borderRadius: "8px",
  textTransform: "none",
  transition: "all 0.2s ease",
  wordBreak: "break-word",
  whiteSpace: "normal",
  lineHeight: "1.4",
  "&:hover": {
    backgroundColor: isSelected ? "#2563EB" : "#F9FAFB",
    borderColor: isSelected ? "#2563EB" : "#D1D5DB",
  },
  [theme.breakpoints.up("sm")]: {
    padding: "1rem 1.5rem",
    fontSize: "0.938rem",
    minHeight: "60px",
  },
}));

// Toggle Switch Container
const ToggleSwitchContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.5rem 0",
});

const ToggleSwitch = styled(Box, {
  shouldForwardProp: (prop) => prop !== "checked",
})(({ checked }) => ({
  width: "48px",
  height: "28px",
  backgroundColor: checked ? "#3B82F6" : "#E5E7EB",
  borderRadius: "14px",
  position: "relative",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: checked ? "#2563EB" : "#D1D5DB",
  },
}));

const ToggleKnob = styled(Box, {
  shouldForwardProp: (prop) => prop !== "checked",
})(({ checked }) => ({
  width: "24px",
  height: "24px",
  backgroundColor: "#fff",
  borderRadius: "50%",
  position: "absolute",
  top: "2px",
  left: checked ? "22px" : "2px",
  transition: "left 0.2s ease",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
}));

// Multi-Select Pill with Remove Button
const SelectablePill = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})(({ isSelected }) => ({
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  border: `2px solid ${isSelected ? "#3B82F6" : "#E5E7EB"}`,
  backgroundColor: isSelected ? "#3B82F6" : "transparent",
  color: isSelected ? "#fff" : "#6B7280",
  borderRadius: "9999px",
  textTransform: "none",
  minWidth: "auto",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  "&:hover": {
    backgroundColor: isSelected ? "#2563EB" : "#F3F4F6",
    borderColor: isSelected ? "#2563EB" : "#D1D5DB",
  },
}));

// Mallampati Grade Card
const MallampatiCard = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})(({ isSelected, theme }) => ({
  padding: "1rem",
  minHeight: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "0.75rem",
  position: "relative",
  backgroundColor: "#fff",
  border: `2px solid ${isSelected ? "#3B82F6" : "#E5E7EB"}`,
  borderRadius: "12px",
  textTransform: "none",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#F9FAFB",
    borderColor: isSelected ? "#2563EB" : "#D1D5DB",
  },
  [theme.breakpoints.down("sm")]: {
    padding: "0.75rem",
    gap: "0.5rem",
  },
}));

const MallampatiImage = styled("img")(({ theme }) => ({
  width: "100%",
  height: "auto",
  borderRadius: "8px",
  objectFit: "cover",
  aspectRatio: "1 / 1",
}));

const MallampatiCheckmark = styled(Box)(() => ({
  position: "absolute",
  top: "8px",
  right: "8px",
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  backgroundColor: "#3B82F6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
}));

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    fontSize: "0.875rem",
    "& fieldset": {
      borderColor: "#E5E7EB",
    },
    "&:hover fieldset": {
      borderColor: "#D1D5DB",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#3B82F6",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.813rem",
    fontWeight: 500,
    color: "#374151",
  },
});

const QuestionRenderer = ({ question, value, onChange, setValue, error }) => {
  const { id, type, label, options, otherOption, required } = question;
  const helperText = error?.message || "";

  // Log the value being rendered for debugging
  useEffect(() => {
    logger.debug(`Rendering question ${id} with value:`, value);
  }, [id, value]);

  // Number stepper handlers
  const handleIncrement = () => {
    const currentValue = parseInt(value) || 0;
    onChange((currentValue + 1).toString());
  };

  const handleDecrement = () => {
    const currentValue = parseInt(value) || 0;
    if (currentValue > 0) {
      onChange((currentValue - 1).toString());
    }
  };

  // Checkbox handler for regular + "Other" option
  const renderCheckboxes = () => {
    const currentAnswers = value || [];
    const otherOpt = otherOption?.option;
    const regularOptions = options?.filter((opt) => {
      const optValue = typeof opt === 'object' ? opt.value : opt;
      return optValue !== otherOpt;
    }) || [];

    const handleCheckboxChange = (optValue, checked) => {
      let updated = [...currentAnswers];

      if (checked) {
        if (!updated.includes(optValue) && optValue !== otherOpt) updated.push(optValue);

        if (optValue === otherOpt && !updated.some((v) => v.startsWith("Other:"))) {
          updated.push(otherOpt);
          updated.push("Other: ");
        }
      } else {
        updated = updated.filter(
          (v) => v !== optValue && !(optValue === otherOpt && v.startsWith("Other:"))
        );
      }
      onChange(updated);
    };

    

    // Use multi-select card UI for optional comorbidity questions and recommended_workup
    const isComorbidityOptional = id === "neurological_disorder" || id === "respiratory_disorder";
    const isRecommendedWorkup = id === "recommended_workup";
    
    // Use pill button UI for medications
    const isMedications = id === "medications";

    if (isComorbidityOptional) {
      return (
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" }, fontWeight: 500, color: "#374151", mb: 1.5 }}>
            {label} {required === false ? "(Optional)" : ""}
          </FormLabel>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: { xs: "0.625rem", sm: "0.75rem" },
            }}
          >
            {regularOptions.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const isSelected = currentAnswers.includes(optValue);
              return (
                <MultiSelectCard
                  key={optValue}
                  isSelected={isSelected}
                  onClick={() => handleCheckboxChange(optValue, !isSelected)}
                >
                  {optLabel}
                  {isSelected && (
                    <CheckIcon
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#fff",
                      }}
                    />
                  )}
                </MultiSelectCard>
              );
            })}
          </Box>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    if (isMedications) {
      return (
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" }, fontWeight: 500, color: "#374151", mb: 1.5 }}>
            {label} {required === false ? "(Optional)" : ""}
          </FormLabel>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: "0.5rem", sm: "0.625rem" },
            }}
          >
            {regularOptions.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const isSelected = currentAnswers.includes(optValue);
              return (
                <SelectablePill
                  key={optValue}
                  isSelected={isSelected}
                  onClick={() => handleCheckboxChange(optValue, !isSelected)}
                >
                  {optLabel}
                  {isSelected && (
                    <span style={{ fontSize: "1rem", marginLeft: "0.25rem" }}>×</span>
                  )}
                </SelectablePill>
              );
            })}
            {otherOpt && (
              <SelectablePill
                isSelected={otherChecked}
                onClick={() => handleCheckboxChange(otherOpt, !otherChecked)}
              >
                {otherOpt}
                {otherChecked && (
                  <span style={{ fontSize: "1rem", marginLeft: "0.25rem" }}>×</span>
                )}
              </SelectablePill>
            )}
          </Box>

          {otherOpt && otherChecked && (
            <StyledTextField
              fullWidth
              label="Please specify"
              value={question.otherOption?.id || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                setValue(question.otherOption.id, newValue);
              }}
              sx={{ mt: 1.5 }}
              placeholder="Type..."
              size="small"
            />
          )}

          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    if (isRecommendedWorkup) {
      return (
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" }, fontWeight: 500, color: "#374151", mb: 1.5 }}>
            {label} {required === false ? "(Optional)" : ""}
          </FormLabel>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: { xs: "0.625rem", sm: "0.75rem" },
            }}
          >
            {regularOptions.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const isSelected = currentAnswers.includes(optValue);
              return (
                <MultiSelectCard
                  key={optValue}
                  isSelected={isSelected}
                  onClick={() => handleCheckboxChange(optValue, !isSelected)}
                >
                  {optLabel}
                  {isSelected && (
                    <CheckIcon
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#fff",
                      }}
                    />
                  )}
                </MultiSelectCard>
              );
            })}
          </Box>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    // Default checkbox rendering for other questions
    const otherChecked = otherOpt && currentAnswers.includes(otherOpt);

    return (
      <FormControl fullWidth error={!!error}>
        <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151", mb: 1 }}>
          {label} {required === false ? "(Optional)" : ""}
        </FormLabel>
        <FormGroup>
          {regularOptions.map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <FormControlLabel
                key={optValue}
                control={
                  <Checkbox
                    checked={currentAnswers.includes(optValue)}
                    onChange={(e) => handleCheckboxChange(optValue, e.target.checked)}
                  sx={{
                    color: "#9CA3AF",
                    "&.Mui-checked": { color: "#3B82F6" },
                  }}
                />
              }
              label={<Typography sx={{ fontSize: "0.875rem" }}>{optLabel}</Typography>}
            />
          );
          })}
          {otherOpt && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={otherChecked}
                  onChange={(e) =>
                    handleCheckboxChange(otherOpt, e.target.checked)
                  }
                  sx={{
                    color: "#9CA3AF",
                    "&.Mui-checked": { color: "#3B82F6" },
                  }}
                />
              }
              label={<Typography sx={{ fontSize: "0.875rem" }}>{otherOpt}</Typography>}
            />
          )}
        </FormGroup>

        {otherOpt && otherChecked && (
          <StyledTextField
            fullWidth
            label="Please specify"
            value={question.otherOption.id || ""}
            onChange={(e) => {
              const newValue = e.target.value.split("Other: ")[1] || "";
              setValue(question.otherOption.id, newValue);
              onChange(newValue);
            }}
            sx={{ mt: 1 }}
            placeholder="Type..."
            size="small"
          />
        )}

        {!!error && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  };

  // Render radio as segmented control if options <= 2, cards for 3 options, pills for 4 options
  const renderRadio = () => {
    const shouldUseSegmented = options && options.length <= 2;
    const shouldUseCards = options && options.length === 3;
    const shouldUsePills = options && options.length === 4;

    // Special rendering for Mallampati Grade
    if (id === "mallampati") {
      const mallampatiImages = {
        "1": class1Image,
        "2": class2Image,
        "3": class3Image,
        "4": class4Image,
      };

      const mallampatiLabels = {
        "1": "Class I",
        "2": "Class II",
        "3": "Class III",
        "4": "Class IV",
      };

      return (
        <FormControl fullWidth error={!!error}>
          <Box sx={{ 
            padding: "1rem", 
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", 
            borderRadius: "0.5rem",
            mb: 1.5 
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem", mb: 1.5 }}>
              <Typography sx={{ fontSize: "1.25rem" }}>👄</Typography>
              <FormLabel sx={{ fontSize: "0.938rem", fontWeight: 600, color: "#1F2937", mb: 0 }}>
                {label}
              </FormLabel>
            </Box>
            <Box sx={{ 
              display: "grid", 
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
              gap: { xs: "0.75rem", sm: "1rem" },
            }}>
              {options.map((opt) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const isSelected = value === optValue;
                const classLabel = mallampatiLabels[optValue] || `Class ${optLabel}`;
                const imageSrc = mallampatiImages[optValue];
                
                return (
                  <MallampatiCard
                    key={optValue}
                    isSelected={isSelected}
                    onClick={() => onChange(optValue)}
                  >
                    {isSelected && (
                      <MallampatiCheckmark>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </MallampatiCheckmark>
                    )}
                    {imageSrc && (
                      <MallampatiImage src={imageSrc} alt={classLabel} />
                    )}
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, textAlign: "center", color: "#6B7280" }}>
                      {classLabel}
                    </Typography>
                  </MallampatiCard>
                );
              })}
            </Box>
          </Box>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    // Use toggle switch for surgery_sleep_apnea question
    if (id === "surgery_sleep_apnea") {
      const isYes = value === "Yes";
      return (
        <FormControl fullWidth error={!!error}>
          <ToggleSwitchContainer>
            <FormLabel sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151", flex: 1 }}>
              {label}
            </FormLabel>
            <ToggleSwitch
              checked={isYes}
              onClick={() => onChange(isYes ? "No" : "Yes")}
            >
              <ToggleKnob checked={isYes} />
            </ToggleSwitch>
          </ToggleSwitchContainer>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    if (shouldUseSegmented) {
      return (
        <FormControl fullWidth error={!!error}>
          <QuestionContainer>
            <QuestionLabel>
              {label}
            </QuestionLabel>
            <RadioButtonGroup>
              {options.map((opt) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return (
                  <RadioButton
                    key={optValue}
                    isActive={value === optValue}
                    onClick={() => onChange(optValue)}
                  >
                    {optLabel}
                  </RadioButton>
                );
              })}
            </RadioButtonGroup>
          </QuestionContainer>
          {!!error && <FormHelperText sx={{ ml: 1.5 }}>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    if (shouldUseCards) {
      return (
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151", mb: 1 }}>
            {label}
          </FormLabel>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
            {options.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <CardSelectionButton
                  key={optValue}
                  isSelected={value === optValue}
                  onClick={() => onChange(optValue)}
                >
                  {optLabel}
                  {value === optValue && (
                    <CheckIcon>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </CheckIcon>
                  )}
                </CardSelectionButton>
              );
            })}
          </Box>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    if (shouldUsePills) {
      return (
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151", mb: 1 }}>
            {label}
          </FormLabel>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
            {options.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <PillButton
                  key={optValue}
                  isSelected={value === optValue}
                  onClick={() => onChange(optValue)}
                >
                  {optLabel}
                </PillButton>
              );
            })}
          </Box>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    // Default radio buttons for more than 4 options
    return (
      <FormControl error={!!error}>
        <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151" }}>
          {label}
        </FormLabel>
        <RadioGroup
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          sx={{ mt: 1 }}
        >
          {options?.map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <FormControlLabel
                key={optValue}
                value={optValue}
                control={
                  <Radio
                    sx={{
                      color: "#9CA3AF",
                      "&.Mui-checked": { color: "#3B82F6" },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: "0.875rem" }}>{optLabel}</Typography>}
              />
            );
          })}
        </RadioGroup>
        {!!error && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  };

  // Special handling for age field - use number stepper
  if (id === "age" && type === "number") {
    return (
      <QuestionBox>
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151", mb: 1 }}>
            {label}
          </FormLabel>
          <NumberStepperContainer>
            <StepperButton onClick={handleDecrement} size="small">
              −
            </StepperButton>
            <StepperInput
              type="number"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              min="1"
              max="120"
            />
            <StepperButton onClick={handleIncrement} size="small">
              +
            </StepperButton>
          </NumberStepperContainer>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      </QuestionBox>
    );
  }

  // Special handling for time input
  if (type === "time") {
    return (
      <QuestionBox>
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151", mb: 1 }}>
            {label}
          </FormLabel>
          <TimeInputContainer>
            <svg style={{ width: "16px", height: "16px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <input
              type="time"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "0.875rem",
                color: "#1F2937",
                background: "transparent",
                flex: 1,
              }}
            />
          </TimeInputContainer>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      </QuestionBox>
    );
  }

  // Special handling for range slider (for sleep hours, etc.)
  if (id === "avg_sleep_hours" && type === "number") {
    const [sliderValue, setSliderValue] = useState(value || "7.5");
    
    return (
      <QuestionBox>
        <FormControl fullWidth error={!!error}>
          <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151", mb: 1 }}>
            Average sleep hours: <span style={{ fontWeight: 700, color: "#3B82F6" }}>{sliderValue}</span>h
          </FormLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={sliderValue}
              onChange={(e) => {
                setSliderValue(e.target.value);
                onChange(e.target.value);
              }}
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((sliderValue - 3) / (12 - 3)) * 100}%, #E5E7EB ${((sliderValue - 3) / (12 - 3)) * 100}%, #E5E7EB 100%)`,
              }}
            />
            <SliderLabels>
              <span>3h</span>
              <span>12h</span>
            </SliderLabels>
          </SliderContainer>
          {!!error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      </QuestionBox>
    );
  }

  switch (type) {
    case "text":
    case "email":
    case "tel":
    case "number":
    case "date":
      return (
        <QuestionBox>
          <StyledTextField
            fullWidth
            type={type}
            label={label}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => e.target.blur()}
            InputLabelProps={
              type === "date" ? { shrink: true } : undefined
            }
            InputProps={{ readOnly: id === "bmi" || id === "waist_hip_ratio" }}
            error={!!error}
            helperText={helperText}
            size="small"
          />
        </QuestionBox>
      );

    case "textarea":
      return (
        <QuestionBox>
          <StyledTextField
            fullWidth
            multiline
            rows={4}
            label={label}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => e.target.blur()}
            error={!!error}
            helperText={helperText}
          />
        </QuestionBox>
      );

    case "radio":
      return <QuestionBox>{renderRadio()}</QuestionBox>;

    case "checkbox":
      return <QuestionBox>{renderCheckboxes()}</QuestionBox>;

    case "dropdown":
      return (
        <QuestionBox>
          <FormControl fullWidth error={!!error}>
            <FormLabel sx={{ fontSize: "0.813rem", fontWeight: 500, color: "#374151", mb: 1 }}>
              {label}
            </FormLabel>
            <Select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              size="small"
              sx={{
                borderRadius: "6px",
                fontSize: "0.875rem",
                "& fieldset": {
                  borderColor: "#E5E7EB",
                },
              }}
            >
              <MenuItem value="" disabled>
                Select an option
              </MenuItem>
              {options?.map((opt) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return (
                  <MenuItem key={optValue} value={optValue} sx={{ fontSize: "0.875rem" }}>
                    {optLabel}
                  </MenuItem>
                );
              })}
            </Select>
            {!!error && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        </QuestionBox>
      );

    default:
      return (
        <QuestionBox>
          <Typography color="error">
            Unsupported question type: {type}
          </Typography>
        </QuestionBox>
      );
  }
};

export default QuestionRenderer;
