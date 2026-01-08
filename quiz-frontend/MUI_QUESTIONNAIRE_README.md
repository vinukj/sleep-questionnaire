# MUI Questionnaire Implementation

## Overview

The `Questionnaire.jsx` component has been completely modernized using Material-UI (MUI) with a mobile-first, responsive design approach.

## Key Features

### 🎨 **Modern Design**
- Clean, professional Material Design interface
- Consistent spacing and typography
- Rounded corners and subtle shadows
- Modern color scheme with primary blue theme

### 📱 **Mobile-First & Responsive**
- Optimized for mobile devices first
- Responsive breakpoints for all screen sizes
- Touch-friendly button sizes
- Adaptive layout for different screen orientations

### 🧭 **Enhanced Navigation**
- Progress bar showing completion percentage
- Page indicator chip showing current/total pages
- Back button for easy navigation between pages
- Next/Submit buttons with proper validation

### 🎯 **User Experience**
- Form validation with disabled states
- Character counters for text areas
- Proper focus states and accessibility
- Smooth transitions and hover effects

## Component Structure

```jsx
<Container maxWidth="md">
  <StyledCard>
    <CardContent>
      {/* Progress Section */}
      <ProgressContainer>
        <Typography variant="h5">{page.title}</Typography>
        <Chip label="Page X/Y" />
        <LinearProgress value={progress} />
      </ProgressContainer>
      
      {/* Questions Section */}
      <Box>
        {questions.map(renderQuestion)}
      </Box>
      
      {/* Navigation Footer */}
      <FooterContainer>
        <Button variant="outlined">← Back</Button>
        <Button variant="contained">Next →</Button>
      </FooterContainer>
    </CardContent>
  </StyledCard>
</Container>
```

## Question Types Supported

All question types from your `STJOHNQuestions.js` are fully supported:

### Input Fields
- **Text**: `TextField` with full width
- **Number**: `TextField` with number validation
- **Email**: `TextField` with email validation  
- **Tel**: `TextField` for phone numbers
- **Time/Date**: `TextField` with date/time pickers

### Selection Fields
- **Radio**: `RadioGroup` with `FormControlLabel`
- **Checkbox**: `FormGroup` with `Checkbox` components
- **Dropdown**: `Select` with `MenuItem` options

### Text Areas
- **Textarea**: `TextField` multiline with character counter

## Responsive Breakpoints

```javascript
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// Breakpoints:
// xs: 0px
// sm: 600px  
// md: 960px
// lg: 1280px
// xl: 1920px
```

## Styling Approach

### Mobile-First CSS
```javascript
// Desktop first (❌ Old approach)
width: 800px;
@media (max-width: 600px) {
  width: 100%;
}

// Mobile first (✅ New approach)  
sx={{
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: 800
  }
}}
```

### Responsive Spacing
```javascript
sx={{
  py: { xs: 2, sm: 4 },    // Padding Y-axis
  px: { xs: 1, sm: 2 },    // Padding X-axis  
  mt: { xs: 2, md: 3 },    // Margin top
}}
```

## Theme Configuration

The custom theme includes:

### Colors
- **Primary**: Modern blue (#1976d2)
- **Secondary**: Purple accent (#9c27b0)  
- **Background**: Light gray (#f5f5f5)

### Typography
- **Font**: System font stack for optimal performance
- **Weights**: 400 (normal), 600 (semi-bold)

### Component Overrides
- **Cards**: Rounded corners (16px), enhanced shadows
- **Buttons**: Rounded (8px), no text transform, enhanced shadows
- **TextFields**: Rounded inputs (8px)

## Usage

```jsx
import { STJohnQuestionnaire } from '../STJOHNQuestions.js';
import Questionnaire from './components/Questionnaire.jsx';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Questionnaire questionnaire={STJohnQuestionnaire} />
    </ThemeProvider>
  );
}
```

## File Structure

```
src/
├── components/
│   └── Questionnaire.jsx          # Main component
├── theme.js                       # MUI theme configuration  
└── main.jsx                       # Theme provider setup
```

## Dependencies

Make sure these MUI packages are installed:

```json
{
  "@mui/material": "^5.x.x",
  "@emotion/react": "^11.x.x", 
  "@emotion/styled": "^11.x.x"
}
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+  
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- **Tree Shaking**: Only imports used MUI components
- **System Fonts**: No custom font loading
- **Minimal Bundle**: Lightweight theme configuration
- **Responsive Images**: Adaptive sizing for all devices