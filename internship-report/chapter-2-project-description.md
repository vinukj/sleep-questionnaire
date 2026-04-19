# CHAPTER 2

# PROJECT DESCRIPTION AND GOALS

## 2.1 LITERATURE REVIEW

### 2.1.1 Sleep Questionnaires and Validation Frameworks

Sleep assessment relies heavily on standardized questionnaires to quantify subjective experiences of sleep quality and daytime sleepiness. Tools such as the Pittsburgh Sleep Quality Index (PSQI) [1] and the Epworth Sleepiness Scale (ESS) [2] have long been established as benchmarks for evaluating sleep disturbances and their impact on daily functioning. The PSQI has demonstrated strong internal consistency and reliability across diverse adult populations [3], while the ESS has been extensively used to measure subjective sleepiness. However, meta-analyses and validation studies indicate that these instruments have limitations, particularly in distinguishing subtle variations in sleep quality in populations with specific lifestyle or cultural characteristics [4][5]. Critiques highlight that both PSQI and ESS may underperform when applied to low-risk or non-Western populations, emphasizing the need for context-specific adaptation [6][7]. Moreover, studies comparing questionnaire outcomes with polysomnography (PSG) confirm that subjective measures alone cannot reliably capture detailed sleep architecture or sleep disorders, such as insomnia or obstructive sleep apnea (OSA) [8][9]. These observations motivate the development of hybrid approaches that integrate validated questionnaires with objective data for enhanced scoring accuracy.

### 2.1.2 Indian Adaptations and Cultural Context

In the Indian context, sleep patterns and disturbances differ significantly from Western populations due to sociocultural, dietary, and lifestyle factors. Recognizing this, researchers have developed India-specific instruments such as the Indian Sleepiness Scale (ISS) [10] and the Indian Insomnia Rating Scale (IIRS) [11]. These instruments address local nuances, including language preferences, sleep schedules, and socio-environmental factors. For instance, the modified Hindi version of the ESS (ESS-I) has demonstrated improved cultural relevance and psychometric reliability among North Indian populations [12]. Surveys also highlight the high prevalence of insufficient sleep in India, with 59% of adults reporting fewer than six hours of sleep per night [13], underscoring the pressing need for effective screening tools. Despite these efforts, current Indian tools are still largely validated in small clinical cohorts, and few address the needs of athletes or integrate with modern digital platforms.

### 2.1.3 Athlete-Specific Sleep Assessment

Athletes face unique sleep challenges, including irregular schedules, travel across time zones, and intensive training regimens, which impact both recovery and performance. Specialized instruments such as the Athlete Sleep Screening Questionnaire (ASSQ) [14] and the Athlete Sleep Behavior Questionnaire (ASBQ) [15] have been developed to capture behaviors specific to athletes, such as pre-competition arousal, training load, and recovery quality. Clinical validation studies confirm that these questionnaires are effective in identifying sleep disruptions that standard tools might overlook [16]. However, these instruments have not been systematically adapted or validated for Indian athletes. This gap reinforces the need for a culturally sensitive athlete sleep questionnaire (ASDQ) that can accommodate regional dietary habits, lifestyle differences, and local training conditions, while remaining compatible with objective sleep measurement tools.

### 2.1.4 Machine Learning for OSA Prediction

Recent advances in machine learning have enabled more accurate prediction of Obstructive Sleep Apnea (OSA) risk using questionnaire-based inputs. A comprehensive 2025 systematic review by Giorgi et al. analyzed 65 studies involving over 109,000 patients and found that AI algorithms demonstrated accuracy, sensitivity, and specificity often exceeding traditional screening tools like STOP-Bang [17]. Key findings include:

- Anthropometric features (age, BMI, neck circumference) combined with logistic regression achieved AUC scores of 0.81-0.89
- Deep learning models (DANet, GATE) showed marginal improvements over ensemble methods (LGBM, XGBoost) with binary classification accuracy reaching 87.18% [18]
- Sequential ML approaches combining questionnaires with pulse oximetry achieved F1-scores of 0.86, significantly outperforming STOP-Bang in East Asian populations (AUC 0.86 vs 0.56) [19]
- Simple parameter models using age, gender, BMI, and mean heart rate during sleep achieved AUROC of 80.4% using Artificial Neural Networks [20]

However, challenges remain: data imbalance (severe OSA over-representation), lack of external validation across diverse populations, and limited clinical implementation. Most models lack generalizability beyond single-center, single-ethnicity datasets, highlighting the need for culturally adapted training data.

### 2.1.5 RAG Systems in Clinical Decision Support

Retrieval-Augmented Generation (RAG) has emerged as a promising architecture for clinical decision support, combining large language models with evidence retrieval from trusted sources. Recent systematic reviews provide key insights:

Performance Evidence:
- Liu et al. (2025) reviewed 20 studies and found RAG implementation showed a 1.35 odds ratio increase in performance compared to baseline LLMs (95% CI: 1.19-1.53, P=.001) [21]
- Miao et al. (2025) reviewed 67 studies, categorizing RAG architectures into: Text-based (54%), Knowledge graph-enhanced (25%), Agentic (9%), Multimodal (3%), and Plug-and-play (9%) [22]
- Amugongo et al. (2025) reviewed 70 studies, noting that 78.9% used English datasets and proprietary models (GPT-3.5/4) dominated despite privacy concerns [23]

Clinical Development Guidelines (GUIDE-RAG Framework):
- Naive RAG suitable for patient education (low latency requirement)
- Advanced RAG (hybrid sparse+dense retrieval) recommended for real-time CDSS requiring precision
- Modular/Agentic RAG for complex diagnostic reasoning, though latency exceeds 10 seconds
- Key challenges: Hallucination persists even with RAG, citation hallucination is a unique failure mode, and most systems lack EHR integration [21][23]

Privacy Considerations:
The "Biomedical RAG Trilemma" formalizes three competing constraints [24]:
1. Reasoning Depth vs. Latency - Modular systems have highest accuracy but >10s response times
2. Privacy vs. Capability - Cloud APIs offer superior reasoning but pose data residency risks
3. Precision vs. Recall - Hybrid retrieval needed for patient safety

These findings support the use of local embeddings and on-premise vector stores (ChromaDB) for PHI-sensitive applications, as implemented in this project.

### 2.1.6 Voice-to-Text AI for Healthcare Documentation

AI-powered speech recognition has transformed clinical documentation, with recent benchmarks demonstrating near-human accuracy in controlled settings:

Performance Benchmarks (2024-2025):
| Model | Accuracy | Word Error Rate (WER) | Keyword Error Rate (KER) |
|-------|----------|----------------------|-------------------------|
| Speechmatics Medical | 93% | 7.27% | 4.01% |
| Google Gemini 2.5 Pro | ~92% | 8.15% | N/A |
| Deepgram Nova-3 Medical | ~91% | 8.88% | 9.74% |
| NVIDIA Parakeet TDT 0.6B v3 | ~91% | 9.35% | N/A |

Key Research Findings:
- Speechmatics (2025) achieved 93% general accuracy with 96% medical keyword recall and real-time speaker diarization [25]
- Omi Health benchmark (2026) tested 31 models on 57 simulated GP consultations: Google Gemini 2.5 Pro led at 8.15% WER, while Google MedASR scored worst (62.5% WER) - optimized for dictation, not conversations [26]
- BMC Medical Informatics systematic review (2025) analyzed 29 studies: WER ranged from 0.087% (controlled dictation) to over 50% (conversational/multi-speaker) [27]

Clinical Impact:
- NEJM Catalyst study (2025) tracked 7,000+ physicians using AI scribes across 2.6M encounters: 15,700 hours of documentation time saved, 84% reported improved patient interactions, 82% reported better job satisfaction [27]

Challenges for Indian Context:
- Significant accuracy degradation with non-native speakers and diverse accents
- Multi-speaker diarization remains challenging in noisy clinical environments
- Need for phrase list boosting to handle clinical vocabulary and Indian language code-switching

These findings support the selection of Azure Speech Services with custom phrase lists and speaker diarization for the voice capture module.

### 2.1.7 Integration of Objective Data: PSG and Wearables

Polysomnography remains the gold standard for objective sleep assessment, providing detailed data on sleep stages, continuity, and disturbances [28]. Publicly available datasets such as Sleep-EDF [29] offer open-access PSG recordings in EDF format, enabling algorithm development and scoring validation. Handling these datasets requires careful attention to data storage standards, as highlighted in works addressing EDF+ technical specifications and metadata harmonization [30][31]. To extend objective monitoring outside sleep laboratories, wrist-worn and wearable devices have been increasingly validated against PSG [32][33][34]. Systematic studies demonstrate that while consumer wearables can capture sleep duration and basic architecture with reasonable accuracy, they often overestimate sleep and underestimate wake periods, requiring calibration or algorithmic correction [35][36]. Multi-device aggregation and epoch-by-epoch validation frameworks help mitigate these biases and enable longitudinal tracking, particularly valuable for athletes and general users engaging in remote monitoring [37]. Integrating wearable and PSG data with validated questionnaires forms the foundation for machine learning models that can generate reliable sleep scores in diverse populations [38][39].

### 2.1.8 Data Security, PHI Management, and Digital Transformation

The digitization of sleep assessment tools and storage of physiological data necessitate robust security and compliance frameworks. Storing raw PSG recordings, questionnaire responses, and wearable outputs involves handling sensitive personal health information (PHI). Best practices for PHI protection include encryption at rest and in transit, access controls, and adherence to regulatory standards such as HIPAA, GDPR, and India's DPDP legislation [40][41]. Emerging guidance also emphasizes frontend protections against DOM-based XSS attacks, particularly when web applications manage JWT tokens and other authentication credentials [42]. Interoperable storage formats and metadata standards, including EDF+ and harmonized PSG data schemas, ensure long-term usability and facilitate cross-device and cross-laboratory analysis [43]. The shift from manual, paper-based storage to cloud-based, secure platforms reduces errors, supports pre-screening before hospital visits, and enables scalable deployment for both general users and athletes.

## 2.2 RESEARCH GAP

Despite extensive literature and technological advances, several critical gaps remain:

1. Absence of Indian Athlete-Specific Sleep Questionnaire
No widely adopted, culturally validated sleep questionnaire exists specifically for Indian athletes. Current tools (ASSQ, ASBQ) developed for Western athletic populations lack validation in Indian contexts, where dietary habits, training conditions, and cultural sleep practices differ significantly.

2. Lack of Integrated Subjective-Objective Data Systems
Existing systems rarely integrate subjective questionnaire data with objective PSG/wearable measurements in a unified platform. This fragmentation limits the potential for hybrid machine learning scoring and prevents clinicians from correlating patient-reported symptoms with physiological evidence.

3. Manual Data Management in Indian Sleep Laboratories
Sleep laboratories in India continue to rely on paper-based questionnaires, manual transcription, and fragmented digital records. This workflow introduces errors, delays risk assessment, and creates barriers to data aggregation for research and quality improvement.

4. Limited RAG Adoption in Indian Clinical Settings
Despite evidence that RAG systems improve LLM performance in biomedical applications (OR 1.35), no RAG-based clinical decision support system has been deployed in Indian sleep medicine contexts with local guideline integration.

5. Voice Documentation Barriers for Indian Languages
While AI speech recognition has achieved 93% accuracy in English medical contexts, support for Indian languages (Hindi, Tamil, Telugu, etc.) with speaker diarization remains limited, creating documentation burdens in multilingual clinical environments.

6. Remote/Wearable Monitoring Underexplored in India
Despite evidence that lab-based PSG can disrupt natural sleep patterns, remote monitoring using wearables remains underexplored in Indian populations, limiting ecological validity and longitudinal tracking capabilities.

7. Secure Multi-Device PHI Aggregation
Few systems incorporate secure, centralized PHI storage with multi-device data aggregation, which is essential for longitudinal monitoring and clinical decision support in accordance with India's DPDP Act requirements.

Addressing these gaps motivates the development of a digitized, culturally sensitive, athlete-aware sleep assessment platform that combines questionnaires, ML prediction, RAG-based decision support, voice documentation, and PSG/wearable data integration while maintaining strong security and compliance standards.

## 2.3 OBJECTIVES

The objectives of this project are:

1. Develop a culturally relevant sleep assessment tool for Indian populations
   - Design and validate a custom questionnaire that reflects local social, dietary, and lifestyle factors affecting sleep
   - Include athlete-specific adaptations addressing training schedules, travel, and competition-related sleep disruptions

2. Digitize sleep assessment and data storage
   - Transition manual sleep questionnaires and PSG-derived data into a secure, centralized web application
   - Enable storage of raw physiological data in EDF format and expert-scored hypnograms
   - Implement responsive, mobile-first interface for real-world usability

3. Implement ML-based OSA risk prediction
   - Integrate a machine learning prediction service using questionnaire and anthropometric data
   - Support early identification of potential sleep disorders in both athletes and general populations
   - Implement graceful degradation to ensure core functionality during service failures

4. Deploy RAG-based clinical decision support
   - Ingest clinical guidelines and research articles into a ChromaDB vector store with local embeddings
   - Generate evidence-based explanations for risk scores with cited references
   - Ensure PHI remains within institutional boundaries through on-premise deployment

5. Enable real-time voice documentation
   - Implement Azure Speech Services integration with speaker diarization for clinician-patient conversations
   - Support multi-language detection for 9 Indian languages (Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi)
   - Extract structured clinical findings (chief complaints, history, assessment) using Gemini AI

6. Enable multi-device data aggregation
   - Collect, standardize, and store sleep data from multiple independent wearable or clinical devices for unified access and analysis
   - Implement epoch-by-epoch validation frameworks for wearable vs. PSG comparison

7. Ensure secure handling of Personal Health Information (PHI)
   - Implement encryption at rest (AES-256) and in transit (TLS 1.3)
   - Enforce single-device session management with Keycloak OIDC authentication
   - Implement audit logging and access controls in accordance with HIPAA, GDPR, and Indian DPDP Act

8. Facilitate clinician and user accessibility
   - Provide role-based access for hospital staff, administrators, and patients
   - Enable data export in Excel/CSV with formula injection prevention for offline analysis
   - Support search, filtering, and pagination for efficient patient record management

9. Lay groundwork for future enhancements
   - Architect for integration with portable sleep monitoring devices and wearable technology (Fitbit, Oura, Garmin)
   - Design multi-tenant deployment capability for expansion to partner wellness centers
   - Investigate AI-driven insights while maintaining privacy and patient consent compliance

## 2.4 PROBLEM STATEMENT

Despite growing recognition of sleep as a critical factor affecting health and athletic performance, significant challenges persist globally and in India. Sleep disorders and deprivation, including insomnia and obstructive sleep apnea, are highly prevalent but remain underdiagnosed, especially among athletes. Traditional sleep laboratory resources are often overburdened and prioritize urgent clinical cases, limiting timely access for athletes and the general population.

Assessment Tool Limitations:
Existing sleep assessment tools such as the Epworth Sleepiness Scale (ESS) and Pittsburgh Sleep Quality Index (PSQI) are limited by their failure to incorporate cultural, lifestyle, and athlete-specific factors relevant to the Indian population. Additionally, many questionnaires lack validation against the polysomnography (PSG) gold standard, reducing their diagnostic reliability. Machine learning approaches show promise (AUC 0.80-0.87) but suffer from limited external validation in diverse Indian populations.

Clinical Workflow Inefficiencies:
Sleep-related data management remains fragmented and manual, spread across paper forms, local digital files, and proprietary device formats. Clinicians lack decision support tools during patient encounters, relying on individual experience rather than evidence-based guidelines. Voice documentation requires 48-72 hour transcription turnaround, delaying billing and care coordination. This situation hampers longitudinal tracking, systematic analysis, and the application of machine-learning approaches to improve scoring accuracy.

Technology Gaps:
- No RAG-based clinical decision support deployed in Indian sleep medicine despite evidence of 1.35x performance improvement
- Voice transcription systems lack Indian language support with speaker diarization for clinical conversations
- ML prediction services exist but lack integration with questionnaire systems and graceful degradation patterns
- Secure, centralized PHI storage with multi-device aggregation remains unavailable in Indian sleep laboratories

Security and Compliance Needs:
There is a pressing need for secure, centralized, and scalable digital infrastructure that adheres to patient health information privacy standards including India's DPDP Act, HIPAA, and GDPR. Frontend protections against XSS attacks, encryption at rest and in transit, and audit logging are essential for PHI compliance.

Resource Optimization Imperative:
Clinicians require effective pre-screening and triage tools to optimize sleep lab bed occupancy and resource allocation. Digital engagement prior to clinical visits improves patient investment and reduces no-show rates, while automated scoring enables prioritized scheduling of high-risk patients.

This problem necessitates the development of:
- Culturally adapted screening tools validated against PSG data
- ML prediction services with graceful degradation
- RAG-based decision support with local guideline integration
- Voice documentation with Indian language support
- A secure digital ecosystem that supports data aggregation, machine-learning-enhanced diagnostics, and optimized clinical workflows catering to both general population and athletes

This synthesis reflects the high prevalence of sleep issues among Indian athletes and the general population, technological and infrastructural gaps, and the urgent clinical needs that must be addressed to improve sleep health outcomes and athletic performance.

## 2.5 PROJECT PLAN

### 2.5.1 Gantt Chart and Timeline

The project is structured across five phases over a 16-week implementation period:

| Phase | Duration | Weeks | Key Activities |
|-------|----------|-------|----------------|
| Phase 1: Requirements & Analysis | 2 weeks | 1-2 | Literature review, gap analysis, requirements specification, system architecture design |
| Phase 2: Questionnaire Design & Validation | 3 weeks | 3-5 | Custom questionnaire design, expert validation at St. John's, schema finalization |
| Phase 3: Backend & Core Services | 5 weeks | 6-10 | Database schema, authentication (Keycloak), ML prediction integration, RAG service, voice service |
| Phase 4: Frontend & Integration | 4 weeks | 11-14 | React frontend, admin dashboard, data visualization, Excel export, OCR processing |
| Phase 5: Testing & Deployment | 2 weeks | 15-16 | Unit/integration testing, security testing, VPS deployment, pilot evaluation |

Key Milestones:
- Week 2: Requirements specification document approved
- Week 5: Questionnaire validated by St. John's experts
- Week 8: Backend API with authentication and questionnaire submission operational
- Week 10: ML and RAG services integrated with graceful degradation
- Week 12: Voice capture service with speaker diarization functional
- Week 14: Frontend complete with admin dashboard and export features
- Week 16: Production deployment and pilot evaluation report

### 2.5.2 Milestones and Deliverables

Phase 1 Deliverables:
- Requirements specification document (functional and non-functional requirements)
- System architecture diagram (four-service microservices architecture)
- Literature review compilation with 40+ references

Phase 2 Deliverables:
- Finalized questionnaire schema with conditional logic (dependsOn relationships)
- Validation report with expert feedback from St. John's clinicians
- Athlete-specific module with training load and travel-related questions

Phase 3 Deliverables:
- PostgreSQL database with JSONB storage for responses and schemas
- Keycloak OIDC authentication with single-device session enforcement
- ML prediction service integration (Python/FastAPI) with payload normalization
- RAG service with ChromaDB vector store and local embeddings
- Voice capture service with Azure Speech Services and speaker diarization
- PHI compliance: encryption at rest, TLS 1.3, audit logging

Phase 4 Deliverables:
- React.js responsive frontend with mobile-first design
- Admin dashboard with search, filtering, and pagination
- Questionnaire interface with conditional rendering and auto-save
- Voice capture UI with real-time transcription display
- Excel export with formula injection prevention
- OCR processing for paper record digitization

Phase 5 Deliverables:
- Deployed web application on VPS with PM2 process management
- Testing report (unit, integration, security, load testing)
- Pilot evaluation feedback from St. John's clinicians
- Documentation: API docs (Swagger), user manual, deployment guide

---

## REFERENCES (Chapter 2)

[1] Beaudreau S et al. Validation of the Pittsburgh Sleep Quality Index (PSQI). Journal. Available: PMC.

[2] Bhaskar S et al. Prevalence of chronic insomnia in adult patients (India). Journal. Available: PMC.

[3] Beaudreau S; Wang J. PSQI reliability & critique (review/meta). J. Clin. Sleep Med.

[4] Krishnaswamy UM. Development and evaluation of the Indian Sleepiness Scale (ISS). Journal, 2024. PubMed.

[5] Bhatia A; Maheswari S et al. Indian Insomnia Rating Scale (IIRS) — development & validation. Thesis/Report. ProQuest.

[6] Bajpai G et al. Validation of a modified Hindi Epworth Sleepiness Scale (ESS-I). Journal. Available: PMC.

[7] Aurora GK. Validity of sleep disorder screening questionnaires in India. Indian J. Sleep Med., 2013.

[8] Pereira EJ et al. Combining questionnaires and level III testing for OSA diagnosis. Journal. PMC.

[9] Chibante FO et al. Questionnaire vs PSG evaluation (2024). Journal, 2024. PubMed.

[10] Samuels C et al. Athlete Sleep Screening Questionnaire (ASSQ) — clinical validation. Sports Med. Open, 2018.

[11] Driller MW et al. Athlete Sleep Behavior Questionnaire (ASBQ). Journal, 2018. PMC.

[12] Bender AM et al. Clinical validation of ASSQ. Journal. PMC.

[13] Gelaye B et al. Construct validity & factor structure of PSQI/ESS (multi-country). PLOS One.

[14] Nishiyama T et al. Criterion validity of PSQI & ESS vs PSG. ScienceDirect.

[15] Storti LJ et al. Validation of a sleep-quality questionnaire with PSG (CCU patients). Journal, 2015.

[16] PhysioNet. Sleep-EDF Database / Sleep-EDFx. PhysioNet.

[17] Giorgi et al. Enhanced machine learning approaches for OSA patient screening. Scientific Reports, 2024. Nature.

[18] Chi et al. Obstructive Sleep Apnea Prediction: A Comprehensive Review and Comparative Study. Machine Learning, 2026. Springer.

[19] Kuo et al. Efficient Screening in OSA Using Sequential ML Models, Questionnaires, and Pulse Oximetry Signals. JMIR, 2024.

[20] Dai et al. Enhanced machine learning approaches for OSA patient screening. Scientific Reports, 2024. Nature.

[21] Liu et al. Improving large language model applications in biomedicine with retrieval-augmented generation: a systematic review, meta-analysis, and clinical development guidelines. JAMIA, 2025. PMC.

[22] Miao et al. Improving Large Language Model Applications in the Medical and Nursing Domains With Retrieval-Augmented Generation: Scoping Review. JMIR, 2025.

[23] Amugongo et al. Retrieval augmented generation for large language models in healthcare: A systematic review. PLOS Digital Health, 2025.

[24] He et al. Retrieval-Augmented Generation in Biomedicine: A Survey of Technologies, Datasets, and Clinical Applications. arXiv, 2025.

[25] Speechmatics. Speechmatics sets record in medical Speech-to-Text with 93% accuracy. 2025.

[26] Omi Health. Benchmarking Speech-to-Text Models for Long-Form Medical Dialogue. 2026.

[27] BMC Medical Informatics and Decision Making. Evaluating the performance of artificial intelligence-based speech recognition for clinical documentation: a systematic review. 2025. Springer.

[28] AASM Manual for the Scoring of Sleep and Associated Events. AASM.

[29] PhysioNet / Sleep-EDF (Montreal archive). PhysioNet.

[30] Kemp B. EDF and EDF+ format resources. EDF Plus docs.

[31] Huttunen R et al. Harmonized formats for PSG storage. arXiv, 2024.

[32] Nguyen QTN et al. Validation framework for sleep stage scoring in wearables. Journal, 2021. PMC.

[33] Lee T et al. Accuracy of 11 wearables/nearables vs PSG (2023). Journal, 2023. PMC.

[34] Schyvens AM et al. Performance validation of six wrist wearables. Sleep, 2025. OUP.

[35] Lee T et al. Accuracy of 11 devices (2023). PMC, 2023.

[36] Schyvens et al. Fitbit, Garmin, WHOOP accuracy study. JMIR mHealth uHealth, 2024.

[37] Guo J et al. Wrist-worn device vs PSG validity (2025). Journal, 2025. PMC.

[38] De Gans CJ. EEG-based wearables review. ScienceDirect, 2024.

[39] Nosetti L et al. Prioritising PSG in children—wait times and triage. MDPI, 2024.

[40] HIPAA / GDPR guidance papers.

[41] India DPDP Act, 2023.

[42] MDN / W3C. Trusted Types / CSP guidance. Web Docs.

[43] Kemp B. EDF supports video + technical notes. PMC, 2013.
