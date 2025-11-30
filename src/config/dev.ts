// Development configuration
// Set to false before deploying to production
export const DEV_CONFIG = {
  // Bypass registration and approval checks
  bypassRegistrationChecks: true,
  
  // Set this to false when going live
  isDevelopment: true,
  
  // Get/Set dev role override (persisted in localStorage)
  getDevRole: (): 'vendor' | 'chef' | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('devRole') as 'vendor' | 'chef' | null;
  },
  
  setDevRole: (role: 'vendor' | 'chef') => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('devRole', role);
  },
};
