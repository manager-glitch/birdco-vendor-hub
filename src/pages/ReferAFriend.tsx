import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";

const ReferAFriend = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    business_name: "",
    contact_info: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!user) {
      setErrorMessage("You must be logged in to submit a referral");
      return;
    }

    if (!formData.name || !formData.business_name || !formData.contact_info) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("referrals")
        .insert({
          vendor_id: user.id,
          name: formData.name,
          business_name: formData.business_name,
          contact_info: formData.contact_info,
          notes: formData.notes || null
        });

      if (error) throw error;

      setSubmitted(true);
      setFormData({
        name: "",
        business_name: "",
        contact_info: "",
        notes: ""
      });
    } catch (error: any) {
      console.error("Error submitting referral:", error);
      setErrorMessage("Failed to submit referral. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'chef' ? 'Refer a Chef' : 'Refer a Vendor'}
            </CardTitle>
            <CardDescription>
              Know someone who would be a great fit? Refer them to Bird & Co and receive a £20 gift voucher once your referred {userRole === 'chef' ? 'chef' : 'vendor'} completes their first event with us!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Referral Submitted!</h3>
                <p className="text-muted-foreground mb-4">Thank you for your referral. We'll be in touch soon.</p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Submit Another Referral
                </Button>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    {errorMessage}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter contact name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Enter business name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_info">Contact Info *</Label>
                    <Input
                      id="contact_info"
                      value={formData.contact_info}
                      onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                      placeholder="Email or phone number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional information..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Referral"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReferAFriend;