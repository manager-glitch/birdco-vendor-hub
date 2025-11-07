import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
  conversation_id: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
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
      </main>
    </div>
  );
};

export default Notifications;