# Executive Summary

## DEVELOPMENT OF A CUSTOM SLEEP ASSESSMENT APPLICATION FOR SLEEP DISORDER PATIENTS AND ATHLETES

### Overview

Sleep disturbances represent a critical public health concern in India, with 59% of adults reporting fewer than six hours of nightly sleep. Despite rising prevalence of insomnia and Obstructive Sleep Apnea (OSA), clinical sleep laboratories remain critically overburdened, serving only emergency cases while athletes and the general population lack accessible screening tools. This project, developed in collaboration with St. John's Hospital Bangalore and the sports technology platform FanPlay, addresses this gap through India's first culturally validated, questionnaire-based sleep assessment system tailored for Indian demographics and athletic communities.

### Methodology

The system digitizes manual sleep laboratory workflows through a secure, three-tier web application. The architecture comprises: (1) a React.js frontend with responsive, mobile-first design; (2) an Express.js backend implementing JWT-based authentication and role-based access control; and (3) a PostgreSQL database storing questionnaire responses, PSG-derived hypnograms, and multi-device aggregated reports. Advanced modules include a FastAPI-based RAG service using ChromaDB for clinical explanations, Azure Speech Services with Gemini AI for voice-based data capture supporting nine Indian languages, and ML models trained on polysomnography datasets for automated sleep quality scoring.

### Key Findings

The custom St. John Sleep Questionnaire demonstrates improved cultural relevance over standardized instruments (PSQI, ESS) for Indian populations. Digital pre-screening enables physicians to triage patients effectively, optimizing limited bed capacity. The voice transcription module reduces manual data entry burden while maintaining clinical accuracy through LLM-powered normalization. PHI-compliant security measures including encryption, access controls, and single-device session enforcement protect sensitive patient data per HIPAA and GDPR standards.

### Conclusions

The platform successfully bridges sleep science with practical application, delivering a fully functional digital assessment tool ready for clinical pilot deployment at St. John's Hospital. Core modules including authentication, questionnaire management, ML prediction, RAG-based explanations, and voice transcription are operational. Future phases will address EDF file management, wearable device integration, and multi-device data aggregation. By combining clinical validation with modern software architecture, this work enables athletes to optimize performance through better sleep management while supporting broader healthcare deployment across India and Dubai.
