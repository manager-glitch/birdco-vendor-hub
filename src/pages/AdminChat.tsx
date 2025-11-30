import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface ConversationWithVendor {
  id: string;
  vendor_id: string;
  last_message_at: string;
  vendor_name: string;
  vendor_email: string;
  unread_count: number;
}

const AdminChat = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithVendor[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate("/dashboard");
      return;
    }
    loadConversations();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!selectedConversation || !user) return;
    loadMessages(selectedConversation);

    // Mark messages as read when viewing conversation
    const markAsRead = async () => {
      try {
        const { error } = await supabase.rpc('mark_messages_as_read', {
          conversation_uuid: selectedConversation,
          user_uuid: user.id
        });
        if (error) console.error('Error marking messages as read:', error);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAsRead();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`admin-messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          if (payload.new.sender_id !== user.id) {
            markAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  const loadConversations = async () => {
    try {
      // Get all conversations with vendor details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get vendor profiles
      const vendorIds = convData.map(c => c.vendor_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .in('id', vendorIds);

      if (profileError) throw profileError;

      // Get unread counts
      const conversationsWithDetails = await Promise.all(
        convData.map(async (conv) => {
          const profile = profiles?.find(p => p.id === conv.vendor_id);
          
          // Count unread messages (not sent by admin)
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user!.id)
            .is('read_at', null);

          return {
            ...conv,
            vendor_name: profile?.full_name || profile?.company_name || 'Unknown Vendor',
            vendor_email: 'Vendor',
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      if (user) {
        await supabase.rpc('mark_messages_as_read', {
          conversation_uuid: conversationId,
          user_uuid: user.id
        });
      }

      // Refresh conversation list to update unread counts
      loadConversations();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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
        <button onClick={() => navigate("/admin")} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="font-heading font-bold text-xl">Admin Chat</h1>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <Card className="p-4 col-span-1">
            <h2 className="font-heading font-bold text-lg mb-4">Vendor Conversations</h2>
            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No vendor conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {conv.vendor_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.vendor_name}</p>
                            {conv.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs opacity-60 truncate">{conv.vendor_email}</p>
                          <p className="text-xs opacity-60">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Messages Area */}
          <Card className="p-4 col-span-1 md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isAdmin = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isAdmin
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-xs font-medium mb-1 opacity-75">
                              {isAdmin ? 'Bird & Co' : 'Vendor'}
                            </p>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminChat;
