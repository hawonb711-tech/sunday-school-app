import { Platform, Alert } from 'react-native';

/** Cross-platform alert (web uses window.alert) */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/** Cross-platform confirm dialog. Returns true if confirmed. */
export function showConfirm(title: string, message?: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n${message}` : title));
  }
  return new Promise(resolve => {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel', onPress: () => resolve(false) },
      { text: '확인', onPress: () => resolve(true) },
    ]);
  });
}
