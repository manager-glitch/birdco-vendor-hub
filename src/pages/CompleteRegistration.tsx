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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, Pen, ArrowLeft } from "lucide-react";
import { ContractSigningDialog } from "@/components/ContractSigningDialog";

interface VendorDocumentStatus {
  public_liability_insurance: boolean;
  hygiene_rating: boolean;
  food_safety_certificate: boolean;
  allergen_information: boolean;
  signed_contract: boolean;
}

interface ChefDocumentStatus {
  level_3_hygiene_cert: boolean;
  dbs_check: boolean;
  public_liability_insurance: boolean;
  signed_contract: boolean;
}

type DocumentStatus = VendorDocumentStatus | ChefDocumentStatus;

const CompleteRegistration = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [showContractDialog, setShowContractDialog] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    website: "",
    bio: "",
    business_type: "",
    service_category: "",
    years_in_business: ""
  });

  const isChef = userRole === 'chef';

  const vendorDocumentLabels: Record<string, string> = {
    public_liability_insurance: "Public Liability Insurance",
    hygiene_rating: "Hygiene Rating Certificate",
    food_safety_certificate: "Food Safety Certificate",
    allergen_information: "Allergen Information",
    signed_contract: "Signed Vendor Contract"
  };

  const chefDocumentLabels: Record<string, string> = {
    level_3_hygiene_cert: "Level 3 Hygiene Certificate",
    dbs_check: "DBS Check",
    public_liability_insurance: "Public Liability Insurance",
    signed_contract: "Signed Chef Contract"
  };

  const documentLabels = isChef ? chefDocumentLabels : vendorDocumentLabels;

  const getInitialDocuments = () => {
    if (isChef) {
      return {
        level_3_hygiene_cert: false,
        dbs_check: false,
        public_liability_insurance: false,
        signed_contract: false
      };
    }
    return {
      public_liability_insurance: false,
      hygiene_rating: false,
      food_safety_certificate: false,
      allergen_information: false,
      signed_contract: false
    };
  };

  const [documents, setDocuments] = useState<Record<string, boolean>>(getInitialDocuments());

  useEffect(() => {
    // Admins don't need to complete registration
    if (userRole === 'admin') {
      navigate('/dashboard');
      return;
    }
    
    if (!user) return;
    loadExistingData();
  }, [user, userRole, navigate]);

  const loadExistingData = async () => {
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
        years_in_business: profile.years_in_business?.toString() || ""
      });
    }

    const { data: uploadedDocs } = await supabase
      .from("vendor_documents")
      .select("document_type")
      .eq("vendor_id", user.id);

    if (uploadedDocs) {
      const docStatus = getInitialDocuments();
      
      uploadedDocs.forEach(doc => {
        if (doc.document_type in docStatus) {
          docStatus[doc.document_type] = true;
        }
      });
      
      setDocuments(docStatus);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // For chefs, company_name is optional; for vendors it's required
    if (!profileData.full_name || !profileData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!isChef && !profileData.company_name) {
      toast.error("Please fill in all required fields");
      return;
    }

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

      toast.success("Profile updated successfully!", { duration: 2000 });
      setStep(2);
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

    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

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

      setDocuments(prev => ({ ...prev, [documentType]: true }));
      toast.success(`${documentLabels[documentType]} uploaded successfully!`);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });
    }
  };

  const handleCompleteRegistration = async () => {
    if (!user) return;

    const allDocsUploaded = Object.values(documents).every(status => status);
    if (!allDocsUploaded) {
      toast.error("Please upload all required documents");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ registration_completed: true })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Registration completed! Waiting for admin approval.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error completing registration:", error);
      toast.error("Failed to complete registration");
    } finally {
      setLoading(false);
    }
  };

  const completedDocs = Object.values(documents).filter(Boolean).length;
  const totalDocs = Object.keys(documents).length;
  const progress = step === 1 ? 0 : (completedDocs / totalDocs) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Registration</h1>
          <p className="text-muted-foreground">Step {step} of 2</p>
          <Progress value={step === 1 ? 50 : 50 + progress / 2} className="mt-4" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{isChef ? 'Chef Information' : 'Business Information'}</CardTitle>
              <CardDescription>
                {isChef 
                  ? 'Tell us about yourself and your culinary experience. All fields marked with * are required.'
                  : 'Tell us about your business. All fields marked with * are required.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  {!isChef && (
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Business Name *</Label>
                      <Input
                        id="company_name"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      required
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
                    <Label htmlFor="business_type">{isChef ? 'Chef Type *' : 'Business Type *'}</Label>
                    <Select
                      value={profileData.business_type}
                      onValueChange={(value) => setProfileData({ ...profileData, business_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {isChef ? (
                          <>
                            <SelectItem value="private_chef">Private Chef</SelectItem>
                            <SelectItem value="freelance_chef">Freelance Chef</SelectItem>
                            <SelectItem value="catering_chef">Catering Chef</SelectItem>
                            <SelectItem value="sous_chef">Sous Chef</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="food_truck">Food Truck</SelectItem>
                            <SelectItem value="catering">Catering Service</SelectItem>
                            <SelectItem value="pop_up">Pop-up Restaurant</SelectItem>
                            <SelectItem value="vendor_stall">Vendor Stall</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_category">{isChef ? 'Speciality *' : 'Service Category *'}</Label>
                    <Select
                      value={profileData.service_category}
                      onValueChange={(value) => setProfileData({ ...profileData, service_category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {isChef ? (
                          <>
                            <SelectItem value="fine_dining">Fine Dining</SelectItem>
                            <SelectItem value="home_cooking">Home Cooking</SelectItem>
                            <SelectItem value="meal_prep">Meal Prep</SelectItem>
                            <SelectItem value="dietary_specialist">Dietary Specialist</SelectItem>
                            <SelectItem value="international">International Cuisine</SelectItem>
                            <SelectItem value="pastry">Pastry & Desserts</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="street_food">Street Food</SelectItem>
                            <SelectItem value="desserts">Desserts</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="specialty">Specialty Cuisine</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="years_in_business">{isChef ? 'Years of Experience *' : 'Years in Business *'}</Label>
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
                  <Label htmlFor="bio">{isChef ? 'About You *' : 'Business Description *'}</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder={isChef ? "Tell us about your culinary experience and specialities..." : "Tell us about your business..."}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Continue to Documents"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Required Documents</CardTitle>
              <CardDescription>
                Please upload all required documents. Accepted formats: PDF, JPG, PNG (Max 10MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(documentLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {documents[key] ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{label}</p>
                      {uploadProgress[key] !== undefined && (
                        <Progress value={uploadProgress[key]} className="w-32 mt-1" />
                      )}
                    </div>
                  </div>
                  {key === 'signed_contract' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowContractDialog(true)}
                    >
                      <Pen className="h-4 w-4 mr-2" />
                      {documents.signed_contract ? "Re-sign" : "Sign Contract"}
                    </Button>
                  ) : (
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
                      disabled={uploadProgress[key] !== undefined}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {documents[key] ? "Replace" : "Upload"}
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCompleteRegistration}
                  disabled={!Object.values(documents).every(Boolean) || loading}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user && (
          <ContractSigningDialog
            open={showContractDialog}
            onOpenChange={setShowContractDialog}
            userId={user.id}
            userRole={userRole || 'vendor'}
            onContractSigned={() => {
              setDocuments(prev => ({ ...prev, signed_contract: true }));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CompleteRegistration;