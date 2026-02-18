import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  CircularProgress, 
  Box, 
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  FileDownload, 
  TableChart, 
  Description, 
  ExpandMore 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Reusable Excel/CSV Export Button Component
 */
const ExcelExportButton = ({
  fileName = 'questionnaire_responses',
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  showDropdown = true,
  onExportStart,
  onExportComplete,
  onExportError,
  disabled = false,
  children,
  ...buttonProps
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);
  const { currentUser: user } = useAuth();

  const {authFetch}= useAuth();

  const handleClick = (event) => {
    if (showDropdown) {
      setAnchorEl(event.currentTarget);
    } else {
      handleExport('excel');
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format) => {
    handleClose();

    if (!user) {
      setError('Authentication required for export functionality');
      onExportError?.('Authentication required');
      return;
    }

    setIsExporting(true);
    setError(null);
    onExportStart?.(format);

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileExtension = format === 'csv' ? 'csv' : 'xlsx';
      const defaultFileName = `${fileName}_${timestamp}.${fileExtension}`;

      console.log(`Starting ${format} export for admin user:`, user.email);

      const response = await authFetch(`/api/export/${format}`, {
        method: 'GET',
        headers: {
        }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
      }

      // Convert response to a blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header if available
      const disposition = response.headers.get('content-disposition');
      let finalFileName = defaultFileName;
      if (disposition && disposition.includes('filename=')) {
        finalFileName = disposition
          .split('filename=')[1]
          .split(';')[0]
          .replace(/"/g, '');
      }

      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      onExportComplete?.(format, finalFileName);
      console.log(`${format.toUpperCase()} export completed: ${finalFileName}`);
    } catch (err) {
      console.error('Export error:', err);
      const errorMessage = err.message || 'Export failed';
      setError(errorMessage);
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloseError = () => setError(null);

  const isDisabled = disabled || isExporting;

  if (!user) {
    return (
      <Box>
        <Button
          variant="outlined"
          size={size}
          disabled
          startIcon={<FileDownload />}
          {...buttonProps}
        >
          Login Required
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        variant={variant}
        size={size}
        color={color}
        onClick={handleClick}
        disabled={isDisabled}
        startIcon={
          children ? null : (
            isExporting ? (
              <CircularProgress size={16} />
            ) : (
              <FileDownload />
            )
          )
        }
        endIcon={children ? null : (showDropdown ? <ExpandMore /> : null)}
        {...buttonProps}
      >
        {children || (isExporting ? 'Exporting...' : 'Export All Responses')}
      </Button>

      {showDropdown && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem onClick={() => handleExport('excel')}>
            <TableChart sx={{ mr: 1, color: 'success.main' }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Excel (.xlsx)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rich formatting, formulas
              </Typography>
            </Box>
          </MenuItem>
          
        </Menu>
      )}

      {/* Error notification */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExcelExportButton;
