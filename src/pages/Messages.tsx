import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversations, useMessages, useSendMessage, Conversation } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { BottomNav } from '@/components/BottomNav';

export default function Messages() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Faça login para acessar suas mensagens.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <main className="max-w-2xl mx-auto border-x min-h-[calc(100vh-3.5rem)]">
        {selectedConv ? (
          <ChatView conversation={selectedConv} onBack={() => setSelectedConv(null)} currentUserId={user.id} />
        ) : (
          <ConversationList
            conversations={conversations || []}
            isLoading={isLoading}
            onSelect={setSelectedConv}
            currentUserId={user.id}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function ConversationList({ conversations, isLoading, onSelect, currentUserId }: {
  conversations: Conversation[];
  isLoading: boolean;
  onSelect: (c: Conversation) => void;
  currentUserId: string;
}) {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Mensagens</h1>
      </div>
      {isLoading && <div className="p-4 text-center text-muted-foreground">Carregando...</div>}
      {!isLoading && conversations.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>Nenhuma conversa ainda</p>
          <p className="text-sm mt-1">Inicie uma conversa pelo perfil de alguém</p>
        </div>
      )}
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b"
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={conv.other_user?.avatar_url ?? undefined} />
            <AvatarFallback>{conv.other_user?.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{conv.other_user?.username ?? 'Usuário'}</p>
            {conv.last_message && (
              <p className="text-sm text-muted-foreground truncate">
                {conv.last_message.sender_id === currentUserId ? 'Você: ' : ''}
                {conv.last_message.content}
              </p>
            )}
          </div>
          {conv.last_message && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conv.last_message.created_at), { locale: ptBR, addSuffix: false })}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ChatView({ conversation, onBack, currentUserId }: {
  conversation: Conversation;
  onBack: () => void;
  currentUserId: string;
}) {
  const { data: messages } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage.mutate({ conversationId: conversation.id, content: newMessage });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-8 h-8">
          <AvatarImage src={conversation.other_user?.avatar_url ?? undefined} />
          <AvatarFallback>{conversation.other_user?.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{conversation.other_user?.username ?? 'Usuário'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages?.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.sender_id === currentUserId ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[70%] px-4 py-2 rounded-2xl text-sm",
              msg.sender_id === currentUserId
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mensagem..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessage.isPending} className="gradient-brand hover:opacity-90">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
