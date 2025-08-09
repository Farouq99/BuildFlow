import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Users, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/lib/schema';
import io, { Socket } from 'socket.io-client';

interface ProjectChatProps {
  projectId: string;
  currentUserId: string;
}

interface ChatMessageWithUser extends ChatMessage {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ProjectChat({ projectId, currentUserId }: ProjectChatProps) {
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize socket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = io(wsUrl, {
      query: { projectId, userId: currentUserId }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('message', (message: ChatMessageWithUser) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('userJoined', (userId: string) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('userLeft', (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    newSocket.on('typing', ({ userId, isTyping: typing }) => {
      if (userId !== currentUserId) {
        setIsTyping(prev => ({ ...prev, [userId]: typing }));
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [projectId, currentUserId]);

  // Fetch chat history
  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ['/api/chat', projectId],
    queryFn: () => apiRequest(`/api/chat?projectId=${projectId}`),
  });

  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory);
      scrollToBottom();
    }
  }, [chatHistory]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { message: string; projectId: string }) =>
      apiRequest('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      }),
    onSuccess: (data) => {
      // Message will be received via socket
      setNewMessage('');
      if (socket) {
        socket.emit('message', data);
      }
    },
    onError: () => {
      toast({
        title: 'Failed to send message',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({
        message: newMessage.trim(),
        projectId,
      });
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (socket) {
      socket.emit('typing', { isTyping: true });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 1 second
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { isTyping: false });
      }, 1000);
    }
  };

  const formatMessageTime = (date: string) => {
    return format(new Date(date), 'MMM dd, HH:mm');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading chat...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-96 sm:h-[500px]">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Project Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">
              {onlineUsers.length} online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.userId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[70%] ${
                    message.userId === currentUserId ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {message.user ? getUserInitials(message.user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.userId === currentUserId
                        ? 'bg-construction-orange text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <div className="text-sm">
                      {message.message}
                    </div>
                    <div
                      className={`text-xs mt-1 opacity-70 ${
                        message.userId === currentUserId ? 'text-white' : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicators */}
          {Object.entries(isTyping).some(([_, typing]) => typing) && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">...</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="bg-construction-orange hover:bg-orange-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}