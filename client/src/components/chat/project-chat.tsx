import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MessageSquare, 
  Users, 
  Paperclip, 
  Smile,
  MoreVertical,
  Phone,
  Video,
  Search
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';

interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface ProjectChatProps {
  projectId: string;
  currentUserId: string;
}

export default function ProjectChat({ projectId, currentUserId }: ProjectChatProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/chat', projectId],
    queryFn: () => apiRequest(`/api/chat?projectId=${projectId}`),
    refetchInterval: 5000, // Poll for new messages
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: (messageData: { message: string; type?: string }) =>
      apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          userId: currentUserId,
          userName: 'Current User', // This should come from auth context
          message: messageData.message,
          type: messageData.type || 'text',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', projectId] });
      setMessage('');
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage.mutate({ message: message.trim() });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = format(parseISO(message.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const formatMessageTime = (timestamp: string) => {
    return format(parseISO(timestamp), 'HH:mm');
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (dateString === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isLoading) {
    return (
      <Card className="h-[600px]">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-construction-orange" />
            <div>
              <CardTitle className="text-lg">Project Chat</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>5 members online</span>
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-0">
        {Object.keys(messageGroups).length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6">
            <div>
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start the conversation with your team
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600">
                    {formatDateHeader(date)}
                  </div>
                </div>

                {/* Messages for this date */}
                {dayMessages.map((msg, index) => {
                  const isOwnMessage = msg.userId === currentUserId;
                  const showAvatar = !isOwnMessage && (
                    index === 0 || 
                    dayMessages[index - 1]?.userId !== msg.userId
                  );

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 mb-3 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Avatar for other users */}
                      {!isOwnMessage && (
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                              <AvatarFallback className="text-xs">
                                {msg.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      <div className={`max-w-xs lg:max-w-md ${
                        isOwnMessage ? 'order-first' : ''
                      }`}>
                        {/* Message bubble */}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-construction-orange text-white'
                              : 'bg-gray-100 text-gray-900'
                          } ${
                            msg.type === 'system' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 text-center text-sm'
                              : ''
                          }`}
                        >
                          {/* Username for other users */}
                          {!isOwnMessage && showAvatar && (
                            <p className="text-xs font-medium mb-1 text-gray-600">
                              {msg.userName}
                            </p>
                          )}
                          
                          <p className="text-sm">{msg.message}</p>
                          
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((attachment, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  <span className="text-xs">{attachment.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className={`text-xs text-gray-500 mt-1 ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        }`}>
                          {formatMessageTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">...</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="pr-20 resize-none"
              maxLength={1000}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || sendMessage.isPending}
            className="bg-construction-orange hover:bg-orange-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {message.length > 800 && (
          <p className="text-xs text-muted-foreground mt-1">
            {1000 - message.length} characters remaining
          </p>
        )}
      </div>
    </Card>
  );
}