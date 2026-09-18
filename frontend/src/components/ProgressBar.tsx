import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  height = 8,
  color = '#FF7A00',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress || 0)));

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${clamped}%`, height, backgroundColor: color }]} />
      </View>
      {showLabel && <Text style={styles.label}>{clamped}%</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    minWidth: 36,
  },
});
