import axios from "axios";
import {
  JUDGE0_HEADERS,
  JUDGE0_URL,
} from "../controllers/submissionController.js";

// Helper function to map language to Judge0 language ID
export const getLanguageId = (language) => {
  switch (language) {
    case "cpp":
      return 54; // Judge0 language ID for C++
    case "java":
      return 62; // Judge0 language ID for Java
    case "python":
      return 71; // Judge0 language ID for Python
    case "javascript":
      return 63; // Judge0 language ID for JavaScript
    default:
      return 54; // Default to C++
  }
};

export // Helper function to poll Judge0 API for the result
const pollJudge0Result = async (submissionId) => {
  let result;
  do {
    result = await axios.get(
      `${JUDGE0_URL}/submissions/${submissionId}?base64_encoded=true`,
      {
        headers: JUDGE0_HEADERS,
      }
    );
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second
  } while (result.data.status.id <= 2); // Status 3 means finished

  // If the response contains base64 encoded data, decode it
  if (result.data.stdout) {
    result.data.stdout = Buffer.from(result.data.stdout, "base64").toString();
  }
  if (result.data.stderr) {
    result.data.stderr = Buffer.from(result.data.stderr, "base64").toString();
  }

  return result.data;
};

/**
 * Process compilation error output and format it for client response
 * @param {Object} result - The Judge0 API result
 * @param {Array} errorInfo - Array of parsed error information
 * @returns {Object} Formatted error response
 */
export const processCompilationError = (result, errorInfo) => {
  let simplified_output = "";

  if (result.compile_output) {
    const fullOutput = result.compile_output;

    // Find the position of the first newline
    const firstNewlinePos = fullOutput.indexOf("\n");

    if (firstNewlinePos !== -1) {
      // Find position of second newline (starting search after first newline)
      const secondNewlinePos = fullOutput.indexOf("\n", firstNewlinePos + 1);

      if (secondNewlinePos !== -1) {
        // Extract from beginning up to and including the second newline
        simplified_output = fullOutput.substring(0, secondNewlinePos + 1);
      } else {
        // If there's no second newline, just use everything
        simplified_output = fullOutput;
      }
    } else {
      // If no newlines at all, use the entire output
      simplified_output = fullOutput;
    }

    // Clean up the output
    simplified_output = simplified_output
      .replace(/main\.cpp:/g, "") // Remove "main.cpp:" prefix
      .replace(/\n$/g, "") // Remove trailing newline if present
      .replace(/^\s+/g, "") // Remove leading spaces at the beginning
      .replace(/\n\s+/g, "\n") // Remove leading spaces after newlines
      .replace(/:\n/g, ": "); // Replace ":\n" with ": " to remove newline after colon
  }

  // Modify error info to clean up the file field
  let cleanErrorInfo = null;
  if (errorInfo && errorInfo.length > 0) {
    cleanErrorInfo = [{ ...errorInfo[0] }]; // Clone the first error

    // Clean up the file field if it has "\nmain.cpp"
    if (cleanErrorInfo[0].file) {
      cleanErrorInfo[0].file = cleanErrorInfo[0].file.replace(
        /\nmain\.cpp/g,
        "main.cpp"
      );
    }
  }

  return {
    error: result.status.description,
    stderr: result.stderr,
    compile_output: simplified_output,
    errorInfo: cleanErrorInfo,
  };
};

/**
 * Parse compilation error output to extract error positions
 * @param {string} compileOutput - The compilation error output from Judge0
 * @param {string} language - The programming language
 * @returns {Array} Array of error objects with position information
 */
export const parseErrorPosition = (compileOutput, language) => {
  if (!compileOutput) return null;

  const errors = [];

  if (language === "cpp" || language === "c") {
    // C/C++ error format: file:line:column: error: message
    const regex = /([^:]+):(\d+):(\d+):\s*(error|warning):\s*(.*)/g;
    let match;

    while ((match = regex.exec(compileOutput)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        type: match[4],
        message: match[5].trim(),
      });
    }
  } else if (language === "java") {
    // Java error format: file:line: error: message
    const regex = /([^:]+):(\d+):\s*(error|warning):\s*(.*)/g;
    let match;

    while ((match = regex.exec(compileOutput)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        type: match[3],
        message: match[4].trim(),
      });
    }
  } else if (language === "python") {
    // Python error format:
    // For syntax errors: File "file", line X
    // For runtime errors in traceback: File "file", line X, in <module>
    const syntaxRegex =
      /File\s+"([^"]+)",\s+line\s+(\d+)(?:,\s+in\s+(\w+))?(.*)/g;
    let match;

    while ((match = syntaxRegex.exec(compileOutput)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        function: match[3] || null,
        message: match[4].trim(),
      });
    }
  } else if (language === "javascript") {
    // JavaScript error format is varied depending on execution environment
    // Common Node.js format: path/to/file.js:line:column
    const regex = /([^:]+):(\d+):(\d+)(?:\s*-\s*(.*))?/g;
    let match;

    while ((match = regex.exec(compileOutput)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[4] ? match[4].trim() : null,
      });
    }
  }

  // Extract code snippet around error if available
  // Many compilers show the line of code and point to the error with ^
  const snippetRegex = /\n(.+)\n\s*(\^+)/g;
  let snippetMatch;

  while ((snippetMatch = snippetRegex.exec(compileOutput)) !== null) {
    const codeSnippet = snippetMatch[1];
    const pointerLength = snippetMatch[2].length;
    const pointerStart =
      snippetMatch[0].indexOf("^") -
      snippetMatch[0].lastIndexOf("\n", snippetMatch[0].indexOf("^")) -
      1;

    // Associate snippet with the closest error before it
    if (errors.length > 0) {
      const lastError = errors[errors.length - 1];
      lastError.codeSnippet = codeSnippet;
      lastError.pointerStart = pointerStart;
      lastError.pointerLength = pointerLength;
    }
  }

  return errors.length > 0 ? errors : null;
};
