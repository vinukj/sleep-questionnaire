import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { loadQuestionnaire } from '../STJOHNQuestions';
import '../styles/variables.css';
import '../styles/components.css';
import '../styles/ViewResponse.css';
import '../styles/EditResponse.css';

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const CancelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function EditResponse() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: responseId } = useParams();
  const { authFetch } = useAuth();

  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [questionnaire, setQuestionnaire] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const schema = await loadQuestionnaire();
        setQuestionnaire(schema);

        // Get response data from location state or fetch it
        if (location.state?.responseData) {
          console.log('Loading from location state:', location.state.responseData);
          setFormData(location.state.responseData);
        } else if (responseId) {
          const response = await authFetch(`/api/questionnaire/response/${responseId}`);
          if (response.ok) {
            const data = await response.json();
            setFormData(data.response_data || {});
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.state, responseId, authFetch]);

  const handleInputChange = (fieldId, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Submitting updated response:', responseId);
      console.log('Form data:', formData);
      
      const response = await authFetch(`/questionnaire/update/${responseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseData: formData }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response:', await response.text());
        throw new Error('Server error - please try again');
      }

      const result = await response.json();
      
      if (response.ok) {
        console.log('Successfully updated response:', result);
        setSuccessMessage(true);
        setTimeout(() => {
          setSuccessMessage(false);
          navigate(`/view-response/${responseId}`, {
            state: {
              responseData: formData,
              responseId: responseId,
              created_at: location.state?.lastModified || result.updated_at || new Date().toISOString()
            }
          });
        }, 1500);
      } else {
        console.error('Failed to save:', result);
        alert(`Failed to save changes: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      navigate(`/view-response/${responseId}`, {
        state: {
          responseData: formData,
          responseId: responseId
        }
      });
    }
  };

  const toggleAccordion = (step) => {
    setActiveStep(activeStep === step ? null : step);
  };

  const shouldShowQuestion = (question) => {
    if (!question.dependsOn) return true;
    
    const dependsOnId = question.dependsOn.id;
    const dependsOnValue = question.dependsOn.value;
    const actualValue = formData[dependsOnId];
    
    if (Array.isArray(actualValue)) {
      return actualValue.includes(dependsOnValue);
    }
    
    return actualValue === dependsOnValue;
  };

  const getOptionValue = (opt) => typeof opt === 'object' ? opt.value : opt;
  const getOptionLabel = (opt) => typeof opt === 'object' ? opt.label : opt;

  const renderEditField = (question) => {
    const value = formData[question.id] || '';

    if (question.type === 'radio' && question.options) {
      if (question.options.length === 2) {
        // Two options - render as toggle buttons
        return (
          <div className="toggle-group">
            {question.options.map((opt) => {
              const optValue = getOptionValue(opt);
              const optLabel = getOptionLabel(opt);
              return (
                <button
                  key={optValue}
                  type="button"
                  className={`toggle-btn ${value === optValue ? 'active' : ''}`}
                  onClick={() => handleInputChange(question.id, optValue)}
                >
                  {optLabel}
                </button>
              );
            })}
          </div>
        );
      } else {
        // More than 2 options - render as pills
        return (
          <div className="pill-grid">
            {question.options.map((opt) => {
              const optValue = getOptionValue(opt);
              const optLabel = getOptionLabel(opt);
              return (
                <div
                  key={optValue}
                  className={`pill-option ${value === optValue ? 'selected' : ''}`}
                  onClick={() => handleInputChange(question.id, optValue)}
                >
                  <span>{optLabel}</span>
                  <span className="pill-icon"></span>
                </div>
              );
            })}
          </div>
        );
      }
    }

    if (question.type === 'checkbox') {
      const selectedArray = Array.isArray(value) ? value : [];
      return (
        <div className="pill-grid">
          {question.options?.map((opt) => {
            const optValue = getOptionValue(opt);
            const optLabel = getOptionLabel(opt);
            return (
              <div
                key={optValue}
                className={`pill-option ${selectedArray.includes(optValue) ? 'selected' : ''}`}
                onClick={() => {
                  const newValue = selectedArray.includes(optValue)
                    ? selectedArray.filter((o) => o !== optValue)
                    : [...selectedArray, optValue];
                  handleInputChange(question.id, newValue);
                }}
              >
                <span>{optLabel}</span>
                <span className="pill-icon"></span>
              </div>
            );
          })}
        </div>
      );
    }

    if (question.type === 'select') {
      return (
        <select
          className="form-input"
          value={value}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
        >
          <option value="">-- Select --</option>
          {question.options?.map((opt) => {
            const optValue = getOptionValue(opt);
            const optLabel = getOptionLabel(opt);
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
      );
    }

    if (question.type === 'textarea') {
      return (
        <textarea
          className="form-input form-textarea"
          value={value}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
          placeholder={question.placeholder}
        />
      );
    }

    if (question.type === 'number') {
      return (
        <input
          type="number"
          className="form-input"
          value={value}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
          min={question.min}
          max={question.max}
          step={question.step}
        />
      );
    }

    if (question.type === 'time') {
      return (
        <input
          type="time"
          className="form-input"
          value={value}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
        />
      );
    }

    if (question.type === 'email') {
      return (
        <input
          type="email"
          className="form-input"
          value={value}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
        />
      );
    }

    if (question.type === 'tel') {
      return (
        <input
          type="tel"
          className="form-input"
          value={value}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
        />
      );
    }

    // Default to text input
    return (
      <input
        type="text"
        className="form-input"
        value={value}
        onChange={(e) => handleInputChange(question.id, e.target.value)}
        placeholder={question.placeholder}
      />
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-response-loading">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-response-wrapper">
        <main className="view-response-container">
          {/* Breadcrumb Navigation */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin'); }}>Admin Dashboard</a>
            <span className="breadcrumb-separator">›</span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin'); }}>All Responses</a>
            <span className="breadcrumb-separator">›</span>
            <span>Edit Response</span>
          </nav>

          {/* Response Header */}
          <div className="response-header">
            <div>
              <h1>{location.state?.patientName || formData.name || 'Md Test'}</h1>
              <div className="response-header-meta">
                <span className="patient-id-badge">{location.state?.patientId || formData.hospital_id || 'N/A'}</span>
                <span className="hospital-id-text">Hospital ID: {location.state?.hospitalId || formData.hospital_id || 'N/A'}</span>
              </div>
              <p className="completion-date">
                Last modified: {location.state?.lastModified ? new Date(location.state.lastModified).toLocaleString() : 'Just now'}
              </p>
            </div>
            <div className="action-buttons">
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                <SaveIcon />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn--secondary" onClick={handleCancel}>
                <CancelIcon />
                Cancel
              </button>
            </div>
          </div>

          {/* Accordion Sections */}
          <div className="accordion">
            {questionnaire.map((page) => (
              <div 
                key={page.page}
                className={`accordion-item ${activeStep === page.page ? 'active' : ''}`}
              >
                <div 
                  className="accordion-header"
                  onClick={() => toggleAccordion(page.page)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAccordion(page.page);
                    }
                  }}
                >
                  <div className="accordion-title">
                    <span className="step-number">{page.page}</span>
                    <span>{page.title}</span>
                  </div>
                  <div className="accordion-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <div className="response-grid">
                      {page.questions
                        .filter(question => shouldShowQuestion(question))
                        .map((question) => (
                          <div key={question.id} className="response-field edit-field">
                            <label className="response-label">
                              {question.label}
                              {question.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                            </label>
                            <div className="response-value">
                              {renderEditField(question)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message show">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Changes saved successfully!</span>
        </div>
      )}

      {/* Footer */}
      <footer className="view-response-footer">
        <div className="view-response-footer-content">
          <span>&copy; 2024 SleepMaitrix</span>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#help">Help</a>
        </div>
      </footer>
    </>
  );
}
