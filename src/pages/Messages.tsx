import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversations, useMessages, useSendMessage, useUploadChatMedia, Conversation } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Send, Image, Mic, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { toast } from 'sonner';

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
  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.last_message) return '';
    const prefix = conv.last_message.sender_id === currentUserId ? 'Você: ' : '';
    if (conv.last_message.media_type?.startsWith('image/')) return `${prefix}📷 Foto`;
    if (conv.last_message.media_type?.startsWith('audio/')) return `${prefix}🎤 Áudio`;
    return `${prefix}${conv.last_message.content}`;
  };

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
                {getLastMessagePreview(conv)}
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
  const uploadMedia = useUploadChatMedia();
  const [newMessage, setNewMessage] = useState('');
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingMedia) || sendMessage.isPending) return;

    sendMessage.mutate({
      conversationId: conversation.id,
      content: newMessage || (pendingMedia?.type.startsWith('image/') ? '📷 Foto' : '🎤 Áudio'),
      mediaUrl: pendingMedia?.url,
      mediaType: pendingMedia?.type,
    });
    setNewMessage('');
    setPendingMedia(null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx. 10MB)');
      return;
    }

    try {
      const result = await uploadMedia.mutateAsync(file);
      setPendingMedia(result);
    } catch {
      toast.error('Erro ao enviar imagem');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });

        try {
          const result = await uploadMedia.mutateAsync(file);
          sendMessage.mutate({
            conversationId: conversation.id,
            content: '🎤 Áudio',
            mediaUrl: result.url,
            mediaType: result.type,
          });
        } catch {
          toast.error('Erro ao enviar áudio');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
              "max-w-[70%] rounded-2xl text-sm overflow-hidden",
              msg.sender_id === currentUserId
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            )}>
              {/* Image */}
              {msg.media_url && msg.media_type?.startsWith('image/') && (
                <img
                  src={msg.media_url}
                  alt="Imagem"
                  className="max-w-full rounded-t-2xl cursor-pointer"
                  onClick={() => window.open(msg.media_url!, '_blank')}
                />
              )}

              {/* Audio */}
              {msg.media_url && msg.media_type?.startsWith('audio/') && (
                <div className="px-4 pt-3">
                  <audio controls src={msg.media_url} className="max-w-full h-8" />
                </div>
              )}

              {/* Text content (hide default emoji labels for media-only) */}
              {msg.content && !(msg.media_url && (msg.content === '📷 Foto' || msg.content === '🎤 Áudio')) && (
                <div className="px-4 py-2">{msg.content}</div>
              )}

              {/* If media without custom text, add small padding */}
              {msg.media_url && (msg.content === '📷 Foto' || msg.content === '🎤 Áudio' || !msg.content) && (
                <div className="pb-1" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending media preview */}
      {pendingMedia && (
        <div className="px-4 py-2 border-t bg-muted/50 flex items-center gap-2">
          {pendingMedia.type.startsWith('image/') && (
            <img src={pendingMedia.url} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
          )}
          <span className="text-sm text-muted-foreground flex-1">
            {pendingMedia.type.startsWith('image/') ? 'Imagem pronta para enviar' : 'Áudio pronto para enviar'}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setPendingMedia(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Input */}
      {isRecording ? (
        <div className="p-4 border-t flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={cancelRecording}>
            <X className="w-5 h-5 text-destructive" />
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
            <span className="text-sm text-muted-foreground">Gravando...</span>
          </div>
          <Button size="icon" onClick={stopRecording} className="gradient-brand hover:opacity-90">
            <Square className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-4 border-t flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMedia.isPending}
          >
            <Image className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startRecording}
          >
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mensagem..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!newMessage.trim() && !pendingMedia) || sendMessage.isPending}
            className="gradient-brand hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
