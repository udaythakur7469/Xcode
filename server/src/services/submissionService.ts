import axios from "axios";
import {
  JUDGE0_HEADERS,
  JUDGE0_URL,
} from "../controllers/submissionController.js";
import { getLanguageConfig } from "../configs/languageConfig.js";

// Add these interfaces at the top of your helper file

interface BaseProcessedResult {
  success: boolean;
  status: string;
  statusDescription: string;
}

interface SuccessResult extends BaseProcessedResult {
  success: true;
  status: "accepted";
  stdout: string;
  time: number;
  memory: number;
}

interface CompilationErrorResult extends BaseProcessedResult {
  success: false;
  status: "compilation_error";
  stderr?: string;
  compile_output: string;
  errorInfo: any;
}

interface RuntimeErrorResult extends BaseProcessedResult {
  success: false;
  status: "runtime_error";
  statusId: number;
  message: string;
  stderr: string;
  time?: number;
  memory?: number;
}

interface TimeoutErrorResult extends BaseProcessedResult {
  success: false;
  status: "time_limit_exceeded";
  message: string;
  time?: number;
  memory?: number;
}

interface WrongAnswerResult extends BaseProcessedResult {
  success: false;
  status: "wrong_answer";
  stdout?: string;
  stderr?: string;
  time?: number;
  memory?: number;
}

interface InternalErrorResult extends BaseProcessedResult {
  success: false;
  status: "internal_error";
  message: string;
  error: string;
}

interface UnknownErrorResult extends BaseProcessedResult {
  success: false;
  status: "unknown_error";
  message: string;
  stderr?: string;
}

export type ProcessedResult =
  | SuccessResult
  | CompilationErrorResult
  | RuntimeErrorResult
  | TimeoutErrorResult
  | WrongAnswerResult
  | InternalErrorResult
  | UnknownErrorResult;

// Helper function to map language to Judge0 language ID
export const getLanguageId = (language: string): number => {
  const config = getLanguageConfig(language);
  if (!config) {
    // Loud failure instead of silently running the wrong compiler
    throw new Error(`Unsupported language: "${language}"`);
  }
  return config.judge0Id;
};

export const pollJudge0Result = async (submissionId) => {
  const maxAttempts = 40; // 20 seconds max
  let attempts = 0;
  let result;

  do {
    await new Promise((resolve) => setTimeout(resolve, 500));
    result = await axios.get(
      `${JUDGE0_URL}/submissions/${submissionId}?base64_encoded=true`,
      { headers: JUDGE0_HEADERS },
    );
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error("Judge0 timed out after 20 seconds");
    }
  } while (result.data.status.id <= 2);

  return result.data;
};

/**
 * Process Judge0 submission result based on status code
 * @param {Object} result - The Judge0 API result
 * @param {Array} errorInfo - Array of parsed error information
 * @param {string} language - The programming language
 * @returns {Object} Formatted response with appropriate status
 */
export const processSubmissionResult = (
  result,
  errorInfo,
  language,
): ProcessedResult => {
  const statusId = result.status.id;

  // Status code categories
  const ACCEPTED = 3;
  const WRONG_ANSWER = 4;
  const TIME_LIMIT_EXCEEDED = 5;
  const COMPILATION_ERROR = 6;
  const RUNTIME_ERRORS = [7, 8, 9, 10, 11, 12];
  const INTERNAL_ERROR_THRESHOLD = 13;

  // Handle successful execution
  if (statusId === ACCEPTED) {
    return {
      success: true,
      status: "accepted",
      statusDescription: result.status.description,
      stdout: result.stdout,
      time: result.time,
      memory: result.memory,
    };
  }

  // Handle wrong answer
  if (statusId === WRONG_ANSWER) {
    return {
      success: false,
      status: "wrong_answer",
      statusDescription: result.status.description,
      stdout: result.stdout,
      stderr: result.stderr,
      time: result.time,
      memory: result.memory,
    };
  }

  // Handle time limit exceeded
  if (statusId === TIME_LIMIT_EXCEEDED) {
    return {
      success: false,
      status: "time_limit_exceeded",
      statusDescription: result.status.description,
      message:
        "Your program took too long to execute. Consider optimizing your algorithm.",
      time: result.time,
      memory: result.memory,
    };
  }

  // Handle compilation errors
  if (statusId === COMPILATION_ERROR) {
    return processCompilationError(result, errorInfo);
  }

  // Handle runtime errors
  if (RUNTIME_ERRORS.includes(statusId)) {
    return processRuntimeError(result, statusId);
  }

  // Handle internal server errors (status >= 13)
  if (statusId >= INTERNAL_ERROR_THRESHOLD) {
    return {
      success: false,
      status: "internal_error",
      statusDescription: result.status.description,
      message:
        "An internal error occurred while processing your submission. Please try again.",
      error: result.status.description,
    };
  }

  // Fallback for unknown status codes
  return {
    success: false,
    status: "unknown_error",
    statusDescription: result.status.description,
    message: "An unexpected error occurred.",
    stderr: result.stderr,
  };
};

/**
 * Process runtime error output and format it for client response
 * @param {Object} result - The Judge0 API result
 * @param {number} statusId - The status ID
 * @returns {Object} Formatted runtime error response
 */
export const processRuntimeError = (result, statusId): RuntimeErrorResult => {
  const errorMessages = {
    7: "Segmentation Fault: Your program tried to access invalid memory. Check array bounds and pointer usage.",
    8: "File Size Limit Exceeded: Your program tried to create or write to a file that exceeded the size limit.",
    9: "Floating Point Exception: Your program encountered a mathematical error (e.g., division by zero).",
    10: "Program Aborted: Your program called abort() or encountered a fatal error.",
    11: "Non-Zero Exit Code: Your program exited with an error code. Check for runtime exceptions.",
    12: "Runtime Error: Your program encountered an error during execution.",
  };

  let stderr = result.stderr || "";

  // Try to extract meaningful error information
  let errorDetails = "";
  if (stderr) {
    // Extract last few lines which usually contain the actual error
    const lines = stderr.trim().split("\n");
    errorDetails = lines.slice(-5).join("\n");
  }

  return {
    success: false as const,
    status: "runtime_error" as const,
    statusDescription: result.status.description,
    statusId: statusId,
    message: errorMessages[statusId] || errorMessages[12],
    stderr: errorDetails || stderr,
    time: result.time,
    memory: result.memory,
  };
};

/**
 * Process compilation error output and format it for client response
 * @param {Object} result - The Judge0 API result
 * @param {Array} errorInfo - Array of parsed error information
 * @returns {Object} Formatted error response
 */
export const processCompilationError = (
  result,
  errorInfo,
): CompilationErrorResult => {
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

  // Keep only the first error entry for display; clean up any stray whitespace
  // in the file field that older compiler outputs might leave.
  let cleanErrorInfo = null;
  if (errorInfo && errorInfo.length > 0) {
    cleanErrorInfo = [{ ...errorInfo[0] }];
    if (cleanErrorInfo[0].file) {
      cleanErrorInfo[0].file = cleanErrorInfo[0].file.replace(/\n/g, "").trim();
    }
  }

  return {
    success: false as const,
    status: "compilation_error" as const,
    statusDescription: result.status.description,
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
// Shared shape for every entry pushed into the errors array.
// codeSnippet / pointerStart / pointerLength are optional because they're only
// attached when the compiler output contains a caret line (^~~).
interface ErrorEntry {
  file: string;
  line: number;
  column?: number;
  type?: string;
  function?: string | null;
  message: string | null;
  codeSnippet?: string;
  pointerStart?: number;
  pointerLength?: number;
}

export const parseErrorPosition = (compileOutput, language) => {
  if (!compileOutput) return null;

  const errors: ErrorEntry[] = [];

  if (language === "cpp" || language === "c") {
    // C/C++ error format: file:line:column: error: message
    // [^\s:] anchors the file match to a single non-whitespace, non-colon token
    // so it never bleeds across the caret lines (^~~) that GCC emits between errors.
    const regex = /([^\s:][^:]*):(\d+):(\d+):\s*(error|warning):\s*([^\n]*)/g;
    let match;

    while ((match = regex.exec(compileOutput)) !== null) {
      errors.push({
        file: match[1].trim(),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        type: match[4],
        message: match[5].trim(),
      });
    }
  } else if (language === "java") {
    // Java error format: file:line: error: message
    // Same non-newline anchor to prevent bleeding across multi-error caret lines.
    const regex = /([^\s:][^:]*):(\d+):\s*(error|warning):\s*([^\n]*)/g;
    let match;

    while ((match = regex.exec(compileOutput)) !== null) {
      errors.push({
        file: match[1].trim(),
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
