import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useWalkBadge } from '../context/WalkBadgeContext';
import { useTelemetryPing } from '../utils/telemetry';
import { HomeMapScreen } from '../screens/HomeMapScreen';
import { FindPartnersScreen } from '../screens/FindPartnersScreen';
import { PetBlindDateScreen } from '../screens/PetBlindDateScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { MeProfileScreen } from '../screens/MeProfileScreen';
import { PostInvitationScreen } from '../screens/PostInvitationScreen';
import { PostDateInvitationScreen } from '../screens/PostDateInvitationScreen';
import { DatePetProfileScreen } from '../screens/DatePetProfileScreen';
import { EditDateInvitationScreen } from '../screens/EditDateInvitationScreen';
import { PostMarketItemScreen } from '../screens/PostMarketItemScreen';
import { MarketChatsScreen } from '../screens/MarketChatsScreen';
import { EditInvitationScreen } from '../screens/EditInvitationScreen';
import { ConnectPetProfileScreen } from '../screens/ConnectPetProfileScreen';

const Tab = createBottomTabNavigator();

const WalkStack = createStackNavigator();
const WalkNavigator = () => (
  <WalkStack.Navigator screenOptions={{ headerShown: false }}>
    <WalkStack.Screen name="FindPartners" component={FindPartnersScreen} />
    <WalkStack.Screen name="PostInvitation" component={PostInvitationScreen} />
    <WalkStack.Screen name="EditInvitation" component={EditInvitationScreen} />
    <WalkStack.Screen name="ConnectPetProfile" component={ConnectPetProfileScreen} />
  </WalkStack.Navigator>
);

const MarketStack = createStackNavigator();
const MarketNavigator = () => (
  <MarketStack.Navigator screenOptions={{ headerShown: false }}>
    <MarketStack.Screen name="Marketplace" component={MarketplaceScreen} />
    <MarketStack.Screen name="PostMarketItem" component={PostMarketItemScreen} />
    <MarketStack.Screen name="MarketChats" component={MarketChatsScreen} />
  </MarketStack.Navigator>
);

const DateStack = createStackNavigator();
const DateNavigator = () => (
  <DateStack.Navigator screenOptions={{ headerShown: false }}>
    <DateStack.Screen name="PetBlindDate" component={PetBlindDateScreen} />
    <DateStack.Screen name="PostDateInvitation" component={PostDateInvitationScreen} />
    <DateStack.Screen name="DatePetProfile" component={DatePetProfileScreen} />
    <DateStack.Screen name="EditDateInvitation" component={EditDateInvitationScreen} />
  </DateStack.Navigator>
);

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
  badge?: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ emoji, label, focused, badge }) => (
  <View style={tabStyles.iconContainer}>
    <View>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      {badge && <View style={tabStyles.badgeDot} />}
    </View>
    <Text style={[tabStyles.label, focused ? tabStyles.labelActive : tabStyles.labelInactive]}>
      {label}
    </Text>
  </View>
);

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    width: 60,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.primary,
  },
  labelInactive: {
    color: COLORS.textMuted,
  },
});

export const TabNavigator: React.FC = () => {
  const { pendingCount, unreadMsgCount } = useWalkBadge();
  const insets = useSafeAreaInsets();
  // Report the signed-in user's position into the backend geo index while the app is open.
  useTelemetryPing();
  // Sit above the Android system navigation bar (edge-to-edge on Android 15+)
  const tabBarStyle = {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 72 + insets.bottom,
    paddingBottom: 10 + insets.bottom,
  };
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Map"
        component={HomeMapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺️" label="Map" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Walk"
        component={WalkNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'FindPartners';
          const hideTabBar = ['ConnectPetProfile', 'PostInvitation', 'EditInvitation'].includes(routeName);
          return {
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🚶" label="Walk" focused={focused} badge={pendingCount > 0 || unreadMsgCount > 0} />
            ),
            tabBarStyle: hideTabBar ? { display: 'none' as const } : tabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Date"
        component={DateNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'PetBlindDate';
          const hideTabBar = ['PostDateInvitation', 'DatePetProfile', 'EditDateInvitation'].includes(routeName);
          return {
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="💕" label="Date" focused={focused} />
            ),
            tabBarStyle: hideTabBar ? { display: 'none' as const } : tabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'Marketplace';
          const hideTabBar = ['PostMarketItem', 'MarketChats'].includes(routeName);
          return {
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🛍️" label="Market" focused={focused} />
            ),
            tabBarStyle: hideTabBar ? { display: 'none' as const } : tabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Me"
        component={MeProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Me" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
