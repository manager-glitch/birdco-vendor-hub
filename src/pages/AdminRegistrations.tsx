import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Eye, FileText, Phone, Calendar, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  bio: string;
  business_type: string;
  service_category: string;
  years_in_business: number;
  approval_status: string;
  registration_completed: boolean;
  created_at: string;
  email?: string;
}

interface VendorDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  uploaded_at: string;
  notes: string;
}

const AdminRegistrations = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchProfiles();
    }
  }, [user, isAdmin]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch emails for each profile using the secure function
      const profilesWithEmails = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: emailData } = await supabase.rpc("get_user_email", {
            user_uuid: profile.id,
          });
          return { ...profile, email: emailData || undefined };
        })
      );

      setProfiles(profilesWithEmails);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleViewProfile = async (profile: Profile) => {
    setSelectedProfile(profile);
    await fetchDocuments(profile.id);
    setIsDialogOpen(true);
  };

  const handleApprovalStatusChange = async (profileId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: newStatus,
          approved_at: newStatus === "approved" ? new Date().toISOString() : null,
          approved_by: newStatus === "approved" ? user?.id : null,
        })
        .eq("id", profileId);

      if (error) throw error;

      fetchProfiles();
      if (selectedProfile?.id === profileId) {
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Error updating approval status:", error);
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("vendor-documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading document:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (authLoading || loading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Vendor & Chef Registrations</h1>
          <p className="text-muted-foreground">Review and manage all vendor and chef registrations</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-heading text-lg">{profile.full_name || "No Name"}</CardTitle>
                    <CardDescription>{profile.company_name || "No Company"}</CardDescription>
                  </div>
                  {getStatusIcon(profile.approval_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {profile.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${profile.email}`} className="hover:underline truncate">
                        {profile.email}
                      </a>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.service_category && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{profile.service_category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Registered: {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(profile.approval_status)}
                  <Button variant="outline" size="sm" onClick={() => handleViewProfile(profile)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {profiles.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No registrations yet</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Profile Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {selectedProfile?.full_name || "Profile Details"}
            </DialogTitle>
            <DialogDescription>Review profile information and uploaded documents</DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-6">
              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {selectedProfile.email ? (
                        <a href={`mailto:${selectedProfile.email}`} className="text-primary hover:underline">
                          {selectedProfile.email}
                        </a>
                      ) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedProfile.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Company Name</p>
                    <p className="font-medium">{selectedProfile.company_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Business Type</p>
                    <p className="font-medium">{selectedProfile.business_type || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Service Category</p>
                    <p className="font-medium">{selectedProfile.service_category || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Years in Business</p>
                    <p className="font-medium">{selectedProfile.years_in_business || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registration Status</p>
                    <p className="font-medium">
                      {selectedProfile.registration_completed ? "Completed" : "Incomplete"}
                    </p>
                  </div>
                </div>
                {selectedProfile.bio && (
                  <div>
                    <p className="text-muted-foreground">Bio</p>
                    <p className="text-sm mt-1">{selectedProfile.bio}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Uploaded Documents</h3>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{doc.document_type.replace(/_/g, " ").toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                )}
              </div>

              {/* Approval Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  variant="default"
                  onClick={() => handleApprovalStatusChange(selectedProfile.id, "approved")}
                  disabled={selectedProfile.approval_status === "approved"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => handleApprovalStatusChange(selectedProfile.id, "rejected")}
                  disabled={selectedProfile.approval_status === "rejected"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRegistrations;