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

interface Conversation {
  id: string;
  vendor_id: string;
  last_message_at: string;
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadConversations();

    // Check for conversation parameter in URL
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('conversation');
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  }, [user]);

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
      .channel(`messages:${selectedConversation}`)
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
          // Mark new messages as read immediately if they're not from the current user
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
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('vendor_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          vendor_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setConversations([data]);
        setSelectedConversation(data.id);
        toast.success('Started new conversation with Bird & Co');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
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
      <div className="min-h-screen bg-background">
        <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="font-heading font-bold text-xl">Chat</h1>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] gap-4">
          <p className="text-lg text-muted-foreground">Start a conversation with Bird & Co</p>
          <Button onClick={createNewConversation}>
            Start Live Chat
          </Button>
        </div>
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
        <h1 className="font-heading font-bold text-xl">Chat</h1>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <Card className="p-4 col-span-1">
            <h2 className="font-heading font-bold text-lg mb-4">Conversations</h2>
            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No conversations yet
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
                          <AvatarFallback>BC</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Bird & Co Team</p>
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
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
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

export default Chat;
