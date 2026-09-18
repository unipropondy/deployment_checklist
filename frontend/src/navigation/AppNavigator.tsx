import React from 'react';
import { View, ActivityIndicator, useWindowDimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';

import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TestRunsScreen } from '../screens/TestRunsScreen';
import { TestRunDetailScreen } from '../screens/TestRunDetailScreen';
import { NewTestRunScreen } from '../screens/NewTestRunScreen';
import { ShopsScreen } from '../screens/ShopsScreen';
import { BuildsScreen } from '../screens/BuildsScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

import { LayoutDashboard, CheckSquare, Store, Package, Users, Settings } from 'lucide-react-native';
import api from '../services/api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ROUTES = ['DashboardTab', 'TestsTab', 'ShopsTab', 'BuildsTab', 'UsersTab', 'SettingsTab'];

const withAppShell = (Component: React.ComponentType<any>, screenRoute: string) => {
  return (props: any) => {
    const [headerSearchQuery, setHeaderSearchQuery] = React.useState('');
    const [headerSelectedDate, setHeaderSelectedDate] = React.useState<Date>(new Date());

    return (
      <AppShell
        currentScreen={screenRoute}
        searchValue={headerSearchQuery}
        onSearchChange={setHeaderSearchQuery}
        selectedDate={headerSelectedDate}
        onDateChange={setHeaderSelectedDate}
        onSelectTestRun={(id) => {
          props.navigation.navigate('TestDetail', { id });
        }}
        onNavigate={async (route, params) => {
          if (route === 'TestDetail') {
            let targetId = params?.id;
            if (!targetId) {
              try {
                const res: any = await api.get('/test-runs');
                if (res && res.success && res.data && res.data.length > 0) {
                  targetId = res.data[0].TestRunId;
                }
              } catch (e) {
                console.error('Error fetching test run for sidebar link:', e);
              }
            }
            if (targetId) {
              props.navigation.navigate('TestDetail', { id: targetId });
            } else {
              props.navigation.navigate('MainTabs', { screen: 'TestsTab' });
            }
          } else if (TAB_ROUTES.includes(route)) {
            props.navigation.navigate('MainTabs', { screen: route, params });
          } else {
            props.navigation.navigate(route, params);
          }
        }}
      >
        <Component
          {...props}
          headerSearchQuery={headerSearchQuery}
          onClearHeaderSearch={() => setHeaderSearchQuery('')}
          headerSelectedDate={headerSelectedDate}
        />
      </AppShell>
    );
  };
};

const DashboardShell = withAppShell(DashboardScreen, 'DashboardTab');
const TestRunsShell = withAppShell(TestRunsScreen, 'TestsTab');
const ShopsShell = withAppShell(ShopsScreen, 'ShopsTab');
const BuildsShell = withAppShell(BuildsScreen, 'BuildsTab');
const UsersShell = withAppShell(UsersScreen, 'UsersTab');
const SettingsShell = withAppShell(SettingsScreen, 'SettingsTab');
const TestDetailShell = withAppShell(TestRunDetailScreen, 'TestDetail');
const NewTestRunShell = withAppShell(NewTestRunScreen, 'NewTestRun');

const MainTabNavigator = () => {
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF7A00',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: isTabletOrDesktop
          ? { display: 'none' }
          : {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E2E8F0',
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
              paddingHorizontal: 8,
            },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardShell}
        options={{
          title: 'Dashboard',
          headerTitle: 'DEPLOYCHECK',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="TestsTab"
        component={TestRunsShell}
        options={{
          title: 'Tests',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="ShopsTab"
        component={ShopsShell}
        options={{
          title: 'Shops',
          tabBarIcon: ({ color, size }) => <Store color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="BuildsTab"
        component={BuildsShell}
        options={{
          title: 'Builds',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="UsersTab"
        component={UsersShell}
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsShell}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  return (
    <Stack.Navigator id="RootStack">
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TestDetail"
            component={TestDetailShell}
            options={{ title: 'Checklist Testing' }}
          />
          <Stack.Screen
            name="NewTestRun"
            component={NewTestRunShell}
            options={{ title: 'New Test Session' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
