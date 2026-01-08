import { useCallback, useEffect } from "react";
import DOMPurify from "dompurify";

export const MAX_TEXT_LENGTH = 1000;
export const MAX_TEXTAREA_LENGTH = 2000;

export function useSanitizeInput() {
  return useCallback((value, type = "text") => {
    if (typeof value !== "string") return value;
    let sanitized = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    switch (type) {
      case "email":
        sanitized = sanitized.toLowerCase().trim();
        break;
      case "tel":
        // eslint-disable-next-line no-control-regex
        sanitized = sanitized.replace(/[^\x00-\x7F0-9+\-\s()]/g, "");
        break;
      case "number":
        // eslint-disable-next-line no-control-regex
        sanitized = sanitized.replace(/[^\x00-\x7F0-9.-]/g, "");
        break;
      case "textarea":
        if (sanitized.length > MAX_TEXTAREA_LENGTH) {
          sanitized = sanitized.substring(0, MAX_TEXTAREA_LENGTH);
        }
        break;
      default:
        if (sanitized.length > MAX_TEXT_LENGTH) {
          sanitized = sanitized.substring(0, MAX_TEXT_LENGTH);
        }
    }
    return sanitized;
  }, []);
}

export function useCalculatedFields(currentPage, formData, handleAnswerChange) {
  useEffect(() => {
    const updateCalculatedFields = () => {
      currentPage.questions.forEach((question) => {
        if (question.calculated && Array.isArray(question.dependsOn) && question.formula) {
          const dependencies = question.dependsOn;
          const values = {};
          let canCalculate = true;
          dependencies.forEach((depId) => {
            const numeric = Number(formData[depId]);
            if (numeric === 0 || Number.isNaN(numeric)) {
              if (formData[depId] === undefined || formData[depId] === null || formData[depId] === "") {
                canCalculate = false;
              }
            }
            values[depId] = numeric;
          });
          if (canCalculate) {
            try {
              const calculate = new Function(...dependencies, `return ${question.formula}`);
              const result = calculate(...dependencies.map((dep) => values[dep]));
              const roundedResult = Math.round(result * 100) / 100;
              const currentValue = formData[question.id];
              if (currentValue === undefined || String(currentValue) !== String(roundedResult)) {
                handleAnswerChange(question.id, String(roundedResult));
              }
            } catch {
              // Calculation error - silently ignore
            }
          }
        }
      });
    };
    const debouncedUpdate = setTimeout(updateCalculatedFields, 100);
    return () => clearTimeout(debouncedUpdate);
  }, [currentPage, formData, handleAnswerChange]);
}
