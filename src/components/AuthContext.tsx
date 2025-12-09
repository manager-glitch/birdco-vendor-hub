import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DEV_CONFIG } from "@/config/dev";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  userRole: 'vendor' | 'chef' | 'admin' | null;
  loading: boolean;
  registrationComplete: boolean;
  approvalStatus: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  userRole: null,
  loading: true,
  registrationComplete: false,
  approvalStatus: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<'vendor' | 'chef' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
            checkRegistrationStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setUserRole(null);
          setRegistrationComplete(false);
          setApprovalStatus(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
        checkRegistrationStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle temporary sessions (when "Stay signed in" is unchecked)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionStorage.getItem('tempSession') === 'true') {
        await supabase.auth.signOut();
        sessionStorage.removeItem('tempSession');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data) {
      const actualRole = data.role as 'vendor' | 'chef' | 'admin';
      
      // In development mode, check for dev role override
      if (DEV_CONFIG.isDevelopment) {
        const devRole = DEV_CONFIG.getDevRole();
        if (devRole) {
          setUserRole(devRole);
          setIsAdmin(devRole === 'admin');
        } else {
          setUserRole(actualRole);
          setIsAdmin(actualRole === 'admin');
        }
      } else {
        setUserRole(actualRole);
        setIsAdmin(actualRole === 'admin');
      }
    }
    setLoading(false);
  };

  const checkRegistrationStatus = async (userId: string) => {
    // Bypass registration checks in development mode
    if (DEV_CONFIG.bypassRegistrationChecks) {
      setRegistrationComplete(true);
      setApprovalStatus("approved");
      return;
    }

    // Check if user is admin first - admins don't need registration
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (roleData?.role === 'admin') {
      setRegistrationComplete(true);
      setApprovalStatus("approved");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("registration_completed, approval_status")
      .eq("id", userId)
      .maybeSingle();
    
    if (data) {
      setRegistrationComplete(data.registration_completed || false);
      setApprovalStatus(data.approval_status || "pending");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setUserRole(null);
    setRegistrationComplete(false);
    setApprovalStatus(null);
    navigate("/auth");
  };

  // Listen for dev role changes in development mode
  useEffect(() => {
    if (!DEV_CONFIG.isDevelopment) return;
    
    const handleDevRoleChange = () => {
      if (user) {
        checkUserRole(user.id);
      }
    };
    
    window.addEventListener('devRoleChange', handleDevRoleChange);
    return () => window.removeEventListener('devRoleChange', handleDevRoleChange);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, userRole, loading, registrationComplete, approvalStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
