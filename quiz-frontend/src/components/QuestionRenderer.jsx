// QuestionRenderer.jsx
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
  const { id, type, label, options, otherOption, required } = question;
  const helperText = error?.message || "";

  // Checkbox handler for regular + "Other" option
  const renderCheckboxes = () => {
    const currentAnswers = value || [];
    const otherOpt = otherOption?.option;
    const regularOptions = options?.filter((opt) => opt !== otherOpt) || [];

    const handleCheckboxChange = (opt, checked) => {
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
      <FormControl fullWidth error={!!error}>
        <FormLabel>
          {label} {required === false ? "(Optional)" : ""}
        </FormLabel>
        <FormGroup>
          {regularOptions.map((opt) => (
            <FormControlLabel
              key={opt}
              control={
                <Checkbox
                  checked={currentAnswers.includes(opt)}
                  onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
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
                  onChange={(e) =>
                    handleCheckboxChange(otherOpt, e.target.checked)
                  }
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
            value={ question.otherOption.id|| ""} // Use the current value from the parent state
            onChange={(e) => {
              const newValue = e.target.value.split("Other: ")[1] || "";
              setValue(question.otherOption.id, newValue); // Update the parent state
              onChange(newValue); // Notify parent of the change
            }}
            sx={{ mt: 1 }}
            placeholder="Type...  "
          />
        )}

        {!!error && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  };

  switch (type) {
    case "text":
    case "email":
    case "tel":
    case "number":
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
            onWheel={(e) => e.target.blur()}
            InputLabelProps={
              type === "date" || type === "time" ? { shrink: true } : undefined
            }
            InputProps={{ readOnly: id === "bmi" || id === "waist_hip_ratio" }}
            error={!!error}
            helperText={helperText}
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
            helperText={helperText}
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
            {!!error && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        </QuestionBox>
      );

    case "checkbox":
      return <QuestionBox>{renderCheckboxes()}</QuestionBox>;

    case "dropdown":
      return (
        <QuestionBox>
          <FormControl fullWidth error={!!error}>
            <FormLabel>{label}</FormLabel>
            <Select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
            >
              <MenuItem value="" disabled>
                Select an option
              </MenuItem>
              {options?.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
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
