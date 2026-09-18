/**
 * Generates dynamic avatar initials from a user's name.
 * Handles single-word names, multi-word names, and numeric strings dynamically.
 */
export const getAvatarInitials = (name?: string | null): string => {
  if (!name || typeof name !== 'string') return 'U';
  
  const trimmed = name.trim();
  if (!trimmed) return 'U';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    // If name is single word or number e.g. "123" -> "12" or "John" -> "JO"
    return trimmed.length >= 2 ? trimmed.substring(0, 2).toUpperCase() : trimmed.substring(0, 1).toUpperCase();
  }

  // Multi-word name e.g. "John Doe" -> "JD", "Admin User" -> "AU"
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return (first + last).toUpperCase();
};
