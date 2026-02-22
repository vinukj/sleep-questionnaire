import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { loadQuestionnaire } from '../STJOHNQuestions';
import '../styles/variables.css';
import '../styles/components.css';
import '../styles/ViewResponse.css';

// Icon Components
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);

const AIIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const ViewResponse = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('tab1');
  const [responseData, setResponseData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [mlPayload, setMlPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const schema = await loadQuestionnaire();
        setQuestionnaire(schema);
        
        // Get response data from location state or fetch from API
        if (location.state?.responseData) {
          setResponseData(location.state.responseData);
          
          // If we have responseId, fetch full data including prediction
          const responseId = location.state?.responseId || id;
          if (responseId) {
            try {
              const response = await authFetch(`/questionnaire/admin/all-responses`);
              if (response.ok) {
                const data = await response.json();
                const fullResponse = data.responses?.find(r => r.id === parseInt(responseId));
                if (fullResponse) {
                  setPredictionData(fullResponse.prediction_data);
                  setMlPayload(fullResponse.ml_payload);
                }
              }
            } catch (error) {
              console.error('Error fetching prediction data:', error);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading questionnaire:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [location.state, id, authFetch]);

  const formatValue = (question, value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    if (question.type === 'checkbox' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    
    if (question.calculated) {
      return typeof value === 'number' ? value.toFixed(2) : value;
    }
    
    return value.toString();
  };

  const getQuestionLabel = (question) => {
    return question.label || question.id;
  };

  const shouldShowQuestion = (question, data) => {
    if (!question.dependsOn) return true;
    
    const dependsOnId = question.dependsOn.id;
    const dependsOnValue = question.dependsOn.value;
    const actualValue = data[dependsOnId];
    
    if (Array.isArray(actualValue)) {
      return actualValue.includes(dependsOnValue);
    }
    
    return actualValue === dependsOnValue;
  };

  const calculateISSScore = (data) => {
    const questions = ['iss_q1', 'iss_q2b', 'iss_q3', 'iss_q4', 'iss_q5', 'iss_q6', 'iss_q7', 'iss_q8a', 'iss_q8b', 'iss_q8c', 'iss_q8d', 'iss_q8e'];
    let score = 0;
    questions.forEach(q => {
      if (data[q] === 'Yes') score++;
    });
    return score;
  };

  const getScoreBadgeClass = (score) => {
    if (score === 'N/A' || score === null || score === undefined) return 'badge--secondary';
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (numScore >= 15) return 'badge--danger';
    if (numScore >= 10) return 'badge--warning';
    return 'badge--success';
  };

  const handleEdit = () => {
    const responseId = location.state?.responseId;
    if (!responseId) {
      alert('Unable to edit: Response ID not found');
      return;
    }
    
    navigate(`/edit-response/${responseId}`, { 
      state: { 
        responseData: responseData,
        responseId: responseId,
        patientName: responseData.name || 'Unknown Patient',
        patientId: responseData.hospital_id || responseId,
        hospitalId: responseData.hospital_id,
        lastModified: location.state?.created_at || new Date().toISOString()
      } 
    });
  };

  const handlePrint = () => {
    window.print();
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

  if (!responseData) {
    return (
      <>
        <Navbar />
        <div className="view-response-container">
          <div className="alert alert--warning">
            No response data found
          </div>
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
          <span>View Response</span>
        </nav>

        {/* Response Header */}
        <div className="response-header">
          <div>
            <h1>{responseData.name || 'Unknown Patient'}</h1>
            <div className="response-header-meta">
              <span className="patient-id-badge">{responseData.hospital_id || 'N/A'}</span>
              <span className="hospital-id-text">Hospital ID: {responseData.hospital_id || 'N/A'}</span>
            </div>
            <p className="completion-date">Completed on: {new Date(location.state?.created_at || Date.now()).toLocaleString()}</p>
          </div>
          <div className="action-buttons">
            <button className="btn btn--primary" onClick={handleEdit}>
              <EditIcon />
              Edit
            </button>
            <button className="btn btn--secondary" onClick={handlePrint}>
              <PrintIcon />
              Print
            </button>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="ai-insight-card">
          <div className="ai-insight-icon">
            <AIIcon />
          </div>
          <div className="ai-insight-content">
            <h2>AI-Powered Clinical Insight</h2>
            <p>
              Based on the comprehensive questionnaire analysis, this patient has been assessed for sleep disorders. 
              {responseData.clinical_impression && Array.isArray(responseData.clinical_impression) && responseData.clinical_impression.length > 0 && (
                <> Clinical impressions include: <strong>{responseData.clinical_impression.join(', ')}</strong>.</>
              )}
            </p>
            <div className="ai-insight-badges">
              <span className="insight-badge">ISS Score: {responseData.issScore || responseData.iss || calculateISSScore(responseData)}</span>
              <span className="insight-badge">Epworth Score: {responseData.epworth_score || responseData.ess || 'N/A'}</span>
              {responseData.bmi && <span className="insight-badge">BMI: {parseFloat(responseData.bmi).toFixed(1)}</span>}
            </div>
          </div>
        </div>

        {/* ML Prediction Section */}
        {predictionData && (
          <div className="prediction-card">
            <h2>ML Model Prediction Results</h2>
            <div className="prediction-content">
              <div className="prediction-summary">
                <div className="prediction-class">
                  <span className="prediction-label">Classification:</span>
                  <span className={`prediction-badge badge--${
                    predictionData.final_class[0] === 'Severe' ? 'danger' : 
                    predictionData.final_class[0] === 'Moderate' ? 'warning' : 
                    'success'
                  }`}>
                    {predictionData.final_class || 'N/A'}
                  </span>
                </div>
                {predictionData.risk_text && (
                  <div className="prediction-recommendation">
                    <strong>Recommendation:</strong> {predictionData.risk_text}
                  </div>
                )}
              </div>

              {predictionData.probabilities && (
                <div className="prediction-probabilities">
                  <h3>Prediction Probabilities</h3>
                  <div className="probability-grid">
                    <div className="probability-section">
                      <h4>Stage 1: OSA Detection</h4>
                      <div className="probability-item">
                        <span>No OSA:</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${(predictionData.probabilities.No_OSA * 100).toFixed(1)}%`}}></div>
                        </div>
                        <span>{(predictionData.probabilities.No_OSA * 100).toFixed(1)}%</span>
                      </div>
                      <div className="probability-item">
                        <span>OSA:</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${(predictionData.probabilities.OSA * 100).toFixed(1)}%`}}></div>
                        </div>
                        <span>{(predictionData.probabilities.OSA * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="probability-section">
                      <h4>Stage 2: Severity</h4>
                      <div className="probability-item">
                        <span>Not Severe:</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${(predictionData.probabilities.Not_Severe * 100).toFixed(1)}%`}}></div>
                        </div>
                        <span>{(predictionData.probabilities.Not_Severe * 100).toFixed(1)}%</span>
                      </div>
                      <div className="probability-item">
                        <span>Severe:</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${(predictionData.probabilities.Severe * 100).toFixed(1)}%`}}></div>
                        </div>
                        <span>{(predictionData.probabilities.Severe * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* <div className="probability-section">
                      <h4>Stage 3: Classification</h4>
                      <div className="probability-item">
                        <span>Mild:</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${(predictionData.probabilities.Mild * 100).toFixed(1)}%`}}></div>
                        </div>
                        <span>{(predictionData.probabilities.Mild * 100).toFixed(1)}%</span>
                      </div>
                      <div className="probability-item">
                        <span>Moderate:</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${(predictionData.probabilities.Moderate * 100).toFixed(1)}%`}}></div>
                        </div>
                        <span>{(predictionData.probabilities.Moderate * 100).toFixed(1)}%</span>
                      </div>
                    </div> */}
                  </div>
                </div>
              )}

              {mlPayload && (
                <details className="ml-payload-details">
                  <summary>View ML Model Input Payload</summary>
                  <pre className="ml-payload-json">{JSON.stringify(mlPayload, null, 2)}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Patient Summary Card */}
        <div className="patient-summary-card">
          <h2>Patient Summary</h2>
          <div className="patient-info-grid">
            <div className="patient-info-item">
              <span className="patient-info-label">Full Name</span>
              <span className="patient-info-value">{responseData.name || 'N/A'}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Age</span>
              <span className="patient-info-value">{responseData.age || 'N/A'}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Gender</span>
              <span className="patient-info-value">{responseData.gender || 'N/A'}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Email</span>
              <span className="patient-info-value">{responseData.email || 'N/A'}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Phone</span>
              <span className="patient-info-value">{responseData.phoneNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="two-column-layout">
          {/* Left Sidebar Navigation */}
          <div className="step-nav-sidebar">
            <h3>Questionnaire Sections</h3>
            <div className="step-nav">
              {questionnaire.map((page, index) => (
                <button 
                  key={`tab${page.page}`}
                  className={`step-nav-item ${activeTab === `tab${page.page}` ? 'active' : ''}`}
                  onClick={() => setActiveTab(`tab${page.page}`)}
                >
                  <span className="step-number">{page.page}</span>
                  <span className="step-label">{page.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="content-area">
            {questionnaire.map((page) => (
              <div 
                key={`content${page.page}`}
                className={`tab-content ${activeTab === `tab${page.page}` ? 'active' : ''}`}
              >
                <div className="response-section">
                  <h3>{page.title}</h3>
                  <div className="response-grid">
                    {page.questions
                      .filter(question => shouldShowQuestion(question, responseData))
                      .map((question) => {
                        const value = responseData[question.id];
                        const displayValue = formatValue(question, value);
                        
                        return (
                          <div key={question.id} className="response-field">
                            <span className="response-label">{getQuestionLabel(question)}</span>
                            {question.type === 'checkbox' && Array.isArray(value) && value.length > 0 ? (
                              <div className="response-pills">
                                {value.map((item, idx) => (
                                  <span key={idx} className="pill">{item}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="response-value">{displayValue}</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </main>
      </div>

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
};

export default ViewResponse;
