import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider, useApp } from './src/context/AppContext';
import { useI18n } from './src/i18n';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlanScreen from './src/screens/PlanScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import SquadScreen from './src/screens/SquadScreen';
import { C } from './src/theme';

const Tab = createBottomTabNavigator();
const navTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.panel, border: C.edge, primary: C.volt, text: C.text } };
const ICONS = { Home: 'home', Plan: 'barbell', Goals: 'flag', Squad: 'people' };

function Tabs() {
  const { t, isRTL } = useI18n();
  const labels = { Home: t.ho, Plan: t.pn, Goals: t.go, Squad: t.sq };
  return (
    <Tab.Navigator
      key={isRTL ? 'rtl' : 'ltr'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: C.panel, borderTopColor: C.edge, flexDirection: isRTL ? 'row-reverse' : 'row' },
        tabBarActiveTintColor: C.volt,
        tabBarInactiveTintColor: C.mute,
        tabBarLabel: labels[route.name],
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Squad" component={SquadScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { state } = useApp();
  if (!state.ready) {
    return <View style={styles.center}><ActivityIndicator color={C.volt} /></View>;
  }
  if (!state.profile || !state.scan) return <OnboardingScreen />;
  return (
    <NavigationContainer theme={navTheme}>
      <Tabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
