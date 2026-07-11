import React from 'react';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  BarChart3,
  Home as HomeIcon,
  Layers,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import {useAuth} from '../context/AuthContext';
import {FarmDataProvider} from '../context/FarmDataContext';
import {SplashScreen} from '../screens/SplashScreen';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {SignupScreen} from '../screens/auth/SignupScreen';
import {ForgotPasswordScreen} from '../screens/auth/ForgotPasswordScreen';
import {VerifyEmailScreen} from '../screens/auth/VerifyEmailScreen';
import {ResetPasswordScreen} from '../screens/auth/ResetPasswordScreen';
import {HomeStack} from './HomeStack';
import {RecordsStack} from './RecordsStack';
import {AddScreen} from '../screens/AddScreen';
import {ReportsScreen} from '../screens/ReportsScreen';
import {AiScreen} from '../screens/AiScreen';
import {theme} from '../theme';

type TabIconProps = {color: string; size: number};
const renderHomeIcon = ({color, size}: TabIconProps) => (
  <HomeIcon color={color} size={size} />
);
const renderRecordsIcon = ({color, size}: TabIconProps) => (
  <Layers color={color} size={size} />
);
const renderAddIcon = ({color, size}: TabIconProps) => (
  <Plus color={color} size={size} />
);
const renderReportsIcon = ({color, size}: TabIconProps) => (
  <BarChart3 color={color} size={size} />
);
const renderAssistantIcon = ({color, size}: TabIconProps) => (
  <Sparkles color={color} size={size} />
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.accent,
  },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 66,
          paddingBottom: 9,
          paddingTop: 9,
          ...theme.shadow.soft,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '800'},
      }}>
      <Tab.Screen name="Home" component={HomeStack} options={{tabBarIcon: renderHomeIcon}} />
      <Tab.Screen
        name="Records"
        component={RecordsStack}
        options={{tabBarIcon: renderRecordsIcon}}
      />
      <Tab.Screen name="Add" component={AddScreen} options={{tabBarIcon: renderAddIcon}} />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{tabBarIcon: renderReportsIcon}}
      />
      <Tab.Screen
        name="Assistant"
        component={AiScreen}
        options={{tabBarIcon: renderAssistantIcon}}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const {status} = useAuth();

  if (status === 'loading') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'authed' ? (
        <FarmDataProvider>
          <AppTabs />
        </FarmDataProvider>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
