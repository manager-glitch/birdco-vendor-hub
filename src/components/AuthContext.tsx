import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DEV_CONFIG } from "@/config/dev";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  registrationComplete: boolean;
  approvalStatus: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
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
            checkAdminStatus(session.user.id);
            checkRegistrationStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setRegistrationComplete(false);
          setApprovalStatus(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        checkRegistrationStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
    setLoading(false);
  };

  const checkRegistrationStatus = async (userId: string) => {
    // Bypass registration checks in development mode
    if (DEV_CONFIG.bypassRegistrationChecks) {
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
    setRegistrationComplete(false);
    setApprovalStatus(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, registrationComplete, approvalStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
