/**
 * Global Auto-Update Component
 * 
 * Re-exports the new SmartUpdateChecker which uses:
 * - 30-minute cooldown between checks (vs 5 minutes before)
 * - Cross-tab coordination (only one tab checks)
 * - Visibility-based checking (only when user returns)
 * 
 * This reduces version check API calls by ~94%
 */

export { SmartUpdateChecker as GlobalUpdateNotification, SmartUpdateChecker as default } from './SmartUpdateChecker';
