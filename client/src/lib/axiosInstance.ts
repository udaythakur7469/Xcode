import axios from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Default request timeout for all instance calls. Individual requests
// (like runCode/submitCode, which wait on a queued judge job that can
// legitimately take longer) override this per-call. This default exists
// so that a hung connection - dead backend, dropped socket, unresponsive
// EC2 instance - always rejects instead of leaving the UI's loading
// state stuck forever.
const DEFAULT_TIMEOUT_MS = 20000;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT_MS,
});

// ─────────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Catches 429 Too Many Requests responses from @periodic/titanium
// and shows a sonner toast — so no individual store needs to handle
// it. All other errors are passed through unchanged so existing
// catch blocks in each store continue to work as before.
// ─────────────────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  // ✅ Success — pass through untouched
  (response) => response,

  // ❌ Error — handle 429, pass everything else through
  (error) => {
    if (error.response?.status === 429) {
      const data = error.response.data;

      const message = data?.error || "Too many requests. Please slow down.";
      const retryAfter = data?.retryAfter;

      // sonner deduplicates by toastId — prevents stacking if
      // multiple requests hit the limit at the same time
      toast.error(
        retryAfter ? `${message} Try again in ${retryAfter}s.` : message,
        { id: "rate-limit" },
      );

      // Attach a flag so stores can optionally detect this
      error.isRateLimit = true;
    }

    // Always reject so existing catch blocks in stores still run
    return Promise.reject(error);
  },
);

export default axiosInstance;
