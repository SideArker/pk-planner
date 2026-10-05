import { useAppTheme } from '@/context/ThemeContext';

export function useTheme() {
  const { theme } = useAppTheme();
  return theme;
}
