/**
 * Utility for providing haptic feedback via the navigator.vibrate API.
 * It is optional: unsupported browsers simply do nothing.
 */

export const Haptics = {
  /**
   * Short, subtle tap (15ms).
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  },

  /**
   * Medium impact tap (30ms).
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  },

  /**
   * Heavy impact tap (50ms).
   */
  heavy: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  },

  /**
   * Double tap pattern (20ms, skip 30ms, 20ms).
   */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
  },

  /**
   * Error pattern (50ms, skip 50ms, 100ms).
   */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 100]);
    }
  }
};
