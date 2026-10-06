import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

export interface BadgeProps {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Badge({
  label,
  backgroundColor = '#f1f5f9',
  textColor = '#334155',
  borderColor,
  icon,
  style,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor: borderColor || 'transparent',
          borderWidth: borderColor ? 1 : 0,
        },
        style,
      ]}>
      {icon}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
