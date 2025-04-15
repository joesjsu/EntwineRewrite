import { DefaultTheme, configureFonts } from 'react-native-paper';

// Define custom fonts (optional)
const fontConfig = {
  regular: {
    fontFamily: 'sans-serif',
    fontWeight: 'normal' as 'normal',
  },
  medium: {
    fontFamily: 'sans-serif-medium',
    fontWeight: 'normal' as 'normal',
  },
  light: {
    fontFamily: 'sans-serif-light',
    fontWeight: 'normal' as 'normal',
  },
  thin: {
    fontFamily: 'sans-serif-thin',
    fontWeight: 'normal' as 'normal',
  },
};

// Define the theme with purple as the primary color to match the web app
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee', // Purple color (same as web app)
    accent: '#03dac4',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
    error: '#B00020',
    disabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 4,
};

// Export color constants for use throughout the app
export const colors = {
  primary: '#6200ee',
  primaryLight: '#9c4dff',
  primaryDark: '#0000ba',
  accent: '#03dac4',
  accentLight: '#66fff8',
  accentDark: '#00a893',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#B00020',
  text: '#000000',
  textLight: '#757575',
  textDark: '#000000',
  disabled: '#9e9e9e',
  placeholder: '#9e9e9e',
  divider: '#e0e0e0',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  notification: '#f50057',
};

// Export spacing constants for consistent layout
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Export typography styles
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold' as 'bold',
    lineHeight: 28,
  },
  subtitle1: {
    fontSize: 18,
    fontWeight: '500' as '500',
    lineHeight: 24,
  },
  subtitle2: {
    fontSize: 16,
    fontWeight: '500' as '500',
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as 'normal',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as 'normal',
    lineHeight: 20,
  },
  button: {
    fontSize: 14,
    fontWeight: '500' as '500',
    lineHeight: 20,
    textTransform: 'uppercase' as 'uppercase',
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as 'normal',
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: 'normal' as 'normal',
    lineHeight: 14,
    textTransform: 'uppercase' as 'uppercase',
  },
};