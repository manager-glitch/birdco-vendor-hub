import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Bell, Send, Users, Megaphone, CheckCircle } from "lucide-react";

type NotificationType = "opportunity" | "custom";
type TargetAudience = "all" | "vendors" | "chefs";

const AdminNotifications = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [notificationType, setNotificationType] = useState<NotificationType>("opportunity");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("all");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  if (authLoading) {
    return null;
  }

  if (!user || !isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const handleSendNotification = async () => {
    setErrorMessage("");
    
    if (notificationType === "custom" && (!customTitle.trim() || !customMessage.trim())) {
      setErrorMessage("Please enter both a title and message");
      return;
    }

    setSending(true);

    try {
      const title = notificationType === "opportunity" 
        ? "New Opportunities Available!" 
        : customTitle.trim();
      
      const body = notificationType === "opportunity"
        ? "Check out the latest vendor opportunities on Bird & Co Events"
        : customMessage.trim();

      // Send to vendors
      if (targetAudience === "all" || targetAudience === "vendors") {
        await supabase.functions.invoke("send-push-notification", {
          body: { title, body, role: "vendor" },
        });
      }

      // Send to chefs
      if (targetAudience === "all" || targetAudience === "chefs") {
        await supabase.functions.invoke("send-push-notification", {
          body: { title, body, role: "chef" },
        });
      }

      setSent(true);

      // Reset form
      setCustomTitle("");
      setCustomMessage("");
    } catch (error: any) {
      console.error("Error sending notification:", error);
      setErrorMessage("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Send Notifications
          </h1>
          <p className="text-muted-foreground">
            Send push notifications to vendors and chefs
          </p>
        </div>

        {sent ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Notification Sent!</h3>
              <p className="text-muted-foreground mb-4">
                Successfully sent to {targetAudience === "all" ? "all users" : targetAudience}
              </p>
              <Button onClick={() => setSent(false)} variant="outline">
                Send Another
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {errorMessage}
              </div>
            )}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Notification Type
                </CardTitle>
                <CardDescription>
                  Choose what kind of notification to send
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={notificationType}
                  onValueChange={(value) => setNotificationType(value as NotificationType)}
                  className="space-y-3"
                >
                  <Label
                    htmlFor="opportunity"
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      notificationType === "opportunity"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="opportunity" id="opportunity" />
                    <div>
                      <p className="font-medium">New Opportunities Alert</p>
                      <p className="text-sm text-muted-foreground">
                        Notify users that new opportunities are available
                      </p>
                    </div>
                  </Label>
                  
                  <Label
                    htmlFor="custom"
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      notificationType === "custom"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="custom" id="custom" />
                    <div>
                      <p className="font-medium">Custom Message</p>
                      <p className="text-sm text-muted-foreground">
                        Send a custom notification with your own message
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {notificationType === "custom" && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Custom Message</CardTitle>
                  <CardDescription>
                    Enter your notification content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Notification Title</Label>
                    <Input
                      id="title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., Important Update"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter your message here..."
                      rows={4}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {customMessage.length}/200 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Target Audience
                </CardTitle>
                <CardDescription>
                  Choose who should receive this notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={targetAudience}
                  onValueChange={(value) => setTargetAudience(value as TargetAudience)}
                  className="grid grid-cols-3 gap-3"
                >
                  <Label
                    htmlFor="all"
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      targetAudience === "all"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="all" id="all" className="sr-only" />
                    <Users className="h-6 w-6 mb-2" />
                    <span className="font-medium text-sm">Everyone</span>
                  </Label>
                  
                  <Label
                    htmlFor="vendors"
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      targetAudience === "vendors"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="vendors" id="vendors" className="sr-only" />
                    <span className="text-2xl mb-1">🚚</span>
                    <span className="font-medium text-sm">Vendors</span>
                  </Label>
                  
                  <Label
                    htmlFor="chefs"
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      targetAudience === "chefs"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="chefs" id="chefs" className="sr-only" />
                    <span className="text-2xl mb-1">👨‍🍳</span>
                    <span className="font-medium text-sm">Chefs</span>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            <Button
              onClick={handleSendNotification}
              disabled={sending}
              className="w-full font-heading font-bold"
              size="lg"
            >
              <Send className="mr-2 h-5 w-5" />
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminNotifications;