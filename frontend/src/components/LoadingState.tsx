import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading deployment data...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#FF7A00" />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});
