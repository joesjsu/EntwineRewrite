/**
 * Helper functions for the Entwine mobile app
 */

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number): string => {
  const d = typeof date === 'object' ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format a date to a time string
 * @param date The date to format
 * @returns Formatted time string
 */
export const formatTime = (date: Date | string | number): string => {
  const d = typeof date === 'object' ? date : new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate age from birthdate
 * @param birthdate The birthdate
 * @returns Age in years
 */
export const calculateAge = (birthdate: Date | string | number): number => {
  const today = new Date();
  const birthDate = typeof birthdate === 'object' ? birthdate : new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Calculate distance between two coordinates in miles
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Haversine formula
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Truncate text to a specified length
 * @param text The text to truncate
 * @param length Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Get initials from a name
 * @param name The name to get initials from
 * @returns Initials (up to 2 characters)
 */
export const getInitials = (name: string): string => {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Validate email format
 * @param email The email to validate
 * @returns Whether the email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number format
 * @param phone The phone number to validate
 * @returns Whether the phone number is valid
 */
export const isValidPhone = (phone: string): boolean => {
  const re = /^\+?[1-9]\d{9,14}$/;
  return re.test(phone);
};

/**
 * Validate password strength
 * @param password The password to validate
 * @returns Whether the password is strong enough
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

/**
 * Sleep for a specified duration
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified duration
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
};