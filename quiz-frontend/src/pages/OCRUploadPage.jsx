import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  LinearProgress,
  Container,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function OCRUploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/ocr/process?useLLM=true`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Upload failed');
      }

      setResult(data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>;
    }
    if (typeof value === 'object') {
      return (
        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return String(value);
  };

  const renderExtractedData = (data) => {
    if (!data) return null;

    const sections = [
      {
        title: 'Patient Information',
        fields: ['recordingDevice', 'firstName', 'lastName', 'patientId', 'sex', 'age', 'dateOfBirth', 'height', 'weight', 'bmi', 'measurementDate'],
      },
      {
        title: 'Clinical Information',
        fields: ['indications', 'ess', 'iss', 'comorbidities', 'diagnosis', 'advice'],
      },
      {
        title: 'Study Timing',
        fields: ['lightsOffTime', 'lightsOnTime', 'totalRecordingTime', 'totalSleepTime', 'sleepEfficiency', 'sleepLatency', 'waso', 'remLatencyFromSleepOnset', 'remLatencyFromLightsOff'],
      },
      {
        title: 'Sleep Staging (minutes)',
        fields: ['n1', 'n2', 'n3', 'rem'],
      },
      {
        title: 'Respiratory Events',
        fields: ['centralApnea', 'obstructiveApnea', 'mixedApnea', 'totalApnea', 'hypopnea', 'apneaHypopnea', 'rera', 'rdi', 'remRdi', 'nremRdi', 'supineAhi', 'supineRdi'],
      },
      {
        title: 'Arousals & Oxygenation',
        fields: ['arousalsTotal', 'arousalIndex', 'minimumSpO2', 'meanSpO2', 'hypoxicBurden'],
      },
      {
        title: 'Cardiac',
        fields: ['heartRateAverage', 'heartRateHighest', 'heartRateLowest'],
      },
      {
        title: 'Titration',
        fields: ['titrationQuality', 'pressureSetting', 'maskInterface', 'deviceType', 'maskSize'],
      },
    ];

    return (
      <Box sx={{ mt: 3 }}>
        {sections.map((section) => {
          const hasData = section.fields.some((field) => data[field] !== null && data[field] !== undefined);
          if (!hasData) return null;

          return (
            <Paper key={section.title} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                {section.title}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gap: 1 }}>
                {section.fields.map((field) => {
                  const value = data[field];
                  if (value === null || value === undefined) return null;

                  return (
                    <Box
                      key={field}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" fontWeight="500">
                        {field}:
                      </Typography>
                      <Typography variant="body2">{renderValue(value)}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Medical Report OCR & Data Extraction
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload a sleep study report (PDF, DOCX, or image) to extract structured medical data using OCR and AI
        </Typography>
      </Box>

      {/* Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                disabled={loading}
              >
                Select File
              </Button>
            </label>

            {file && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon color="primary" />
                <Typography variant="body2">{file.name}</Typography>
                <Chip
                  label={`${(file.size / 1024).toFixed(1)} KB`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!file || loading}
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {loading ? 'Processing...' : 'Upload & Process'}
              </Button>
              {(file || result) && (
                <Button variant="outlined" onClick={handleReset} disabled={loading}>
                  Reset
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Loading Progress */}
      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" gutterBottom>
              Processing file... This may take a moment.
            </Typography>
            <LinearProgress />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Success Result - JSON Only */}
      {result && (
        <>
          <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 3 }}>
            <Typography variant="body2">
              File processed successfully!
              {result.llm?.success && ' Medical data extracted using AI.'}
            </Typography>
          </Alert>

          {/* JSON Output Only */}
          {result.medicalData && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Extracted Medical Data (JSON)
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'grey.900',
                    color: 'grey.100',
                    maxHeight: '600px',
                    overflow: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {JSON.stringify(result.medicalData, null, 2)}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}
