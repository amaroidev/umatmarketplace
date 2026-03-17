import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import notificationService from './notification.service';
import { openNotificationTarget } from './notificationNavigation.service';

const PUSH_TOKEN_KEY = 'expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = (): string | undefined => {
  const easProjectId = (Constants as any)?.easConfig?.projectId;
  if (easProjectId) return easProjectId;

  const expoProjectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId;
  if (expoProjectId) return expoProjectId;

  return undefined;
};

const getInstallationId = (): string | undefined => {
  const id = (Constants as any)?.installationId;
  return typeof id === 'string' ? id : undefined;
};

const ensureNotificationPermissions = async (): Promise<boolean> => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted';
};

const fetchExpoPushToken = async (): Promise<string | null> => {
  if (!Device.isDevice) return null;

  const isGranted = await ensureNotificationPermissions();
  if (!isGranted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  }

  const projectId = getProjectId();
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
};

export const syncPushSubscription = async (): Promise<void> => {
  try {
    const token = await fetchExpoPushToken();
    if (!token) return;

    const existingToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (existingToken && existingToken !== token) {
      await notificationService.unsubscribeFromPush({ expoPushToken: existingToken });
    }

    await notificationService.subscribeToPush({
      expoPushToken: token,
      platform: Platform.OS,
      deviceId: getInstallationId(),
    });

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  } catch {
  }
};

export const removePushSubscription = async (): Promise<void> => {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (token) {
      await notificationService.unsubscribeFromPush({ expoPushToken: token });
    }
  } catch {
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
};

export const initPushRuntime = () => {
  const receivedSub = Notifications.addNotificationReceivedListener(() => {});
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    openNotificationTarget(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
};
