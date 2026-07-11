/**
 * Thin wrapper over react-native-haptic-feedback with intent-named helpers.
 * Fails silently if the device has no haptic engine.
 */
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

let enabled = true;

type HapticType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'selection'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

export const haptics = {
  setEnabled(value: boolean) {
    enabled = value;
  },
  trigger(type: HapticType) {
    if (!enabled) {
      return;
    }
    try {
      ReactNativeHapticFeedback.trigger(type, options);
    } catch {
      // no-op: device without haptics
    }
  },
  light() {
    this.trigger('impactLight');
  },
  medium() {
    this.trigger('impactMedium');
  },
  heavy() {
    this.trigger('impactHeavy');
  },
  selection() {
    this.trigger('selection');
  },
  success() {
    this.trigger('notificationSuccess');
  },
  warning() {
    this.trigger('notificationWarning');
  },
  error() {
    this.trigger('notificationError');
  },
};
