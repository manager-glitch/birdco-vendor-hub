import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Plus, Users, Edit, Eye, Phone, ArrowLeft, Trash2, Bell } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  details: string;
  status: string;
  role: string;
}

interface ApplicationWithProfile {
  id: string;
  status: string;
  message: string;
  created_at: string;
  opportunity_id: string;
  profiles: {
    full_name: string;
    company_name: string;
    phone: string;
  };
  opportunities: {
    title: string;
  };
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApplicantsDialogOpen, setIsApplicantsDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [opportunityApplicants, setOpportunityApplicants] = useState<ApplicationWithProfile[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    guest_count: "",
    details: "",
    role: "vendor" as "vendor" | "chef" | "both",
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();

      // Set up realtime subscription for applications
      const channel = supabase
        .channel('applications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'applications'
          },
          () => {
            console.log('Application change detected, refreshing data');
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      const [oppsResult, appsResult] = await Promise.all([
        supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
        supabase
          .from("applications")
          .select("id, status, message, created_at, vendor_id, opportunity_id")
          .order("created_at", { ascending: false }),
      ]);

      if (oppsResult.data) setOpportunities(oppsResult.data);
      
      // Fetch profiles for applications
      if (appsResult.data && appsResult.data.length > 0) {
        const vendorIds = appsResult.data.map(app => app.vendor_id);
        const oppIds = appsResult.data.map(app => app.opportunity_id);
        
        const [profilesResult, oppsForAppsResult] = await Promise.all([
          supabase.from("profiles").select("id, full_name, company_name, phone").in("id", vendorIds),
          supabase.from("opportunities").select("id, title").in("id", oppIds)
        ]);

        // Combine the data
        const combinedApps = appsResult.data.map(app => ({
          ...app,
          profiles: profilesResult.data?.find(p => p.id === app.vendor_id) || null,
          opportunities: oppsForAppsResult.data?.find(o => o.id === app.opportunity_id) || null
        }));

        setApplications(combinedApps as any);
      } else {
        setApplications([]);
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

  const sendPushNotification = async (title: string, body: string, role: "vendor" | "chef") => {
    try {
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: { title, body, role },
      });
      if (error) {
        console.error("Push notification error:", error);
      } else {
        console.log("Push notifications sent to", role, "users");
      }
    } catch (err) {
      console.error("Failed to send push notification:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rolesToCreate = formData.role === "both" ? ["vendor", "chef"] : [formData.role];
      
      for (const role of rolesToCreate) {
        const { error } = await supabase.from("opportunities").insert({
          title: formData.title,
          description: formData.description,
          event_date: formData.event_date,
          location: formData.location,
          details: formData.details,
          role: role as "vendor" | "chef",
          created_by: user!.id,
          status: "open",
        });

        if (error) throw error;

        // Send push notification to relevant users
        sendPushNotification(
          "New Opportunity Available!",
          `${formData.title} - ${formData.location}`,
          role as "vendor" | "chef"
        );
      }

      toast({
        title: "Opportunity created!",
        description: formData.role === "both" 
          ? "Vendors and chefs can now view and apply."
          : "Users can now view and apply.",
      });

      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        guest_count: "",
        details: "",
        role: "vendor",
      });
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description || "",
      event_date: opportunity.event_date,
      location: opportunity.location || "",
      guest_count: "",
      details: opportunity.details || "",
      role: opportunity.role as "vendor" | "chef",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    try {
      // For updates, don't allow "both" - only single role updates
      const updateData = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        location: formData.location,
        details: formData.details,
        role: formData.role === "both" ? "vendor" : formData.role as "vendor" | "chef",
      };
      
      const { error } = await supabase
        .from("opportunities")
        .update(updateData)
        .eq("id", selectedOpportunity.id);

      if (error) throw error;

      toast({
        title: "Opportunity updated!",
        description: "Changes have been saved.",
      });

      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        guest_count: "",
        details: "",
        role: "vendor",
      });
      setIsEditDialogOpen(false);
      setSelectedOpportunity(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (opportunityId: string) => {
    try {
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", opportunityId);

      if (error) throw error;

      toast({
        title: "Opportunity deleted",
        description: "The opportunity has been removed.",
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

  const handleViewApplicants = async (opportunityId: string) => {
    try {
      const { data: applicationsData, error: appsError } = await supabase
        .from("applications")
        .select("id, status, message, created_at, vendor_id")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      // Fetch vendor profiles for all applicants
      if (applicationsData && applicationsData.length > 0) {
        const vendorIds = applicationsData.map(app => app.vendor_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, company_name, phone")
          .in("id", vendorIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const combinedData = applicationsData.map(app => ({
          ...app,
          profiles: profilesData?.find(p => p.id === app.vendor_id) || null
        }));

        setOpportunityApplicants(combinedData as any);
      } else {
        setOpportunityApplicants([]);
      }

      setIsApplicantsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold mb-2">Opportunities Management</h1>
            <p className="text-muted-foreground">Create and manage event opportunities</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/notifications")}
              className="font-heading font-bold w-full sm:w-auto"
            >
              <Bell className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-heading font-bold w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Opportunity
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Create New Opportunity</DialogTitle>
                <DialogDescription>Add a new event opportunity for vendors</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Summer Music Festival 2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="A vibrant outdoor music festival"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Opportunity Type</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "vendor" | "chef" | "both") => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Vendor Opportunity</SelectItem>
                      <SelectItem value="chef">Chef Opportunity</SelectItem>
                      <SelectItem value="both">Both (Vendors & Chefs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      placeholder="Central Park, NYC"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_count">Guest Count</Label>
                  <Input
                    id="guest_count"
                    type="number"
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                    placeholder="e.g., 150"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Additional Details</Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="e.g., Dietary restrictions to accommodate, service style preferences..."
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full font-heading font-bold">
                  Create Opportunity
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold mb-4">Active Opportunities</h3>
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <Card key={opp.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-heading">{opp.title}</CardTitle>
                        <CardDescription>{opp.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(opp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewApplicants(opp.id)}
                          className="relative"
                        >
                          <Eye className="h-4 w-4" />
                          {applications.filter(a => a.opportunity_id === opp.id).length > 0 && (
                            <Badge 
                              variant="secondary" 
                              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                            >
                              {applications.filter(a => a.opportunity_id === opp.id).length}
                            </Badge>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{opp.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(opp.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(opp.event_date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={opp.status === "open" ? "default" : "secondary"}>{opp.status}</Badge>
                      <Badge variant="outline">{opp.role}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold mb-4">Vendor Applications</h3>
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">{app.profiles?.full_name || "Unknown Vendor"}</CardTitle>
                    <CardDescription>{app.opportunities?.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {app.profiles?.company_name && (
                      <p className="text-muted-foreground">Company: {app.profiles.company_name}</p>
                    )}
                    {app.profiles?.phone && <p className="text-muted-foreground">Phone: {app.profiles.phone}</p>}
                    <p className="text-xs text-muted-foreground">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                    <Badge variant="secondary">{app.status}</Badge>
                  </CardContent>
                </Card>
              ))}
              {applications.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No applications yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Opportunity Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Edit Opportunity</DialogTitle>
            <DialogDescription>Update event opportunity details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Short Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Opportunity Type</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "vendor" | "chef") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor Opportunity</SelectItem>
                  <SelectItem value="chef">Chef Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-event_date">Event Date</Label>
                <Input
                  id="edit-event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-details">Additional Details</Label>
              <Textarea
                id="edit-details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1 font-heading font-bold">
                Update Opportunity
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedOpportunity(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Applicants Dialog */}
      <Dialog open={isApplicantsDialogOpen} onOpenChange={setIsApplicantsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Applicants</DialogTitle>
            <DialogDescription>
              {opportunityApplicants.length} {opportunityApplicants.length === 1 ? 'applicant' : 'applicants'} for this opportunity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {opportunityApplicants.length > 0 ? (
              opportunityApplicants.map((app) => (
                <Card key={app.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">
                      {app.profiles?.full_name || "Unknown Vendor"}
                    </CardTitle>
                    {app.profiles?.company_name && (
                      <CardDescription>{app.profiles.company_name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {app.profiles?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{app.profiles.phone}</span>
                      </div>
                    )}
                    {app.message && (
                      <div>
                        <p className="text-muted-foreground mb-1">Message:</p>
                        <p className="text-sm">{app.message}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        Applied: {new Date(app.created_at).toLocaleDateString('en-GB')}
                      </p>
                      <Badge variant="secondary">{app.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No applicants yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
