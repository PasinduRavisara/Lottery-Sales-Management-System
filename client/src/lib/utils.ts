/**
 * Utility functions for the application
 */

/**
 * Convert a relative profile picture URL to a full URL
 * @param profilePictureUrl - The relative URL from the database (e.g., "/uploads/profile-pictures/file.jpg")
 * @returns The full URL to access the profile picture
 */
export const getProfilePictureUrl = (
  profilePictureUrl: string | null | undefined
): string | null => {
  if (!profilePictureUrl) {
    return null;
  }

  // If it's already a full URL, return as is
  if (
    profilePictureUrl.startsWith("http://") ||
    profilePictureUrl.startsWith("https://")
  ) {
    return profilePictureUrl;
  }

  // For local development, images are served from the public directory
  // The profilePictureUrl stored in database is like "/uploads/profile-pictures/filename.jpg"
  // Since images are now in client/public, we can access them directly
  return profilePictureUrl;
};

/**
 * Get the user's initials from their full name
 * @param fullName - The user's full name
 * @returns The initials (e.g., "John Doe" -> "JD")
 */
export const getUserInitials = (
  fullName: string | null | undefined
): string => {
  if (!fullName) {
    return "U";
  }

  return fullName
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2) // Take only first 2 initials
    .join("");
};
