import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: isDark ? '#fafafa' : '#18181b',
          text: isDark ? '#09090b' : '#ffffff',
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: isDark ? '#27272a' : '#f1f5f9',
          text: theme.text,
          border: 'transparent',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.text,
          border: theme.border,
        };
      case 'destructive':
        return {
          bg: isDark ? '#450a0a' : '#fee2e2',
          text: theme.destructive,
          border: theme.destructive,
        };
    }
  };

  const colors = getColors();

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { py: 7, px: 11, fontSize: 12 };
      case 'lg':
        return { py: 14, px: 22, fontSize: 15 };
      case 'md':
      default:
        return { py: 11, px: 16, fontSize: 13.5 };
    }
  };

  const dim = getPadding();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: colors.border !== 'transparent' ? 1 : 0,
          paddingVertical: dim.py,
          paddingHorizontal: dim.px,
          opacity: disabled || loading ? 0.6 : pressed ? 0.8 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: colors.text, fontSize: dim.fontSize },
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
  },
  text: {
    fontWeight: '700',
  },
});
