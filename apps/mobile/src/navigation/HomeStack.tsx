import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {HelpScreen} from '../screens/HelpScreen';

const Stack = createNativeStackNavigator();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Dashboard" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
