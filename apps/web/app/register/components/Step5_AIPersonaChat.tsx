'use client';

import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery, gql, useApolloClient } from '@apollo/client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Keep for potential multi-line fallback? Or remove if Input is sufficient.
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Send, ArrowRight } from "lucide-react";
import { ME_QUERY } from '@/graphql/queries'; // Assuming ME_QUERY is defined elsewhere

// Define actual GraphQL operations based on the requirements
const GET_PERSONA_CHAT_STATE_QUERY = gql`
  query GetPersonaChatState {
    getPersonaChatState {
      currentPersonaIndex # 1-based index
      currentUserMessageCount
      messages {
        id
        sender
        text
        timestamp
      }
      persona {
        id
        name
        avatarUrl
        description
      }
      totalPersonas
    }
  }
`;

// Mutation to save persona chat message (intra-step saving)
const SAVE_PERSONA_CHAT_MESSAGE_MUTATION = gql`
  mutation SavePersonaChatMessage($input: SavePersonaMessageInput!) {
    savePersonaChatMessage(input: $input) {
      userMessage {
        id
        sender
        text
        timestamp
      }
      aiMessage {
        id
        sender
        text
        timestamp
      }
      messageCount
      isComplete
    }
  }
`;

// Mutation to complete persona chats
const COMPLETE_PERSONA_CHATS_MUTATION = gql`
  mutation CompletePersonaChats {
    completePersonaChats {
      success
      registrationStep
    }
  }
`;

const ADVANCE_TO_NEXT_PERSONA_MUTATION = gql`
  mutation AdvanceToNextPersona($currentPersonaIndex: Int!) {
    advanceToNextPersona(currentPersonaIndex: $currentPersonaIndex) {
      nextPersonaIndex # 1-based index
      initialMessage { # Optional initial message from the new persona
        id
        sender
        text
        timestamp
      }
      nextPersona {
         id
         name
         avatarUrl
         description
      }
    }
  }
`;

// Interfaces (assuming these match GraphQL types)
interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

interface Persona {
    id: string;
    name: string;
    avatarUrl?: string;
    description?: string;
}

interface PersonaChatState {
    currentPersonaIndex: number; // 1-based
    currentUserMessageCount: number;
    messages: ChatMessage[];
    persona: Persona;
    totalPersonas: number;
}

// Helper function for timestamp
const formatTime = (timestamp: string | number): string => {
  try {
    // Format to HH:MM AM/PM
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch (e) {
    console.warn("Error formatting time:", e);
    return ''; // Handle potential invalid date format
  }
};

const MIN_MESSAGES_PER_PERSONA = 6;

const Step5_AIPersonaChat: React.FC = () => {
  const { user } = useAuth(); // Still needed if UI depends on user info
  const client = useApolloClient();

  // State Management
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState<number>(1); // 1-based
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserMessageCount, setCurrentUserMessageCount] = useState<number>(0);
  const [totalPersonas, setTotalPersonas] = useState<number>(6); // Default, will be updated by query
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
  const { loading: isLoadingState, error: stateError } = useQuery<{ getPersonaChatState: PersonaChatState }>(
    GET_PERSONA_CHAT_STATE_QUERY,
    {
      fetchPolicy: 'network-only', // Ensure we get the latest state
      onCompleted: (data) => {
        if (data?.getPersonaChatState) {
          const state = data.getPersonaChatState;
          setCurrentPersonaIndex(state.currentPersonaIndex);
          setCurrentUserMessageCount(state.currentUserMessageCount);
          setMessages(state.messages || []);
          setCurrentPersona(state.persona);
          setTotalPersonas(state.totalPersonas);
          setError(null);
          
          // Check if all personas are complete
          if (state.currentPersonaIndex === state.totalPersonas &&
              state.currentUserMessageCount >= MIN_MESSAGES_PER_PERSONA) {
            setIsComplete(true);
          }
          
          scrollToBottom();
        }
      },
      onError: (err) => {
        console.error("Error fetching persona chat state:", err);
        setError("Failed to load chat state. Please refresh the page.");
      },
    }
  );

  // --- Mutations ---
  // Mutation to save persona chat message
  const [saveMessageMutation] = useMutation(
    SAVE_PERSONA_CHAT_MESSAGE_MUTATION,
    {
      onCompleted: (data) => {
        if (data?.savePersonaChatMessage) {
          const { aiMessage, messageCount, isComplete: messageComplete } = data.savePersonaChatMessage;
          
          // Add AI response to messages
          if (aiMessage) {
            setMessages(prev => [...prev, aiMessage]);
          }
          
          // Update message count
          if (messageCount !== undefined) {
            setCurrentUserMessageCount(messageCount);
          }
          
          // Check if persona chat is complete
          if (messageComplete && isLastPersona) {
            setIsComplete(true);
          }
          
          scrollToBottom();
          
          // Refetch ME_QUERY to check if the backend updated registrationStep
          // This happens implicitly if the last message for the last persona completes the step
          client.refetchQueries({ include: [ME_QUERY] });
        }
        setIsSending(false);
        setNewMessage(''); // Clear input only after successful send and response
      },
      onError: (err) => {
        console.error("Error saving message:", err);
        setError("Failed to send message. Please try again.");
        // Optional: Remove optimistic message if needed
        // setMessages(prev => prev.slice(0, -1));
        setIsSending(false);
      }
    }
  );
  
  // Mutation to complete persona chats
  const [completePersonaChats, { loading: completingLoading }] = useMutation(
    COMPLETE_PERSONA_CHATS_MUTATION,
    {
      onCompleted: (data) => {
        if (data?.completePersonaChats?.success) {
          // Refetch user data to update registrationStep
          client.refetchQueries({ include: [ME_QUERY] });
        }
        setIsCompleting(false);
      },
      onError: (err) => {
        console.error("Error completing persona chats:", err);
        setError("Failed to complete persona chats. Please try again.");
        setIsCompleting(false);
      }
    }
  );

  const [advancePersonaMutation] = useMutation<
    { advanceToNextPersona: { nextPersonaIndex: number; initialMessage?: ChatMessage, nextPersona: Persona } },
    { currentPersonaIndex: number }
  >(ADVANCE_TO_NEXT_PERSONA_MUTATION, {
    onCompleted: (data) => {
      if (data?.advanceToNextPersona) {
        const { nextPersonaIndex, initialMessage, nextPersona } = data.advanceToNextPersona;
        setCurrentPersonaIndex(nextPersonaIndex);
        setCurrentPersona(nextPersona);
        setCurrentUserMessageCount(0); // Reset count for new persona
        setMessages(initialMessage ? [initialMessage] : []); // Start with initial message or empty
        setError(null);
        scrollToBottom();
      }
      setIsAdvancing(false);
    },
    onError: (err) => {
      console.error("Error advancing to next persona:", err);
      setError("Failed to advance to the next persona. Please try again.");
      setIsAdvancing(false);
    }
  });

  // --- Derived State ---
  const canProceedToNext = currentUserMessageCount >= MIN_MESSAGES_PER_PERSONA;
  const isLastPersona = currentPersonaIndex === totalPersonas;

  // --- Helper Functions & Callbacks ---
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
       const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
       if (scrollViewport) {
           scrollViewport.scrollTop = scrollViewport.scrollHeight;
       }
    }, 100); // Delay slightly to allow DOM update
  }, []);

  // Effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // --- Event Handlers ---
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending || isAdvancing || !currentPersona) return;

    const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`, sender: 'USER', text: newMessage.trim(), timestamp: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage(''); // Clear input immediately for better UX
    setIsSending(true);
    setError(null);
    scrollToBottom();

    // Call mutation
    saveMessageMutation({
      variables: {
        input: {
          personaIndex: currentPersonaIndex,
          message: optimisticMessage.text
        }
      }
    });
  };

  const handleNextPersona = () => {
    if (isAdvancing || !canProceedToNext || isLastPersona) return;

    setIsAdvancing(true);
    setError(null);

    advancePersonaMutation({
      variables: {
        currentPersonaIndex: currentPersonaIndex
      }
    });
  };
  
  // Handle completing the persona chats
  const handleComplete = () => {
    if (isCompleting || !isComplete) return;
    
    setIsCompleting(true);
    setError(null);
    
    completePersonaChats();
  };

  // --- Render Logic ---
  if (isLoadingState) {
     return (
        <Card className="w-full max-w-2xl mx-auto flex flex-col h-[80vh]">
            <CardHeader> <Skeleton className="h-6 w-1/2" /> <Skeleton className="h-4 w-3/4 mt-1" /> </CardHeader>
            <CardContent className="flex-grow"><Skeleton className="h-full w-full" /></CardContent>
            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
     );
  }

  if (stateError || !currentPersona) {
      return (
          <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                  <CardTitle>Error</CardTitle>
              </CardHeader>
              <CardContent>
                  <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Failed to Load Step</AlertTitle>
                      <AlertDescription>{error || "Could not load the AI Persona Chat step. Please try refreshing the page."}</AlertDescription>
                  </Alert>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col h-[80vh]">
      {/* Keep Step Title and Progress outside the main chat container */}
      <CardHeader>
        <CardTitle>Step 5: AI Persona Chats ({currentPersonaIndex} / {totalPersonas})</CardTitle>
        <div className="mt-2">
          <Label className="text-sm text-muted-foreground">Messages Sent: {currentUserMessageCount} / {MIN_MESSAGES_PER_PERSONA}</Label>
          <Progress value={Math.min(100, (currentUserMessageCount / MIN_MESSAGES_PER_PERSONA) * 100)} className="h-2 mt-1" />
        </div>
      </CardHeader>

      {/* Main Chat Container */}
      <CardContent className="flex-grow p-0 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full rounded-lg border overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center">
              <Avatar className="mr-3">
                  <AvatarImage src={currentPersona.avatarUrl || "/default-avatar.png"} alt={currentPersona.name} />
                  <AvatarFallback>{currentPersona.name?.substring(0, 2) || 'AI'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{currentPersona.name}</h3>
                <p className="text-xs text-muted-foreground">{currentPersona.description || "AI Persona"}</p>
              </div>
            </div>
          </div>

          {/* Message List Area */}
          {/* Use ScrollArea for consistent scrollbar styling, apply flex-1 and overflow-y-auto to its viewport */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
             <div className="p-4 space-y-4">
                {messages.map((msg) => {
                  const isSender = msg.sender === 'USER';
                  return (
                    <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                      {/* Message Bubble */}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isSender
                          ? 'bg-primary text-primary-foreground rounded-tr-none' // Sender style
                          : 'bg-muted rounded-tl-none' // Receiver style
                      }`}>
                        {/* Basic whitespace handling */}
                        <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                        {/* Timestamp */}
                        <span className="text-xs opacity-70 block text-right mt-1">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isSending && ( // Show indicator while waiting for AI response
                  <div className="flex justify-start items-center space-x-2">
                     <Avatar className="h-8 w-8 flex-shrink-0">
                         <AvatarImage src={currentPersona.avatarUrl || "/default-avatar.png"} alt={currentPersona.name} />
                         <AvatarFallback>{currentPersona.name?.substring(0, 2) || 'AI'}</AvatarFallback>
                     </Avatar>
                     <div className="bg-muted rounded-lg px-4 py-2 rounded-tl-none">
                         <span className="italic text-muted-foreground">Typing...</span>
                     </div>
                  </div>
                )}
             </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-full flex-1 mr-2" // Use updated Input style
                disabled={isSending || isAdvancing}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              />
              <Button type="submit" size="icon" className="rounded-full" disabled={isSending || isAdvancing || !newMessage.trim()}> {/* Use updated Button style */}
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      </CardContent>

      {/* Keep Footer for Errors and Next/Complete Buttons */}
      <CardFooter className="p-4 border-t flex-col items-stretch space-y-2">
         {error && (
            <Alert variant="destructive"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Error</AlertTitle> <AlertDescription>{error}</AlertDescription> </Alert>
          )}
        {/* Next/Complete Buttons */}
        <div className="flex justify-end">
            {!isLastPersona && (
                <Button
                    onClick={handleNextPersona}
                    disabled={!canProceedToNext || isSending || isAdvancing}
                    variant="outline"
                >
                    {isAdvancing ? 'Loading Next...' : 'Next Persona'}
                    {!isAdvancing && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            )}
            {isLastPersona && isComplete && (
                <Button
                    onClick={handleComplete}
                    disabled={isCompleting || completingLoading}
                    className="ml-2"
                >
                    {isCompleting ? 'Completing...' : 'Complete & Continue'}
                </Button>
            )}
            {isLastPersona && canProceedToNext && !isComplete && (
                <span className="text-sm text-muted-foreground italic ml-auto"> {/* Use ml-auto to push to right */}
                    Send your final messages to complete this step.
                </span>
            )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default Step5_AIPersonaChat;