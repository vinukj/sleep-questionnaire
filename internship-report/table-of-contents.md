# TABLE OF CONTENTS

| Chapter No. | Contents | Page No. |
|-------------|----------|----------|
| | **Executive Summary** | i |
| | **List of Figures** | ii |
| | **List of Tables** | iii |
| | **Abbreviations** | iv |
| | **Symbols and Notations** | v |
| **1.** | **INTRODUCTION** | **1** |
| 1.1 | Background | 1 |
| | 1.1.1 Sleep as a Performance Metric in Athletics | 1 |
| | 1.1.2 Sleep Disorder Prevalence in Indian Population | 2 |
| | 1.1.3 Limitations of Standardized Sleep Assessment Tools (PSQI, ESS) | 3 |
| 1.2 | Motivation | 4 |
| | 1.2.1 Clinical Workflow Challenges at St. John's Hospital | 4 |
| | 1.2.2 Need for Culturally Validated Assessment Instruments | 5 |
| | 1.2.3 Digital Pre-screening for Resource Optimization | 6 |
| 1.3 | Scope of the Project | 7 |
| | 1.3.1 Core Modules: Authentication, Questionnaire, ML Prediction, RAG, Voice | 7 |
| | 1.3.2 PHI Compliance and Security Boundaries | 8 |
| | 1.3.3 Future Extensions: Wearables, EDF Integration, Home Monitoring | 9 |
| **2.** | **PROJECT DESCRIPTION AND GOALS** | **10** |
| 2.1 | Literature Review | 10 |
| | 2.1.1 Sleep Questionnaires and Validation Frameworks | 10 |
| | 2.1.2 Indian Adaptations: ISS, IIRS, ESS-I | 11 |
| | 2.1.3 Athlete-Specific Instruments (ASSQ, ASBQ) | 12 |
| | 2.1.4 Polysomnography (PSG) and EDF Data Standards | 13 |
| | 2.1.5 RAG Systems in Clinical Decision Support | 14 |
| | 2.1.6 Voice-to-Text AI for Healthcare Documentation | 15 |
| 2.2 | Research Gap | 16 |
| | 2.2.1 Absence of Indian Athlete-Specific Sleep Questionnaire | 16 |
| | 2.2.2 Lack of Integrated Subjective-Objective Data Systems | 17 |
| | 2.2.3 Manual Data Management in Indian Sleep Laboratories | 18 |
| 2.3 | Objectives | 19 |
| 2.4 | Problem Statement | 21 |
| 2.5 | Project Plan | 23 |
| | 2.5.1 Gantt Chart and Timeline | 23 |
| | 2.5.2 Milestones and Deliverables | 24 |
| **3.** | **TECHNICAL SPECIFICATION** | **25** |
| 3.1 | Requirements | 25 |
| | 3.1.1 Functional Requirements | 25 |
| | | FR-1: Keycloak-based OIDC Authentication with Session Management | 25 |
| | | FR-2: Dynamic Questionnaire Schema System | 26 |
| | | FR-3: ML Prediction Pipeline for OSA Risk Assessment | 27 |
| | | FR-4: RAG-based Clinical Explanation Generation | 28 |
| | | FR-5: Real-time Voice Transcription with Speaker Diarization | 29 |
| | | FR-6: Excel Export with Formula Injection Prevention | 30 |
| | | FR-7: OCR Document Processing (Tesseract, Mammoth) | 31 |
| | 3.1.2 Non-Functional Requirements | 32 |
| | | NFR-1: Single-Device Session Enforcement | 32 |
| | | NFR-2: PHI Encryption at Rest and in Transit | 33 |
| | | NFR-3: Sub-2-Minute Token Refresh Latency | 34 |
| | | NFR-4: Graceful Degradation Under Service Failure | 35 |
| 3.2 | Feasibility Study | 36 |
| | 3.2.1 Technical Feasibility | 36 |
| | 3.2.2 Economic Feasibility | 37 |
| | 3.2.3 Social Feasibility | 38 |
| 3.3 | System Specification | 39 |
| | 3.3.1 Hardware Specification | 39 |
| | 3.3.2 Software Specification | 40 |
| | 3.3.3 Use Case Diagram | 42 |
| | 3.3.4 Data Flow Diagram (Level 0, 1, 2) | 44 |
| | 3.3.5 State Transition Diagram for Session Management | 47 |
| **4.** | **SYSTEM DESIGN** | **49** |
| 4.1 | System Architecture | 49 |
| | 4.1.1 Four-Service Microservices Architecture | 49 |
| | 4.1.2 Service Communication Patterns (REST, WebSocket, Promise.allSettled) | 51 |
| | 4.1.3 Database Schema Design (PostgreSQL with JSONB) | 53 |
| 4.2 | Detailed Design | 55 |
| | 4.2.1 Authentication Flow: Hybrid bcrypt-to-Keycloak Migration | 55 |
| | 4.2.2 Sequence Diagram: Questionnaire Submission with Parallel ML/RAG | 57 |
| | 4.2.3 Collaboration Diagram: Voice Capture WebSocket Tunnel | 59 |
| | 4.2.4 Class Diagram: Express Middleware Chain | 61 |
| | 4.2.5 Activity Diagram: Token Refresh with Deduplication | 63 |
| | 4.2.6 Component Diagram: RAG Service with ChromaDB Vector Store | 65 |
| **5.** | **METHODOLOGY AND IMPLEMENTATION** | **67** |
| 5.1 | Module 1: Authentication and Session Management | 67 |
| | 5.1.1 Keycloak OIDC Integration | 67 |
| | 5.1.2 Hybrid Login: Legacy bcrypt + Keycloak Auto-Migration | 69 |
| | 5.1.3 Single-Device Enforcement via X-Session-Token Header | 71 |
| | 5.1.4 Cross-Tab Session Sync with BroadcastChannel API | 73 |
| | 5.1.5 Proactive Token Refresh (< 2 minutes expiry check) | 75 |
| 5.2 | Module 2: Questionnaire Management System | 77 |
| | 5.2.1 Dynamic Schema Design (JSONB Storage) | 77 |
| | 5.2.2 Conditional Question Rendering with dependsOn Logic | 79 |
| | 5.2.3 Form State Persistence with localStorage Auto-Save | 81 |
| | 5.2.4 BMI and Waist/Hip Ratio Auto-Calculation | 83 |
| 5.3 | Module 3: ML Prediction Service Integration | 85 |
| | 5.3.1 Payload Builder: Gender Conversion, Binary Normalization | 85 |
| | 5.3.2 Parallel Execution: Promise.allSettled() Pattern | 87 |
| | 5.3.3 Graceful Degradation on ML Service Failure | 89 |
| 5.4 | Module 4: RAG Explanation Service | 91 |
| | 5.4.1 ChromaDB Vector Store with Local Embeddings | 91 |
| | 5.4.2 PDF Ingestion Pipeline using pypdf | 93 |
| | 5.4.3 Evidence Retrieval with Citation Generation | 95 |
| | 5.4.4 Grounded Explanation using LLM | 97 |
| 5.5 | Module 5: Voice Transcription Service | 99 |
| | 5.5.1 Azure Speech Services Integration | 99 |
| | 5.5.2 WebSocket Audio Streaming (16kHz Mono PCM) | 101 |
| | 5.5.3 Speaker Diarization with ConversationTranscriber | 103 |
| | 5.5.4 Multi-Language Detection (9 Indian Languages) | 105 |
| | 5.5.5 Phrase List Grammar for Clinical Vocabulary Boosting | 107 |
| | 5.5.6 Gemini AI for Structured JSON Extraction | 109 |
| 5.6 | Module 6: Data Export and OCR | 111 |
| | 5.6.1 Excel Export with Formula Injection Prevention | 111 |
| | 5.6.2 Column Ordering and Width Optimization | 113 |
| | 5.6.3 OCR Processing with Tesseract.js and mammoth | 115 |
| 5.7 | Testing Strategy | 117 |
| | 5.7.1 Unit Testing: Critical Path Coverage | 117 |
| | 5.7.2 Integration Testing: Service Communication | 118 |
| | 5.7.3 Security Testing: Session Token Validation | 119 |
| | 5.7.4 Load Testing: Rate Limiting Verification | 120 |
| **6.** | **PROJECT IMPLEMENTATION** | **121** |
| 6.1 | Experimental Setup | 121 |
| | 6.1.1 Development Environment Configuration | 121 |
| | 6.1.2 Deployment Architecture (Vercel + VPS/PM2) | 123 |
| 6.2 | Datasets | 125 |
| | 6.2.1 St. John Sleep Questionnaire Schema | 125 |
| | 6.2.2 Clinical Guidelines for RAG Ingestion | 127 |
| | 6.2.3 PSG Training Data for ML Model (External) | 128 |
| 6.3 | Environment Variables and Security Configuration | 129 |
| 6.4 | CI/CD Pipeline (GitHub Actions) | 131 |
| **7.** | **RESULTS AND DISCUSSION** | **133** |
| 7.1 | System Screenshots | 133 |
| | 7.1.1 Authentication Screen with Google OAuth | 133 |
| | 7.1.2 Questionnaire Interface with Conditional Questions | 134 |
| | 7.1.3 Admin Dashboard with Search and Pagination | 135 |
| | 7.1.4 Voice Capture UI with Real-time Transcription | 136 |
| | 7.1.5 RAG Explanation View with Citations | 137 |
| 7.2 | API Documentation (Swagger UI) | 138 |
| 7.3 | Performance Metrics | 139 |
| | 7.3.1 Token Refresh Latency | 139 |
| | 7.3.2 Questionnaire Submission Response Time | 140 |
| | 7.3.3 Voice Transcription Accuracy | 141 |
| | 7.3.4 RAG Retrieval Precision | 142 |
| 7.4 | Security Validation | 143 |
| | 7.4.1 Session Token Mismatch Prevention | 143 |
| | 7.4.2 Formula Injection Sanitization | 144 |
| 7.5 | Comparison with Existing Systems | 145 |
| 7.6 | Cost Analysis | 146 |
| | 7.6.1 Azure Speech Services Pricing | 146 |
| | 7.6.2 VPS Hosting Costs | 147 |
| **8.** | **CONCLUSION AND FUTURE ENHANCEMENTS** | **148** |
| 8.1 | Conclusion | 148 |
| 8.2 | Future Enhancements | 150 |
| | 8.2.1 EDF File Storage and Hypnogram Visualization | 150 |
| | 8.2.2 Wearable Device Integration (Fitbit, Oura, Garmin) | 151 |
| | 8.2.3 Multi-Device Data Aggregation Framework | 152 |
| | 8.2.4 Home-Based Sleep Monitoring with Portable Devices | 153 |
| | 8.2.5 Expansion to Dubai Wellness Centers | 154 |
| | **REFERENCES** | **155** |
| | **APPENDIX A – SAMPLE CODE** | **160** |
| | A.1 Keycloak Service Implementation | 160 |
| | A.2 WebSocket Tunnel for Voice Streaming | 163 |
| | A.3 RAG Service Evidence Retrieval | 165 |
| | **APPENDIX B – PUBLICATION DETAILS** | **168** |

---

## Notes on Customization:

**I've tailored this TOC to showcase:**

1. **Your actual modules** - Each of the 6 implementation modules (Auth, Questionnaire, ML, RAG, Voice, Export/OCR) gets dedicated subsections

2. **Technical depth** - Specific patterns like `Promise.allSettled()`, BroadcastChannel API, JSONB storage, formula injection prevention

3. **Clinical partnerships** - St. John's Hospital mentioned throughout, not just in introduction

4. **Indian context** - 9 Indian languages, ISS/IIRS references, cultural validation

5. **Security emphasis** - PHI compliance, session enforcement, encryption detailed across multiple chapters

**Decisions for you to review:**

| Choice | Option A | Option B | Recommendation |
|--------|----------|----------|----------------|
| **Chapter 5 title** | "Methodology and Implementation" | "METHODOLOGY AND TESTING" | A - matches your actual work better |
| **ML Prediction chapter** | Separate chapter | Submodule under 5.3 | Submodule (as shown) - keeps focus on YOUR code |
| **Diagrams placement** | Chapter 4 (Design) | Appendix | Chapter 4 - shows design rigor |
| **Testing section** | Dedicated chapter | Submodule 5.7 | Submodule - testing supports implementation |

Let me know if you'd like to adjust any sections before I proceed with writing the full conten
