import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import birdCoLogo from "@/assets/bird-co-logo.png";

const AccountDeletion = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <img 
            src={birdCoLogo} 
            alt="Bird & Co Events Logo" 
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Bird & Co Events</h1>
            <p className="text-sm text-muted-foreground">Vendor Hub App</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Account Deletion</CardTitle>
                <CardDescription>Bird & Co Vendor Hub - Delete Your Account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">How to Delete Your Account</h3>
              <p className="text-muted-foreground mb-4">
                If you wish to delete your Bird & Co Vendor Hub account and all associated data, 
                you can do so directly within the app:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Open the Bird & Co Vendor Hub app</li>
                <li>Log in to your account</li>
                <li>Navigate to <strong>Settings</strong> from the dashboard</li>
                <li>Scroll down to the "Delete Account" section</li>
                <li>Tap "Delete Account" and confirm your decision</li>
              </ol>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Important Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Account deletion is permanent and cannot be undone. When you delete your account, 
                    the following data will be permanently removed:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Your profile information</li>
                    <li>Uploaded documents and certificates</li>
                    <li>Application history</li>
                    <li>Completed events records</li>
                    <li>Referral submissions</li>
                    <li>Contact form submissions</li>
                    <li>Message history</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Data Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Your account deletion request will be processed immediately upon confirmation. 
                    All personal data associated with your account will be permanently deleted 
                    from our systems in accordance with our Privacy Policy.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
              <p className="text-muted-foreground">
                If you're having trouble deleting your account or have questions about your data, 
                please contact us:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Email: <a href="mailto:support@birdandcoevents.co.uk" className="text-primary hover:underline">support@birdandcoevents.co.uk</a></li>
                <li>Website: <a href="https://birdandcoevents.co.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">birdandcoevents.co.uk</a></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Bird & Co Events. All rights reserved.
        </p>
      </main>
    </div>
  );
};

export default AccountDeletion;
