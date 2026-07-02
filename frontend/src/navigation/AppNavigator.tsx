import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { WalkRequestDetailScreen } from '../screens/WalkRequestDetailScreen';
import { NotificationDetailScreen } from '../screens/NotificationDetailScreen';
import { OwnerProfileScreen } from '../screens/OwnerProfileScreen';
import { MarketplaceChatScreen } from '../screens/MarketplaceChatScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Tabs: undefined;
  Notifications: undefined;
  WalkRequestDetail: { notif?: any; expanded?: boolean };
  NotificationDetail: { notif?: any };
  OwnerProfile: undefined;
  MarketplaceChat: { item?: any };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="WalkRequestDetail" component={WalkRequestDetailScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="OwnerProfile" component={OwnerProfileScreen} />
      <Stack.Screen name="MarketplaceChat" component={MarketplaceChatScreen} />
    </Stack.Navigator>
  );
};
