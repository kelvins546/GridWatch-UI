import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  if (Platform.OS !== 'android') return true;

  const { status } = await Notifications.getPermissionsAsync();

  if (status !== 'granted') {
    const { status: newStatus } =
      await Notifications.requestPermissionsAsync();
    return newStatus === 'granted';
  }

  return true;
}
