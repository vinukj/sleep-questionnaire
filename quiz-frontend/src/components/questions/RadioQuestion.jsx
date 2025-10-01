import React from 'react';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import DOMPurify from 'dompurify';

const RadioQuestion = ({ question, value, onChange, error }) => {
  return (
    <FormControl component="fieldset" error={error} sx={{ width: '100%', marginBottom: 2 }}>
      <FormLabel 
        component="legend"
        sx={{ 
          fontSize: '1rem',
          fontWeight: 500,
          color: 'text.primary',
          mb: 1
        }}
      >
        {question.text}
      </FormLabel>
      <RadioGroup
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {question.options.map((option, index) => (
          <FormControlLabel
            key={index}
            value={option.value.toString()}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

export default RadioQuestion;