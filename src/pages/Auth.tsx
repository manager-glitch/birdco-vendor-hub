import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, ChefHat, ArrowLeft, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"vendor" | "chef" | "admin">("vendor");
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for password recovery session
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset.",
      });
      
      setIsResettingPassword(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'vendor' || roleParam === 'chef' || roleParam === 'admin') {
      setRole(roleParam);
      // Only show signup mode for vendor/chef, admin should default to login
      if (roleParam !== 'admin') {
        setIsLogin(false);
      }
    }
  }, [searchParams]);

  // Admin signup is blocked - admins can only login
  const isAdminMode = role === 'admin';
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block admin signup attempts
    if (!isLogin && isAdminMode) {
      toast({
        title: "Access Denied",
        description: "Admin accounts cannot be created through signup. Please contact an existing admin.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // If not staying signed in, set up session to clear on browser close
        if (!staySignedIn) {
          // Store a flag to indicate this is a temporary session
          sessionStorage.setItem('tempSession', 'true');
        }

        // Check user role and redirect accordingly
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        
        if (userRole?.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        // Only allow vendor/chef signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              role: role, // Will only be 'vendor' or 'chef'
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to Bird & Co Events.",
        });
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="font-heading text-3xl font-black mb-2">
              BIRD & CO EVENTS
            </h1>
            <p className="text-muted-foreground">
              {isResettingPassword ? 'Password Reset' : role === 'admin' ? 'Admin Portal' : 'Vendor Portal'}
            </p>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {isResettingPassword 
                ? "Reset Password" 
                : isLogin 
                  ? "Welcome Back" 
                  : role === 'admin' 
                    ? "Admin Access" 
                    : "Join Our Network"}
            </CardTitle>
            <CardDescription>
              {isResettingPassword
                ? "Enter your new password below"
                : isLogin
                  ? role === 'admin' ? "Access administrative dashboard" : "Sign in to view new opportunities"
                  : role === 'admin' ? "Create administrator account" : "Create an account to access vendor opportunities"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResettingPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-heading font-bold"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Update Password"}
                </Button>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <>
                      {role !== 'admin' && (
                        <div className="space-y-4">
                          <Label>Join as</Label>
                          <RadioGroup value={role} onValueChange={(value) => setRole(value as "vendor" | "chef" | "admin")} className="grid grid-cols-2 gap-4">
                            <Label
                              htmlFor="vendor"
                              className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${
                                role === "vendor" 
                                  ? "border-primary bg-primary/5" 
                                  : "border-muted hover:border-primary/50"
                              }`}
                            >
                              <RadioGroupItem value="vendor" id="vendor" className="sr-only" />
                              <Truck className="h-8 w-8 mb-2" />
                              <span className="font-heading font-bold text-sm">Vendor</span>
                            </Label>
                            <Label
                              htmlFor="chef"
                              className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${
                                role === "chef" 
                                  ? "border-primary bg-primary/5" 
                                  : "border-muted hover:border-primary/50"
                              }`}
                            >
                              <RadioGroupItem value="chef" id="chef" className="sr-only" />
                              <ChefHat className="h-8 w-8 mb-2" />
                              <span className="font-heading font-bold text-sm">Chef</span>
                            </Label>
                          </RadioGroup>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required={!isLogin}
                          placeholder="John Doe"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="staySignedIn" 
                        checked={staySignedIn}
                        onCheckedChange={(checked) => setStaySignedIn(checked as boolean)}
                      />
                      <label
                        htmlFor="staySignedIn"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Stay signed in
                      </label>
                    </div>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={resetLoading}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {resetLoading ? "Sending..." : "Forgot password?"}
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-heading font-bold"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
                  </Button>
                </form>

                {/* Hide signup option for admin mode */}
                {!isAdminMode && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isLogin
                        ? "Don't have an account? Sign up"
                        : "Already have an account? Sign in"}
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;