// COMPLETELY DISABLED: This component caused persistent false positives
// The RPC fallback system handles blocked requests gracefully
// DO NOT RE-ENABLE THIS COMPONENT

// No-op function to maintain API compatibility with apiService
export const markRpcFallbackSuccess = () => {
  // Intentionally empty - no longer needed
};

// Returns null - component is completely disabled
export const ExtensionBlockerDetector = () => null;
