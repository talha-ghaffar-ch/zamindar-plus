import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RecordsScreen} from '../screens/records/RecordsScreen';
import {ProfileDetailScreen} from '../screens/records/ProfileDetailScreen';
import {ZameenDetailScreen} from '../screens/records/ZameenDetailScreen';
import {CropDetailScreen} from '../screens/records/CropDetailScreen';
import type {RecordsStackParamList} from './types';

const Stack = createNativeStackNavigator<RecordsStackParamList>();

export function RecordsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="RecordsHome" component={RecordsScreen} />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
      <Stack.Screen name="ZameenDetail" component={ZameenDetailScreen} />
      <Stack.Screen name="CropDetail" component={CropDetailScreen} />
    </Stack.Navigator>
  );
}
