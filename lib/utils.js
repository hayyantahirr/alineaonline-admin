/**
 * Helper utility to format lowercase subject strings into clean Title Case for UI display.
 * e.g. "computer science" -> "Computer Science", "a-level" -> "A-Level", "physics" -> "Physics"
 */
export function formatSubjectTitle(str) {
  if (!str || typeof str !== "string") return "";
  
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      // Handle hyphenated terms like "o-level", "as-level", "a-level"
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) => {
            const lower = part.toLowerCase();
            if (["igcse", "caie", "aqa", "ocr", "wjec", "ib", "cie"].includes(lower)) {
              return lower.toUpperCase();
            }
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join("-");
      }

      const lower = word.toLowerCase();
      // Acronyms uppercase
      if (["igcse", "caie", "aqa", "ocr", "wjec", "ib", "cie", "ict", "sat", "act"].includes(lower)) {
        return lower.toUpperCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
