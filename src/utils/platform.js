import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // 'android', 'ios', or 'web'

// export const getPreferredTheme = () => {
//   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//   return prefersDark ? 'dark' : 'light';
// };