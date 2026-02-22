import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    margin: theme.spacing(2),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1F2937',
  borderBottom: '1px solid #E5E7EB',
}));

const PredictionBanner = styled(Box)(({ severity }) => {
  const colors = {
    Mild: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    Moderate: { bg: '#FED7AA', text: '#9A3412', border: '#FB923C' },
    Severe: { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' },
  };
  
  const colorScheme = colors[severity] || colors.Moderate;
  
  return {
    backgroundColor: colorScheme.bg,
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    border: `2px solid ${colorScheme.border}`,
    textAlign: 'center',
  };
});

const PredictionLabel = styled(Typography)({
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#EF4444',
  marginBottom: '0.5rem',
});

const PredictionValue = styled(Typography)(({ severity }) => {
  const colors = {
    Mild: '#D97706',
    Moderate: '#EA580C',
    Severe: '#DC2626',
  };
  
  return {
    fontSize: '2rem',
    fontWeight: 700,
    color: colors[severity] || colors.Moderate,
    marginBottom: '0.75rem',
  };
});

const RiskDescription = styled(Typography)({
  fontSize: '0.938rem',
  color: '#DC2626',
  lineHeight: 1.5,
});

const SectionTitle = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6B7280',
  marginBottom: '1rem',
  marginTop: '2rem',
});

const StageLabel = styled(Typography)({
  fontSize: '0.813rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: '0.75rem',
  marginTop: '1.5rem',
});

const ProbabilityRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '0.75rem',
});

const ProbabilityLabel = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#374151',
  minWidth: '100px',
  textAlign: 'right',
});

const ProgressBarContainer = styled(Box)({
  flex: 1,
  height: '24px',
  backgroundColor: '#F3F4F6',
  borderRadius: '4px',
  overflow: 'hidden',
  position: 'relative',
});

const ProgressBar = styled(Box)(({ value }) => ({
  height: '100%',
  backgroundColor: '#EF4444',
  width: `${value}%`,
  transition: 'width 0.5s ease',
  borderRadius: '4px',
}));

const PercentageText = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#1F2937',
  minWidth: '50px',
  textAlign: 'right',
});

const PredictionResultModal = ({ open, onClose, prediction }) => {
  if (!prediction) return null;

  const { final_class, risk_text, probabilities } = prediction;
  const severity = final_class?.[0] || 'Moderate';
  const riskMessage = risk_text?.[0] || 'Analysis complete';

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <StyledDialogTitle>
        Analysis Result
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: '#9CA3AF' }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Prediction Banner */}
        <PredictionBanner severity={severity}>
          <PredictionLabel>PREDICTION</PredictionLabel>
          <PredictionValue severity={severity}>{severity}</PredictionValue>
          <RiskDescription>{riskMessage}</RiskDescription>
        </PredictionBanner>

        {/* Model Probabilities */}
        <SectionTitle>Model Probabilities</SectionTitle>

        {/* Stage 1: OSA Detection */}
        <StageLabel>Stage 1 — OSA Detection</StageLabel>
        
        {probabilities?.No_OSA !== undefined && (
          <ProbabilityRow>
            <ProbabilityLabel>No OSA</ProbabilityLabel>
            <ProgressBarContainer>
              <ProgressBar value={probabilities.No_OSA[0] * 100} />
            </ProgressBarContainer>
            <PercentageText>{formatPercentage(probabilities.No_OSA[0])}</PercentageText>
          </ProbabilityRow>
        )}

        {probabilities?.OSA !== undefined && (
          <ProbabilityRow>
            <ProbabilityLabel>OSA</ProbabilityLabel>
            <ProgressBarContainer>
              <ProgressBar value={probabilities.OSA[0] * 100} />
            </ProgressBarContainer>
            <PercentageText>{formatPercentage(probabilities.OSA[0])}</PercentageText>
          </ProbabilityRow>
        )}

        {/* Stage 2: Severity */}
        {(probabilities?.Not_Severe !== undefined || probabilities?.Severe !== undefined) && (
          <>
            <StageLabel>Stage 2 — Severity</StageLabel>
            
            {probabilities?.Not_Severe !== undefined && (
              <ProbabilityRow>
                <ProbabilityLabel>Not Severe</ProbabilityLabel>
                <ProgressBarContainer>
                  <ProgressBar value={probabilities.Not_Severe[0] * 100} />
                </ProgressBarContainer>
                <PercentageText>{formatPercentage(probabilities.Not_Severe[0])}</PercentageText>
              </ProbabilityRow>
            )}

            {probabilities?.Severe !== undefined && (
              <ProbabilityRow>
                <ProbabilityLabel>Severe</ProbabilityLabel>
                <ProgressBarContainer>
                  <ProgressBar value={probabilities.Severe[0] * 100} />
                </ProgressBarContainer>
                <PercentageText>{formatPercentage(probabilities.Severe[0])}</PercentageText>
              </ProbabilityRow>
            )}
          </>
        )}

        {/* Stage 3: Detailed Classification (if available) */}
        {(probabilities?.Mild !== undefined || probabilities?.Moderate !== undefined) && (
          <>
            <StageLabel>Stage 3 — Classification</StageLabel>
            
            {probabilities?.Mild !== undefined && (
              <ProbabilityRow>
                <ProbabilityLabel>Mild</ProbabilityLabel>
                <ProgressBarContainer>
                  <ProgressBar value={probabilities.Mild[0] * 100} />
                </ProgressBarContainer>
                <PercentageText>{formatPercentage(probabilities.Mild[0])}</PercentageText>
              </ProbabilityRow>
            )}

            {probabilities?.Moderate !== undefined && (
              <ProbabilityRow>
                <ProbabilityLabel>Moderate</ProbabilityLabel>
                <ProgressBarContainer>
                  <ProgressBar value={probabilities.Moderate[0] * 100} />
                </ProgressBarContainer>
                <PercentageText>{formatPercentage(probabilities.Moderate[0])}</PercentageText>
              </ProbabilityRow>
            )}
          </>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default PredictionResultModal;
