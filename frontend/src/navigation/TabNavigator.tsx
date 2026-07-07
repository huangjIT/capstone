import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { HomeMapScreen } from '../screens/HomeMapScreen';
import { FindPartnersScreen } from '../screens/FindPartnersScreen';
import { PetBlindDateScreen } from '../screens/PetBlindDateScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { MeProfileScreen } from '../screens/MeProfileScreen';
import { PostInvitationScreen } from '../screens/PostInvitationScreen';
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

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ emoji, label, focused }) => (
  <View style={tabStyles.iconContainer}>
    <Text style={tabStyles.emoji}>{emoji}</Text>
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
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 72,
          paddingBottom: 10,
        },
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
              <TabIcon emoji="🚶" label="Walk" focused={focused} />
            ),
            tabBarStyle: hideTabBar
              ? { display: 'none' }
              : { backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, height: 72, paddingBottom: 10 },
          };
        }}
      />
      <Tab.Screen
        name="Date"
        component={PetBlindDateScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💕" label="Date" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛍️" label="Market" focused={focused} />
          ),
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
