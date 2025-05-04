// src/utils/helpers.js
export const getBaseUrl = () => {
    // Check if running on the server
    if (typeof window === 'undefined') {
      // Return the server URL or a default value
      return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // Replace with your server URL
    }
  
    // Browser environment
    return window.location.origin;
  };