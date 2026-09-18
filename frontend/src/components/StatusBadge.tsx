import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  let bg = '#E2E8F0';
  let color = '#475569';
  let label = status;

  if (normalized === 'completed' || normalized === 'pass') {
    bg = '#DCFCE7';
    color = '#15803D';
  } else if (normalized === 'in progress' || normalized === 'pending') {
    bg = '#FEF3C7';
    color = '#B45309';
  } else if (normalized === 'fail' || normalized === 'failed') {
    bg = '#FEE2E2';
    color = '#B91C1C';
  } else if (normalized === 'n/a') {
    bg = '#F1F5F9';
    color = '#64748B';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
