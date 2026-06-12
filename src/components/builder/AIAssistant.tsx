"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, MessageCircle, Loader2, Sparkles, Mic, MicOff, Volume2, VolumeX, Trash2, ChevronDown, ChevronLeft, ChevronRight, ArrowDown } from "lucide-react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { chatApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { AppConfig, AIProvider } from "@/stores/useAppStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface AIAssistantProps {
  currentStep: number;
  config: AppConfig;
  onUpdateConfig?: (updates: Partial<AppConfig>) => void;
}

const aiProviders = [
  { id: "gemini" as AIProvider, name: "Gemini", icon: "✨" },
  { id: "openai" as AIProvider, name: "GPT", icon: "🤖" },
];

const quickPrompts = {
  1: [
    "What URL should I use?",
    "How does the analysis work?",
    "What sites work best?",
    "Can I use my own domain?",
  ],
  2: [
    "Explain navigation styles",
    "Which features should I enable?",
    "Best icon style for my app?",
    "How to customize colors?",
  ],
  3: [
    "How accurate is this preview?",
    "Can I test on my phone?",
    "Why isn't my site loading?",
    "How to share preview link?",
  ],
  4: [
    "How long does building take?",
    "What formats are available?",
    "How to submit to App Store?",
    "Can I update my app later?",
  ],
};

const defaultWelcome: Message = {
  role: "assistant",
  content: "Hi! 👋 I'm Forge AI, your app building assistant. How can I help you today?",
  timestamp: new Date(),
};

const formatTime = (date?: Date) => {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const AIAssistant = ({ currentStep, config, onUpdateConfig }: AIAssistantProps) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([defaultWelcome]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyLoadedRef = useRef(false);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // Auto-scroll when messages update or streaming content changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isAtBottom);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && user && projectId && !historyLoadedRef.current) {
      loadChatHistory();
    }
  }, [isOpen, user, projectId]);

  const loadChatHistory = async () => {
    if (!user || !projectId) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await chatApi.getHistory(projectId);
      
      if (response.error) throw response.error;
      
      const data = response.data || [];
      if (data.length > 0) {
        setMessages([{ ...defaultWelcome, timestamp: new Date() }, ...data.map((m: any) => ({ 
          id: m.id, 
          role: m.role as "user" | "assistant", 
          content: m.content,
          timestamp: new Date(m.created_at),
        }))]);
      }
      historyLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!user || !projectId) return;
    
    try {
      await chatApi.saveMessage(projectId, role, content);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const clearHistory = async () => {
    if (!user || !projectId) return;
    
    try {
      const response = await chatApi.clearHistory(projectId);
      
      if (response.error) throw response.error;
      
      setMessages([{ ...defaultWelcome, timestamp: new Date() }]);
      historyLoadedRef.current = false;
      toast({
        title: "Chat cleared",
        description: "Your conversation history has been deleted.",
      });
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast({
        title: "Failed to clear chat",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      setInput(data.text);
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        setInput(data.text);
        setTimeout(() => {
          sendMessageFromVoice(data.text);
        }, 300);
      }
    },
  });

  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled || !text) return;

    // Stop any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    try {
      // Clean text - remove emojis for cleaner speech
      const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, "").trim();
      if (!cleanText) {
        setIsSpeaking(false);
        return;
      }

      const response = await fetch(
        `/api/ai/tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const sendMessageFromVoice = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    scribe.disconnect();
    setIsRecording(false);
    
    await sendMessageInternal(text.trim());
  };

  useEffect(() => {
    if (isOpen && inputRef.current && !isRecording) {
      inputRef.current.focus();
    }
  }, [isOpen, isRecording]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const sendMessageInternal = async (messageText: string) => {
    const userMessage: Message = { role: "user", content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(false);
    setStreamingContent("");

    // Save user message
    saveMessage("user", messageText);

    try {
      const response = await fetch(
        `/api/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageText,
            currentStep,
            config,
            conversationHistory: messages.slice(-6),
            aiProvider: config.aiProvider || "gemini",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Request failed");
      }

      setIsLoading(false);
      setIsStreaming(true);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            // Skip unparseable - might be partial JSON
          }
        }
      }

      // Finalize the message
      const finalContent = fullContent || "Sorry, I couldn't process that. Please try again!";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: finalContent, timestamp: new Date() },
      ]);
      setStreamingContent("");
      setIsStreaming(false);

      // Save and speak the response
      saveMessage("assistant", finalContent);
      speakText(finalContent);
    } catch (error) {
      console.error("Assistant error:", error);
      const errorMessage = error instanceof Error && error.message !== "Request failed" 
        ? error.message 
        : "Oops! Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage, timestamp: new Date() },
      ]);
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    await sendMessageInternal(messageText.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      scribe.disconnect();
      setIsRecording(false);
    } else {
      // Stop any ongoing speech when starting to record
      stopSpeaking();
      
      setIsConnecting(true);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const response = await fetch(`/api/ai/scribe-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();

        if (!response.ok || !data?.token) {
          throw new Error("Failed to get voice token");
        }

        await scribe.connect({
          token: data.token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        setIsRecording(true);
      } catch (error) {
        console.error("Voice recording error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Couldn't start voice input. Please check your microphone permissions.",
          },
        ]);
      } finally {
        setIsConnecting(false);
      }
    }
  }, [isRecording, scribe, stopSpeaking]);

  const currentQuickPrompts = quickPrompts[currentStep as keyof typeof quickPrompts] || quickPrompts[1];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-accent hover:scale-105 transition-transform"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
            <Bot className="h-5 w-5 text-primary-foreground" />
            {isSpeaking && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-foreground rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-primary-foreground">Forge AI</h3>
            <p className="text-xs text-primary-foreground/80">
              {isSpeaking ? "Speaking..." : "AI Assistant"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/20 text-xs gap-1 px-2"
              >
                {aiProviders.find(p => p.id === config.aiProvider)?.icon || "✨"}
                {aiProviders.find(p => p.id === config.aiProvider)?.name || "Gemini"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {aiProviders.map((provider) => (
                <DropdownMenuItem
                  key={provider.id}
                  onClick={() => onUpdateConfig?.({ aiProvider: provider.id })}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{provider.icon}</span>
                  {provider.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-white/20"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all messages in this conversation. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            className="text-primary-foreground hover:bg-white/20"
            title={voiceEnabled ? "Mute voice" : "Enable voice"}
          >
            {voiceEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-none">
        <ScrollArea ref={scrollAreaRef} className="h-[350px] max-h-[350px] w-full">
          <div className="p-4 space-y-4">
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading history...</span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.timestamp && (
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                ))}
                {isStreaming && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
                      {streamingContent}
                      <span className="inline-block w-1 h-4 ml-0.5 bg-primary/60 animate-pulse" />
                    </div>
                  </div>
                )}
                {isLoading && !isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg hover:bg-primary/90 transition-all animate-fade-in"
          >
            <ArrowDown className="h-3 w-3" />
            New messages
          </button>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 pb-2">
        <div className="relative flex items-center">
          {/* Left fade gradient */}
          <div className="absolute left-0 z-10 w-12 h-full bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
          
          {/* Left arrow */}
          <button
            onClick={() => {
              const container = document.getElementById('quick-prompts-container');
              if (container) container.scrollBy({ left: -150, behavior: 'smooth' });
            }}
            className="absolute left-0 z-20 w-6 h-6 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full shadow-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          
          <div 
            id="quick-prompts-container"
            className="flex gap-2 overflow-x-auto pb-2 px-8 scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {currentQuickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isLoading || isRecording}
                className="shrink-0 px-3 py-1.5 text-xs bg-secondary/50 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <Sparkles className="inline h-3 w-3 mr-1" />
                {prompt}
              </button>
            ))}
          </div>
          
          {/* Right arrow */}
          <button
            onClick={() => {
              const container = document.getElementById('quick-prompts-container');
              if (container) container.scrollBy({ left: 150, behavior: 'smooth' });
            }}
            className="absolute right-0 z-20 w-6 h-6 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full shadow-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
          
          {/* Right fade gradient */}
          <div className="absolute right-0 z-10 w-12 h-full bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Voice Recording Indicator */}
      {isRecording && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg border border-destructive/30">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-xs text-destructive">Listening... speak now</span>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 pt-2 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Ask me anything..."}
            disabled={isLoading || isRecording}
            className="flex-1 bg-secondary/50"
          />
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={toggleRecording}
            disabled={isLoading || isConnecting}
            className="shrink-0"
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || isRecording}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;
