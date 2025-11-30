import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

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
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      
      // Determine platform
      const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android';
      
      // Save token to database
      try {
        const { error } = await supabase
          .from('push_tokens')
          .upsert({
            user_id: user.id,
            token: token.value,
            platform: platform
          }, {
            onConflict: 'user_id,token'
          });

        if (error) {
          console.error('Error saving push token:', error);
        } else {
          console.log('Push token saved successfully');
        }
      } catch (error) {
        console.error('Error saving push token to database:', error);
      }
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
      const data = notification.notification.data;
      if (data?.type === 'new_opportunity') {
        window.location.href = '/availability-shifts';
      } else if (data?.type === 'application_accepted') {
        window.location.href = '/availability-shifts';
      }
    });

    initializePushNotifications();

    // Cleanup listeners on unmount
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);
};
