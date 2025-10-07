import React from "react";
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
} from "@mui/material";

const QuestionBox = ({ children }) => <Box sx={{ mb: 3 }}>{children}</Box>;

const QuestionRenderer = ({ question, value, onChange, setValue, error }) => {
  const { id, type, label, options, otherOption } = question;
  const helper = error?.message || "";

  switch (type) {
    case "text":
    case "email":
    case "tel":
    case "number":
      return (
        <QuestionBox>
          <TextField
            fullWidth
            type={type}
            label={label}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => e.target.blur()}
            // Treat certain computed fields as read-only
            InputProps={{ readOnly: id === "bmi" || id === "waist_hip_ratio" }}
            error={!!error}
            helperText={helper}
          />
        </QuestionBox>
      );

    case "textarea":
      return (
        <QuestionBox>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={label}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => e.target.blur()}
            error={!!error}
            helperText={helper}
          />
        </QuestionBox>
      );

    case "radio":
      return (
        <QuestionBox>
          <FormControl error={!!error}>
            <FormLabel>{label}</FormLabel>
            <RadioGroup
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
            >
              {options?.map((opt) => (
                <FormControlLabel
                  key={opt}
                  value={opt}
                  control={<Radio />}
                  label={opt}
                />
              ))}
            </RadioGroup>
            {!!error && <FormHelperText>{helper}</FormHelperText>}
          </FormControl>
        </QuestionBox>
      );

    case "checkbox": {
      const currentAnswers = value || [];
      const otherOpt = question.otherOption?.option;
      const regularOptions = options?.filter((opt) => opt !== otherOpt) || [];

      const handleCheckbox = (opt, checked) => {
        let updated = [...currentAnswers];

        if (checked) {
          if (!updated.includes(opt) && opt !== otherOpt) updated.push(opt);

          if (opt === otherOpt && !updated.some((v) => v.startsWith("Other:"))) {
            updated.push(otherOpt);
            updated.push("Other: ");
          }
        } else {
          updated = updated.filter(
            (v) => v !== opt && !(opt === otherOpt && v.startsWith("Other:"))
          );
        }

        onChange(updated);
      };

      const otherEntry = currentAnswers.find((v) => v.startsWith("Other:"));
      const otherValue = otherEntry ? otherEntry.replace("Other: ", "") : "";
      const otherChecked = otherOpt && currentAnswers.includes(otherOpt);

      return (
        <QuestionBox>
          <FormControl fullWidth error={!!error}>
            <FormLabel>
              {label} {question.required === false ? "(Optional)" : ""}
            </FormLabel>
            <FormGroup>
              {regularOptions.map((opt) => (
                <FormControlLabel
                  key={opt}
                  control={
                    <Checkbox
                      checked={currentAnswers.includes(opt)}
                      onChange={(e) => handleCheckbox(opt, e.target.checked)}
                    />
                  }
                  label={opt}
                />
              ))}

              {otherOpt && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={otherChecked}
                      onChange={(e) => handleCheckbox(otherOpt, e.target.checked)}
                    />
                  }
                  label={otherOpt}
                />
              )}
            </FormGroup>

            {otherOpt && otherChecked && (
              <TextField
                fullWidth
                label="Please specify"
                value={otherValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const filtered = currentAnswers.filter((v) => !v.startsWith("Other:"));
                  onChange([...filtered, `Other: ${newValue}`]);
                }}
                sx={{ mt: 1 }}
                placeholder="Type your answer here"
                autoFocus
              />
            )}

            {!!error && <FormHelperText>{helper}</FormHelperText>}
          </FormControl>
        </QuestionBox>
      );
    }

    case "date":
    case "time":
      return (
        <QuestionBox>
          <TextField
            fullWidth
            type={type}
            label={label}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={!!error}
            helperText={helper}
          />
        </QuestionBox>
      );

    case "dropdown":
      return (
        <QuestionBox>
          <FormControl fullWidth error={!!error}>
            <FormLabel>{label}</FormLabel>
            <Select value={value || ""} onChange={(e) => onChange(e.target.value)}>
              <MenuItem value="" disabled>
                Select an option
              </MenuItem>
              {options?.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
            {!!error && <FormHelperText>{helper}</FormHelperText>}
          </FormControl>
        </QuestionBox>
      );

    default:
      return (
        <QuestionBox>
          <Typography color="error">Unsupported question type: {type}</Typography>
        </QuestionBox>
      );
  }
};

export default QuestionRenderer;
