import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Check, 
  CheckCheck, 
  Circle, 
  Loader2, 
  Send, 
  Paperclip,
  Search,
  ThumbsUp,
  Heart,
  Smile
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ChatEnhancementsProps {
  requestId: string;
  messages: any[];
  onSendMessage: (message: string, images?: string[]) => void;
  otherUserId: string;
}

interface TypingStatus {
  user_id: string;
  is_typing: boolean;
  last_updated: string;
}

interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

export function ChatEnhancements({ requestId, messages, onSendMessage, otherUserId }: ChatEnhancementsProps) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    // Setup presence tracking
    const presenceChannel = supabase
      .channel(`presence-${requestId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const presence = Object.values(state).find((p: any) => 
          p[0]?.user_id === otherUserId
        ) as any;
        
        if (presence?.[0]) {
          setUserPresence(presence[0]);
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const presence = newPresences.find((p: any) => p.user_id === otherUserId);
        if (presence) {
          setUserPresence(presence as unknown as UserPresence);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const presence = leftPresences.find((p: any) => p.user_id === otherUserId);
        if (presence) {
          setUserPresence(prev => prev ? { ...prev, is_online: false, last_seen: new Date().toISOString() } : null);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            is_online: true,
            last_seen: new Date().toISOString()
          });
        }
      });

    // Setup typing indicators
    const typingChannel = supabase
      .channel(`typing-${requestId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(t => t.user_id !== payload.user_id);
            if (payload.is_typing) {
              return [...filtered, payload];
            }
            return filtered;
          });
        }
      })
      .subscribe();

    return () => {
      presenceChannel.unsubscribe();
      typingChannel.unsubscribe();
    };
  }, [user, requestId, otherUserId]);

  useEffect(() => {
    // Filter messages based on search
    if (searchQuery.trim()) {
      const filtered = messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      
      // Broadcast typing status
      supabase
        .channel(`typing-${requestId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user?.id,
            is_typing: true,
            last_updated: new Date().toISOString()
          }
        });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      supabase
        .channel(`typing-${requestId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user?.id,
            is_typing: false,
            last_updated: new Date().toISOString()
          }
        });
    }, 2000);
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("id", messageId)
        .neq("sender_id", user?.id);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      // In a real implementation, you'd have a reactions table
      // For now, we'll simulate this
      console.log(`Adding ${emoji} reaction to message ${messageId}`);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const MessageStatus = ({ message }: { message: any }) => {
    if (message.sender_id === user?.id) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {message.is_read ? (
            <CheckCheck className="w-3 h-3 text-blue-500" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </div>
      );
    }
    return null;
  };

  const TypingIndicator = () => {
    const typingUser = typingUsers.find(t => t.user_id === otherUserId && t.is_typing);
    
    if (!typingUser) return null;

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
        <div className="flex gap-1">
          <Circle className="w-2 h-2 fill-current animate-bounce" />
          <Circle className="w-2 h-2 fill-current animate-bounce" style={{ animationDelay: '0.1s' }} />
          <Circle className="w-2 h-2 fill-current animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <span>Digitando...</span>
      </div>
    );
  };

  const UserPresenceIndicator = () => {
    if (!userPresence) return null;

    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${userPresence.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
        {userPresence.is_online ? (
          <span>Online</span>
        ) : (
          <span>Visto por último: {new Date(userPresence.last_seen).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* User Presence */}
      <Card className="p-3">
        <UserPresenceIndicator />
      </Card>

      {/* Search */}
      {showSearch && (
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nas mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent p-0 focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              Fechar
            </Button>
          </div>
        </Card>
      )}

      {/* Enhanced Messages */}
      <div className="space-y-3">
        {filteredMessages.map((message) => (
          <Card key={message.id} className="p-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                {message.sender?.avatar_url ? (
                  <img src={message.sender.avatar_url} alt={message.sender.name} />
                ) : (
                  <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                    {message.sender?.name?.charAt(0)}
                  </div>
                )}
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{message.sender?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <MessageStatus message={message} />
                </div>
                
                <p className="text-sm mb-2">{message.content}</p>
                
                {message.image_url && (
                  <img 
                    src={message.image_url} 
                    alt="Mensagem" 
                    className="max-w-xs rounded-lg mb-2"
                  />
                )}

                {/* Quick Reactions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => addReaction(message.id, "👍")}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => addReaction(message.id, "❤️")}
                  >
                    <Heart className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Typing Indicator */}
      <TypingIndicator />

      {/* Enhanced Input Area */}
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Digite sua mensagem..."
            className="flex-1"
            onChange={handleTyping}
          />
          <Button size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}