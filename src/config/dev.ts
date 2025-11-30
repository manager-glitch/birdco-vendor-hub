// Development configuration
// Set to false before deploying to production
export const DEV_CONFIG = {
  // Bypass registration and approval checks
  bypassRegistrationChecks: true,
  
  // Set this to false when going live
  isDevelopment: true,
  
  // Override role for development (set to null to use actual user role)
  // Options: 'vendor' | 'chef' | 'admin' | null
  overrideRole: null as 'vendor' | 'chef' | 'admin' | null,
};
