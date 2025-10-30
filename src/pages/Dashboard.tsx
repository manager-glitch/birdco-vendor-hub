import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Loader2 } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  details: string;
  created_at: string;
}

interface Application {
  opportunity_id: string;
  status: string;
}

const Dashboard = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [oppsResult, appsResult] = await Promise.all([
        supabase.from("opportunities").select("*").eq("status", "open").order("event_date", { ascending: true }),
        supabase.from("applications").select("opportunity_id, status").eq("vendor_id", user!.id),
      ]);

      if (oppsResult.data) setOpportunities(oppsResult.data);
      if (appsResult.data) setApplications(appsResult.data);
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

  const handleApply = async (opportunityId: string) => {
    try {
      const { error } = await supabase.from("applications").insert({
        opportunity_id: opportunityId,
        vendor_id: user!.id,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "We'll notify you when there's an update.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hasApplied = (opportunityId: string) => {
    return applications.some((app) => app.opportunity_id === opportunityId);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl font-black">BIRD & CO</h1>
            <p className="text-sm text-muted-foreground">Vendor Portal</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Admin Panel
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold mb-2">Available Opportunities</h2>
          <p className="text-muted-foreground">Browse and apply to new event opportunities</p>
        </div>

        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No opportunities available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="font-heading text-xl">{opp.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{opp.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(opp.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{opp.location}</span>
                    </div>
                  </div>

                  {opp.details && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{opp.details}</p>
                  )}

                  {hasApplied(opp.id) ? (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      Applied
                    </Badge>
                  ) : (
                    <Button onClick={() => handleApply(opp.id)} className="w-full font-heading font-bold">
                      Express Interest
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
