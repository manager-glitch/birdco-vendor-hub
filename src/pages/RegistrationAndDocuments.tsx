import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Download, CheckCircle, Clock, XCircle } from "lucide-react";

const RegistrationAndDocuments = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    website: "",
    bio: "",
    business_type: "",
    service_category: "",
    years_in_business: "",
    approval_status: "pending",
    registration_completed: false
  });
  const [documents, setDocuments] = useState<any[]>([]);

  const vendorDocumentLabels: Record<string, string> = {
    public_liability_insurance: "Public Liability Insurance",
    hygiene_rating: "Hygiene Rating Certificate",
    food_safety_certificate: "Food Safety Certificate",
    allergen_information: "Allergen Information",
    signed_contract: "Signed Contract"
  };

  const chefDocumentLabels: Record<string, string> = {
    food_safety_certificate: "Level 3 Hygiene Cert",
    right_to_work: "Right to Work Documentation",
    dbs_certificate: "DBS Certificate",
    public_liability_insurance: "Public Liability Insurance"
  };

  const documentLabels = userRole === 'chef' ? chefDocumentLabels : vendorDocumentLabels;

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        company_name: profile.company_name || "",
        phone: profile.phone || "",
        website: profile.website || "",
        bio: profile.bio || "",
        business_type: profile.business_type || "",
        service_category: profile.service_category || "",
        years_in_business: profile.years_in_business?.toString() || "",
        approval_status: profile.approval_status || "pending",
        registration_completed: profile.registration_completed || false
      });
    }

    const { data: docs } = await supabase
      .from("vendor_documents")
      .select("*")
      .eq("vendor_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (docs) setDocuments(docs);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          company_name: profileData.company_name,
          phone: profileData.phone,
          website: profileData.website,
          bio: profileData.bio,
          business_type: profileData.business_type,
          service_category: profileData.service_category,
          years_in_business: profileData.years_in_business ? parseInt(profileData.years_in_business) : null
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      await loadData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${documentType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("vendor-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("vendor_documents")
        .upsert({
          vendor_id: user.id,
          document_type: documentType,
          file_path: filePath,
          file_name: file.name
        }, {
          onConflict: 'vendor_id,document_type'
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully!");
      await loadData();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("vendor-documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Registration & Documents</h1>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Account Status:</span>
            {getStatusBadge(profileData.approval_status)}
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your business details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_name">Business Name</Label>
                      <Input
                        id="company_name"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        placeholder="https://"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_type">Business Type</Label>
                      <Select
                        value={profileData.business_type}
                        onValueChange={(value) => setProfileData({ ...profileData, business_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food_truck">Food Truck</SelectItem>
                          <SelectItem value="catering">Catering Service</SelectItem>
                          <SelectItem value="pop_up">Pop-up Restaurant</SelectItem>
                          <SelectItem value="vendor_stall">Vendor Stall</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_category">Service Category</Label>
                      <Select
                        value={profileData.service_category}
                        onValueChange={(value) => setProfileData({ ...profileData, service_category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="street_food">Street Food</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="specialty">Specialty Cuisine</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years_in_business">Years in Business</Label>
                      <Input
                        id="years_in_business"
                        type="number"
                        min="0"
                        value={profileData.years_in_business}
                        onChange={(e) => setProfileData({ ...profileData, years_in_business: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Business Description</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about your business..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Upload and manage your business documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(documentLabels).map(([key, label]) => {
                  const doc = documents.find(d => d.document_type === key);
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{label}</p>
                          {doc && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                              {getStatusBadge(doc.status)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.jpg,.jpeg,.png';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(key, file);
                            };
                            input.click();
                          }}
                          disabled={loading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {doc ? "Replace" : "Upload"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RegistrationAndDocuments;