// Check if already dismissed (persist for 7 days now)
const DISMISS_KEY = 'extension-warning-dismissed';
const FALLBACK_SUCCESS_KEY = 'rpc-fallback-success';

// Mark RPC fallback as successful - called from apiService
export const markRpcFallbackSuccess = () => {
  try {
    localStorage.setItem(FALLBACK_SUCCESS_KEY, 'true');
  } catch {
    // Ignore
  }
};

// DISABLED: This component caused too many false positives
// The RPC fallback system handles blocked requests gracefully
// so this warning is no longer needed
export const ExtensionBlockerDetector = () => {
  return null;
};
