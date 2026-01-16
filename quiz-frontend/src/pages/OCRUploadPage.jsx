import React, { useState, useRef } from 'react';
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
  Grid,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Check as CheckIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import '../styles/variables.css';
import '../styles/components.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Mock recent uploads data
const MOCK_RECENT_UPLOADS = [
  { id: 1, name: 'Oura_Report_Jan_2024.csv', size: '2.4 MB', time: '2 hours ago', status: 'COMPLETED' },
  { id: 2, name: 'Sleep_Diary_Weekly.pdf', size: '845 KB', time: '15 mins ago', status: 'PROCESSING' },
];

export default function OCRUploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
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
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 500);

      const response = await fetch(`${API_URL}/ocr/process?useLLM=true`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

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
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <>
    <Navbar></Navbar>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Upload Sleep Report
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload your sleep device data or questionnaire results for deep AI analysis.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Upload Area */}
        <Grid item xs={12} md={8}>
          {/* Drag and Drop Zone */}
          <Card
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              mb: 3,
              border: '2px dashed',
              borderColor: isDragging ? '#2563EB' : '#E5E7EB',
              bgcolor: isDragging ? '#F0F4FF' : '#F9FAFB',
              transition: 'all 0.2s',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#2563EB',
                bgcolor: '#F0F4FF',
              },
            }}
          >
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: '#DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UploadIcon sx={{ fontSize: 32, color: '#3B82F6' }} />
                </Box>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Drag and drop your files here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Support for PDF, CSV, and JSON formats from Oura, Fitbit, and Sleep Cycle.
              </Typography>
              <input
                ref={fileInputRef}
                accept=".pdf,.csv,.json,.docx,.doc,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif"
                style={{ display: 'none' }}
                type="file"
                onChange={handleFileChange}
              />
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontSize: '1rem',
                  px: 3,
                  py: 1.5,
                }}
              >
                Browse Files
              </Button>
            </CardContent>
          </Card>

          {/* Selected File Display */}
          {file && (
            <Card sx={{ mb: 3, bgcolor: '#F0F9FF', border: '1px solid #BFDBFE' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FileIcon sx={{ color: '#3B82F6', fontSize: 28 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Change
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          {file && (
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleUpload}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              sx={{ py: 1.5, mb: 3 }}
            >
              {loading ? `Processing... ${Math.round(progress)}%` : 'Upload & Process'}
            </Button>
          )}

          {/* Progress Bar */}
          {loading && progress > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Processing file...
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          {/* Success Result */}
          {result && (
            <>
              <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 3 }}>
                <Typography variant="body2">
                  File processed successfully!
                  {result.llm?.success && ' Medical data extracted using AI.'}
                </Typography>
              </Alert>

              {result.medicalData && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Extracted Medical Data (JSON)
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: '#1F2937',
                        color: '#F3F4F6',
                        maxHeight: '400px',
                        overflow: 'auto',
                        borderRadius: 1,
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

          {/* Recent Uploads */}
          {/* <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Uploads
              </Typography>
              <Button variant="text" size="small">
                View All
              </Button>
            </Box>
            <Stack spacing={1.5}>
              {MOCK_RECENT_UPLOADS.map((upload) => (
                <Paper key={upload.id} sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                      <FileIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {upload.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {upload.size} · {upload.time}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={upload.status}
                        size="small"
                        icon={upload.status === 'COMPLETED' ? <CheckIcon /> : <CircularProgress size={14} />}
                        color={upload.status === 'COMPLETED' ? 'success' : 'primary'}
                        variant={upload.status === 'COMPLETED' ? 'filled' : 'outlined'}
                      />
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<ViewIcon />}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box> */}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Analysis Progress */}
          {/* <Card sx={{ mb: 3, bgcolor: '#3B82F6', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Analysis Progress
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                Your sleep data is being analyzed using our advanced matrix algorithms to identify patterns in your REM and Deep sleep cycles.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Processing Overall
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    65%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={65}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'white',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card> */}

          {/* Upload Guidelines */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Upload Guidelines
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckIcon sx={{ color: '#10B981', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="body2">
                    Ensure CSV headers match standard export formats.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckIcon sx={{ color: '#10B981', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="body2">
                    Maximum file size is 50MB per upload.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckIcon sx={{ color: '#10B981', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="body2">
                    PDF files must be text-searchable (not scanned images).
                  </Typography>
                </Box>
              </Stack>
              <Button variant="text" fullWidth sx={{ mt: 2, textTransform: 'none' }}>
                View documentation →
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </>
  );
}
