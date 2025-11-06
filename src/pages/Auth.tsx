import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, ChefHat } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"vendor" | "chef">("vendor");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              role: role,
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
        <div className="text-center">
          <h1 className="font-heading text-5xl font-black mb-2">
            BIRD & CO
          </h1>
          <p className="text-muted-foreground">Events Vendor Portal</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {isLogin ? "Welcome Back" : "Join Our Network"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to view new opportunities"
                : "Create an account to access vendor opportunities"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-4">
                    <Label>Join as</Label>
                    <RadioGroup value={role} onValueChange={(value) => setRole(value as "vendor" | "chef")} className="grid grid-cols-2 gap-4">
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
                        <span className="font-heading font-bold">Vendor</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Food trucks, catering, equipment
                        </span>
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
                        <span className="font-heading font-bold">Chef</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Professional cooking services
                        </span>
                      </Label>
                    </RadioGroup>
                  </div>
                  
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
