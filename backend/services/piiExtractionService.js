/**
 * PII Extraction and Redaction Service
 * Extracts personal identifiable information from OCR text and redacts it
 */

/**
 * Extract and redact PII from text
 * @param {string} text - The text to process
 * @returns {Object} - Object containing extracted PII, redacted text, and logs
 */
export function extractAndRedactPII(text) {
  const log = [];
  const pii = {
    names: [],
    dateOfBirth: null,
    age: null,
    profession: null,
  };

  let redactedText = text;
  let totalRedactions = 0;

  // Extract Patient Name
  const nameResult = extractName(redactedText);
  if (nameResult.found) {
    pii.names = nameResult.names;
    redactedText = nameResult.redactedText;
    totalRedactions += nameResult.redactionCount;
    log.push(`✓ NAME found: ${nameResult.names.join(', ')} (${nameResult.redactionCount} instances removed)`);
  } else {
    log.push('✗ NAME not found');
  }

  // Extract Date of Birth
  const dobResult = extractDateOfBirth(redactedText);
  if (dobResult.found) {
    pii.dateOfBirth = dobResult.dob;
    redactedText = dobResult.redactedText;
    totalRedactions += dobResult.redactionCount;
    log.push(`✓ DOB found: ${dobResult.dob} (${dobResult.redactionCount} instances removed)`);
  } else {
    log.push('✗ DOB not found');
  }

  // Extract Age
  const ageResult = extractAge(redactedText);
  if (ageResult.found) {
    pii.age = ageResult.age;
    redactedText = ageResult.redactedText;
    totalRedactions += ageResult.redactionCount;
    log.push(`✓ AGE found: ${ageResult.age} years (${ageResult.redactionCount} instances removed)`);
  } else {
    log.push('✗ AGE not found');
  }

  // Extract Profession (from Referring/Interpreting Physician fields)
  const professionResult = extractProfession(redactedText);
  if (professionResult.found) {
    pii.profession = professionResult.profession;
    redactedText = professionResult.redactedText;
    totalRedactions += professionResult.redactionCount;
    log.push(`✓ PROFESSION found: ${professionResult.profession} (${professionResult.redactionCount} instances removed)`);
  } else {
    log.push('✗ PROFESSION not found');
  }

  log.push('');
  log.push(`📊 Total redactions: ${totalRedactions}`);

  return {
    pii,
    redactedText,
    log,
    redactionCount: totalRedactions,
  };
}

/**
 * Extract patient name from text
 * Looks for patterns like "Patient Name:", "Name:", etc.
 */
function extractName(text) {
  const patterns = [
    /Patient\s+Name:\s*([A-Z][A-Za-z\s.'-]+?)(?=\s+Recording|Sex|Height|D\.O\.B|$|\n)/gi,
    /Name:\s*([A-Z][A-Za-z\s.'-]+?)(?=\s+Recording|Sex|Height|D\.O\.B|$|\n)/gi,
    /Patient:\s*([A-Z][A-Za-z\s.'-]+?)(?=\s+Recording|Sex|Height|D\.O\.B|$|\n)/gi,
  ];

  const names = [];
  let redactedText = text;
  let redactionCount = 0;

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern);
    while ((match = regex.exec(text)) !== null) {
      let name = match[1].trim();
      
      // Clean up the name
      name = name.replace(/\s+/g, ' ').trim();
      
      // Skip if it's too short or contains numbers
      if (name.length < 2 || /\d/.test(name)) continue;
      
      // Add to names array if not already present
      if (!names.includes(name)) {
        names.push(name);
      }
    }
  }

  // Redact all instances of found names
  if (names.length > 0) {
    names.forEach(name => {
      // Create a regex that matches the name with word boundaries
      const nameRegex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');
      const matches = redactedText.match(nameRegex);
      if (matches) {
        redactionCount += matches.length;
        redactedText = redactedText.replace(nameRegex, '[NAME REDACTED]');
      }
    });

    return { found: true, names, redactedText, redactionCount };
  }

  return { found: false, names: [], redactedText: text, redactionCount: 0 };
}

/**
 * Extract date of birth from text
 * Looks for patterns like "D.O.B:", "Date of Birth:", "DOB:", etc.
 */
function extractDateOfBirth(text) {
  const patterns = [
    /D\.O\.B\.?:\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /DOB\.?:\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /Date\s+of\s+Birth:\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /Birth\s+Date:\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
  ];

  let redactedText = text;
  let dob = null;
  let redactionCount = 0;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract the date part
      const dateMatch = match[0].match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
      if (dateMatch) {
        dob = dateMatch[1];
        
        // Redact all instances of this DOB
        const dobRegex = new RegExp(escapeRegex(dob), 'g');
        const matches = redactedText.match(dobRegex);
        if (matches) {
          redactionCount = matches.length;
          redactedText = redactedText.replace(dobRegex, '[DOB REDACTED]');
        }
        
        break;
      }
    }
  }

  if (dob) {
    return { found: true, dob, redactedText, redactionCount };
  }

  return { found: false, dob: null, redactedText: text, redactionCount: 0 };
}

/**
 * Extract age from text
 * Looks for patterns like "Age: 53 years", "Age: 53", etc.
 */
function extractAge(text) {
  const patterns = [
    /Age:\s*(\d{1,3})\s*years?/gi,
    /Age:\s*(\d{1,3})/gi,
    /(\d{1,3})\s*years?\s+old/gi,
  ];

  let redactedText = text;
  let age = null;
  let redactionCount = 0;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract the age number
      const ageMatch = match[0].match(/(\d{1,3})/);
      if (ageMatch) {
        const extractedAge = parseInt(ageMatch[1]);
        
        // Validate age (reasonable range)
        if (extractedAge > 0 && extractedAge < 150) {
          age = extractedAge;
          
          // Redact the full age expressions
          const agePatterns = [
            new RegExp(`Age:\\s*${age}\\s*years?`, 'gi'),
            new RegExp(`${age}\\s*years?\\s+old`, 'gi'),
            new RegExp(`Age:\\s*${age}(?!\\d)`, 'gi'),
          ];
          
          agePatterns.forEach(agePattern => {
            const matches = redactedText.match(agePattern);
            if (matches) {
              redactionCount += matches.length;
              redactedText = redactedText.replace(agePattern, '[AGE REDACTED]');
            }
          });
          
          break;
        }
      }
    }
  }

  if (age !== null) {
    return { found: true, age, redactedText, redactionCount };
  }

  return { found: false, age: null, redactedText: text, redactionCount: 0 };
}

/**
 * Extract profession from text
 * Looks for common professional titles and occupations
 */
function extractProfession(text) {
  // Professional titles and keywords
  const professionPatterns = [
    /Profession:\s*([A-Za-z\s]+?)(?=\s+[A-Z]|$|\n)/gi,
    /Occupation:\s*([A-Za-z\s]+?)(?=\s+[A-Z]|$|\n)/gi,
    /Job\s+Title:\s*([A-Za-z\s]+?)(?=\s+[A-Z]|$|\n)/gi,
    /Employment:\s*([A-Za-z\s]+?)(?=\s+[A-Z]|$|\n)/gi,
  ];

  // Common professions that might appear in medical records
  const commonProfessions = [
    'Doctor', 'Physician', 'Surgeon', 'Nurse', 'Teacher', 'Engineer',
    'Lawyer', 'Accountant', 'Manager', 'Director', 'Consultant',
    'Technician', 'Administrator', 'Executive', 'Analyst', 'Developer',
    'Designer', 'Architect', 'Professor', 'Scientist', 'Researcher',
  ];

  let redactedText = text;
  let profession = null;
  let redactionCount = 0;

  // First try explicit profession fields
  for (const pattern of professionPatterns) {
    const match = text.match(pattern);
    if (match) {
      profession = match[1].trim();
      break;
    }
  }

  // If not found, look for common profession keywords
  if (!profession) {
    for (const prof of commonProfessions) {
      const profRegex = new RegExp(`\\b${prof}\\b`, 'i');
      if (profRegex.test(text)) {
        profession = prof;
        break;
      }
    }
  }

  // Redact profession instances
  if (profession) {
    const professionRegex = new RegExp(`\\b${escapeRegex(profession)}\\b`, 'gi');
    const matches = redactedText.match(professionRegex);
    if (matches) {
      redactionCount = matches.length;
      redactedText = redactedText.replace(professionRegex, '[PROFESSION REDACTED]');
    }

    return { found: true, profession, redactedText, redactionCount };
  }

  return { found: false, profession: null, redactedText: text, redactionCount: 0 };
}

/**
 * Helper function to escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format PII data for display/storage
 */
export function formatPIIData(pii) {
  const formatted = {};

  if (pii.names && pii.names.length > 0) {
    formatted.names = pii.names;
  }

  if (pii.dateOfBirth) {
    formatted.dateOfBirth = pii.dateOfBirth;
  }

  if (pii.age !== null) {
    formatted.age = pii.age;
  }

  if (pii.profession) {
    formatted.profession = pii.profession;
  }

  return formatted;
}

/**
 * Validate if text contains potential PII
 */
export function containsPII(text) {
  // Quick check for common PII patterns
  const piiPatterns = [
    /Patient\s+Name:/i,
    /D\.O\.B\.?:/i,
    /Age:\s*\d+/i,
    /Date\s+of\s+Birth:/i,
  ];

  return piiPatterns.some(pattern => pattern.test(text));
}

export default {
  extractAndRedactPII,
  formatPIIData,
  containsPII,
};
