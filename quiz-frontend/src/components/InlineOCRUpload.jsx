import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  TextField,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import api from '../api/axios';

/**
 * Inline OCR Upload Component for Admin Dashboard
 * Displays as an icon button next to each patient name
 */
const InlineOCRUpload = ({ patientId, patientName, onUploadSuccess }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setResult(null);
    setFile(null);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setResult(null);
    setFile(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
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
      
      // Notify parent component of successful upload
      if (onUploadSuccess) {
        onUploadSuccess({
          patientId,
          patientName,
          extractedText: response.data.extractedText,
          fileName: response.data.fileName,
          wordCount: response.data.wordCount,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.details ||
          err.response?.data?.error ||
          'Failed to process file'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (result?.extractedText) {
      navigator.clipboard.writeText(result.extractedText);
      alert('Text copied to clipboard!');
    }
  };

  return (
    <>
      <Tooltip title="Upload Document (OCR)">
        <IconButton
          size="small"
          onClick={handleOpen}
          color="primary"
          sx={{ ml: 1 }}
        >
          <UploadFileIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Upload Document for {patientName}
          <Typography variant="caption" display="block" color="text.secondary">
            ID: {patientId}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {!result ? (
            <Box sx={{ py: 2 }}>
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  mb: 2,
                }}
              >
                <UploadFileIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Supported: PDF, DOCX, DOC, PNG, JPG, JPEG, GIF, BMP (Max 10MB)
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  sx={{ mt: 1 }}
                  disabled={loading}
                >
                  Select File
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                    onChange={handleFileChange}
                  />
                </Button>
                {file && (
                  <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
                    ✓ Selected: {file.name}
                  </Typography>
                )}
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Data extraction successful!
              </Alert>

              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  File: {result.fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.wordCount} words | {result.textLength} characters
                </Typography>
              </Box>

              {result.medicalData && (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <TextField
                    multiline
                    fullWidth
                    value={JSON.stringify(result.medicalData, null, 2)}
                    rows={15}
                    variant="outlined"
                    label="Extracted Medical Data (JSON)"
                    inputProps={{
                      readOnly: true,
                      style: { fontFamily: 'monospace', fontSize: '12px' },
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {result ? (
            <>
              <Button onClick={() => {
                if (result.medicalData) {
                  navigator.clipboard.writeText(JSON.stringify(result.medicalData, null, 2));
                  alert('JSON copied to clipboard!');
                }
              }}>Copy JSON</Button>
              <Button onClick={handleClose} variant="contained">
                Done
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                variant="contained"
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Extract Text'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InlineOCRUpload;
