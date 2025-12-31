import React, { useState } from 'react';
import {
  Container,
  Paper,
  Button,
  Input,
  CircularProgress,
  Alert,
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../api/axios';

const OCRUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/ocr/process?useLLM=true', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      setFile(null);
      setFileName('');
    } catch (err) {
      setError(
        err.response?.data?.details ||
          err.response?.data?.error ||
          'Failed to process file. Make sure the file format is supported (PDF, PNG, JPG, etc.)'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearResult = () => {
    setResult(null);
    setError(null);
  };

  const handleCopyText = () => {
    if (result?.extractedText) {
      navigator.clipboard.writeText(result.extractedText);
      alert('Text copied to clipboard!');
    }
  };

  const handleDownloadText = () => {
    if (result?.extractedText) {
      const element = document.createElement('a');
      const file = new Blob([result.extractedText], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${result.fileName}_extracted.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          📄 OCR Text Extractor
        </Typography>

        {/* Upload Section */}
        {!result && (
          <Box sx={{ mb: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed #ccc',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: '#1976d2',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload a File to Extract Text
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Supported formats: PDF, DOCX, DOC, PNG, JPG, JPEG, GIF, BMP, WebP (Max 10MB)
              </Typography>
              <Input
                type="file"
                inputProps={{
                  accept: '.pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.bmp,.webp',
                }}
                onChange={handleFileChange}
                sx={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <Button variant="contained" component="span" sx={{ mb: 2 }}>
                  Select File
                </Button>
              </label>
              {fileName && (
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  ✓ Selected: {fileName}
                </Typography>
              )}
            </Paper>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!file || loading}
                sx={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Extract Text (OCR)'
                )}
              </Button>
            </Box>
          </Box>
        )}

        {/* Result Section */}
        {result && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Text extraction successful!
            </Alert>

            <Card sx={{ mb: 3, backgroundColor: '#f9f9f9' }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                  File Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      File Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {result.fileName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      File Type
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {result.fileType}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Text Length
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {result.textLength} characters
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Word Count
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {result.wordCount} words
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Extracted Medical Data */}
            {result.medicalData && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Extracted Medical Data (JSON)
                </Typography>
                <TextField
                  multiline
                  fullWidth
                  value={JSON.stringify(result.medicalData, null, 2)}
                  rows={15}
                  variant="outlined"
                  inputProps={{
                    readOnly: true,
                    style: { fontFamily: 'monospace', fontSize: '12px' },
                  }}
                />
              </Box>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {result.medicalData && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(result.medicalData, null, 2));
                    alert('JSON copied to clipboard!');
                  }}
                >
                  📋 Copy JSON
                </Button>
              )}
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearResult}
              >
                🔄 Upload Another
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default OCRUpload;
