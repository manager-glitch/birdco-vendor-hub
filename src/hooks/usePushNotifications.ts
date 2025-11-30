import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  useEffect(() => {
    // Request permission and register for push notifications
    const initializePushNotifications = async () => {
      try {
        // Request permission to use push notifications
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          // Register with Apple / Google to receive push via APNS/FCM
          await PushNotifications.register();
          console.log('Push notifications registered successfully');
        } else {
          console.log('Push notification permission denied');
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    // Listen for registration success
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // TODO: Send this token to your backend to store it for this user
      // You'll need this token to send notifications to this specific device
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Listen for push notifications received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      
      // Show a toast when notification is received while app is open
      toast.info(notification.title || 'New Notification', {
        description: notification.body
      });
    });

    // Listen for notification actions (when user taps on notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', notification);
      
      // TODO: Navigate to appropriate screen based on notification data
      // For example, if it's a new job notification, navigate to available events
    });

    initializePushNotifications();

    // Cleanup listeners on unmount
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);
};
