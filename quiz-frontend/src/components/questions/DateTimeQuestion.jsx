import React from 'react';
import { Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

// const DateTimeQuestion = ({ question, dateValue, timeValue, onDateChange, onTimeChange, error }) => {
//   return (
//     <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
//       {question.dateLabel && (
//         <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
//           {/* <DatePicker
//             label={question.dateLabel}
//             value={dateValue ? dayjs(dateValue) : null}
//             onChange={onDateChange}
//             slotProps={{
//               textField: {
//                 fullWidth: true,
//                 error: error
//               }
//             }}
//           /> */}
//         </Box>
//       )}
//       {question.timeLabel && (
//         <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
//          <TimePicker
//   label={question.timeLabel}
//   value={timeValue ? dayjs(timeValue, "HH:mm") : null}
//   onChange={(newValue) => {
//     // Save just "HH:mm" into your form state
//     onTimeChange(newValue ? newValue.format("HH:mm") : "");
//   }}
//   slotProps={{
//     textField: {
//       fullWidth: true,
//       error: error
//     }
//   }}
//   views={['hours', 'minutes']}
//   format="HH:mm"
// />
//         </Box>
//       )}
//     </Box>
//   );
// };

const DateTimeQuestion = ({ question, dateValue, timeValue, onDateChange, onTimeChange, error }) => {
  const parseTimeValue = (value) => {
    if (!value) return null;
    const parsed = dayjs(value, "HH:mm");
    return parsed.isValid() ? parsed : null;
  };

  const parseDateValue = (value) => {
    if (!value) return null;
    const parsed = dayjs(value, "YYYY-MM-DD");
    return parsed.isValid() ? parsed : null;
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {question.dateLabel && (
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
          <DatePicker
            label={question.dateLabel}
            value={parseDateValue(dateValue)}
            onChange={onDateChange}
            format="YYYY-MM-DD"
            slotProps={{
              textField: {
                fullWidth: true,
                error: error
              }
            }}
          />
        </Box>
      )}
      {question.timeLabel && (
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
          <TimePicker
            label={question.timeLabel}
            value={parseTimeValue(timeValue)}
            onChange={onTimeChange}
            views={['hours', 'minutes']}
            format="hh:mm A"
            ampm={true}
            slotProps={{
              textField: {
                fullWidth: true,
                error: error
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};


export default DateTimeQuestion;