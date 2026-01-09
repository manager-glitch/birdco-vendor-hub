import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MessageCircle, Loader2, Send, Users, Megaphone, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
  conversation_id: string;
}

type NotificationType = "opportunity" | "custom";
type TargetAudience = "all" | "vendors" | "chefs";

const Notifications = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin notification state
  const [sending, setSending] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType>("opportunity");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("all");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadUnreadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('notification-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadUnreadMessages = async () => {
    if (!user) return;
    
    try {
      // Get all conversations for this user
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('vendor_id', user.id);

      if (!conversations || conversations.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Get unread messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (conversationId: string) => {
    navigate(`/chat?conversation=${conversationId}`);
  };

  const handleSendNotification = async () => {
    if (notificationType === "custom" && (!customTitle.trim() || !customMessage.trim())) {
      toast({
        title: "Missing information",
        description: "Please enter both a title and message",
        variant: "destructive",
      });
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

      toast({
        title: "Notification sent!",
        description: `Successfully sent to ${targetAudience === "all" ? "all users" : targetAudience}`,
      });

      // Reset form
      setCustomTitle("");
      setCustomMessage("");
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-heading font-bold text-xl">Notifications</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {isAdmin ? (
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="send" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send
              </TabsTrigger>
              <TabsTrigger value="inbox" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Inbox
              </TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-6">
              <Card>
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
                <Card>
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

              <Card>
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
            </TabsContent>

            <TabsContent value="inbox">
              <Card>
                <CardContent className="pt-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No new notifications</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      <div className="space-y-3">
                        {messages.map((message) => (
                          <button
                            key={message.id}
                            onClick={() => handleNotificationClick(message.conversation_id)}
                            className="w-full p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left"
                          >
                            <div className="flex items-start gap-3">
                              <MessageCircle className="h-5 w-5 mt-1 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium mb-1">New message from Bird & Co</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {message.content}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No new notifications</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <button
                        key={message.id}
                        onClick={() => handleNotificationClick(message.conversation_id)}
                        className="w-full p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <MessageCircle className="h-5 w-5 mt-1 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium mb-1">New message from Bird & Co</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Notifications;