'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery } from '@apollo/client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Reusing textarea
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area"; // For chat messages
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For AI avatar
import { AlertCircle, Send } from "lucide-react";
// Potentially reuse MessageInput or TypingIndicator if they exist and are suitable
// import MessageInput from '@/components/MessageInput';
// import TypingIndicator from '@/components/TypingIndicator';

// TODO: Define actual GraphQL queries/mutations
const GET_INTRO_SCREEN_QUERY = {} as any; // Placeholder - Input: type = 'relationship_coach'
const GET_COACH_CONVERSATION_QUERY = {} as any; // Placeholder
const SAVE_COACH_MESSAGE_MUTATION = {} as any; // Placeholder - Input: { text: string }, Returns: ChatMessage (incl. AI response)
const COMPLETE_COACH_INTERACTION_MUTATION = {} as any; // Placeholder (Final submission for the step)

// TODO: Define based on actual ChatMessage type from backend/GraphQL schema
interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string; // Or Date object
}

interface IntroScreen {
    title: string;
    content: string;
}

const Step4_AICoachChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [introScreen, setIntroScreen] = useState<IntroScreen | null>(null);
  const [isLoadingIntro, setIsLoadingIntro] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // TODO: Fetch Intro Screen
  // const { loading: loadingIntro } = useQuery(GET_INTRO_SCREEN_QUERY, { variables: { type: 'relationship_coach' }, ... });
  useEffect(() => {
    console.log("Step 4: Fetching intro screen...");
    const timer = setTimeout(() => {
        setIntroScreen({ title: "Meet Your AI Coach", content: "Let's talk about your relationship goals..." });
        setIsLoadingIntro(false);
        console.log("Step 4: Intro screen loaded (simulated).");
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // TODO: Fetch Conversation History
  // const { loading: loadingHistory } = useQuery(GET_COACH_CONVERSATION_QUERY, { ... });
   useEffect(() => {
    console.log("Step 4: Fetching conversation history...");
    const timer = setTimeout(() => {
        // Simulate setting fetched messages if needed
        // setMessages(fetchedMessages);
        setIsLoadingHistory(false);
        console.log("Step 4: History loaded (simulated).");
        scrollToBottom();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // TODO: Implement message sending mutation
  const [sendMessage] = useMutation(SAVE_COACH_MESSAGE_MUTATION, {
    onCompleted: (data) => {
      if (data?.saveCoachMessage) {
        // Expect backend to return user message + AI response(s)
        // Or just user message, and AI response comes via subscription/polling? Assume included for now.
        const returnedMessages = Array.isArray(data.saveCoachMessage) ? data.saveCoachMessage : [data.saveCoachMessage];
        setMessages(prev => [...prev, ...returnedMessages]);
        scrollToBottom();
      }
      setIsSending(false);
      setNewMessage(''); // Clear input after sending
    },
    onError: (err) => {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      setIsSending(false);
    }
  });

  // TODO: Implement final step submission mutation
  const [completeStep] = useMutation(COMPLETE_COACH_INTERACTION_MUTATION, {
     onCompleted: (data) => {
       console.log("AI Coach step submitted successfully, updating user step...");
       // TODO: Implement ME_QUERY refetch or configure mutation cache update
       setIsSubmittingStep(false);
     },
     onError: (err) => {
       console.error("Error completing AI coach step:", err);
       setError("Failed to complete this step. Please try again.");
       setIsSubmittingStep(false);
     }
  });

  const scrollToBottom = () => {
    // Use timeout to allow DOM update before scrolling
    setTimeout(() => {
       const scrollElement = scrollAreaRef.current?.children[1]; // Access the viewport element
       if (scrollElement) {
           scrollElement.scrollTop = scrollElement.scrollHeight;
       }
    }, 0);
  };

   // Scroll to bottom when messages change
   useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending || isSubmittingStep) return;

    const messageToSend: ChatMessage = {
        id: `temp-${Date.now()}`, // Temporary ID for UI
        sender: 'USER',
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
    };

    // Optimistically add user message to UI
    setMessages(prev => [...prev, messageToSend]);
    setNewMessage(''); // Clear input immediately
    setIsSending(true);
    setError(null);
    scrollToBottom();

    console.log("Sending message:", messageToSend.text);
    // TODO: Call actual sendMessage mutation
    // sendMessage({ variables: { input: { text: messageToSend.text } } });
     // Simulate API call and AI response
     setTimeout(() => {
        const aiResponse: ChatMessage = {
            id: `temp-ai-${Date.now()}`,
            sender: 'AI',
            text: `That's interesting! Tell me more about "${messageToSend.text.substring(0, 20)}..." (Simulated AI Response)`,
            timestamp: new Date().toISOString(),
        };
        console.log("Simulated AI response received.");
        setMessages(prev => [...prev, aiResponse]); // Add AI response
        setIsSending(false);
        scrollToBottom();
     }, 1200);
  };

  const handleCompleteStep = () => {
     if (isSubmittingStep || isSending) return;
     setIsSubmittingStep(true);
     setError(null);
     console.log("Completing AI Coach interaction step...");
     // TODO: Call actual completeStep mutation
     // completeStep();
      // Simulate API call
      setTimeout(() => {
        console.log("Simulated AI Coach step completion.");
        // TODO: Trigger user refetch / cache update
        setIsSubmittingStep(false);
     }, 1000);
  };

  const isLoading = isLoadingIntro || isLoadingHistory;

  // --- Render Logic ---
  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col h-[80vh]"> {/* Adjust height as needed */}
      <CardHeader>
        <CardTitle>Step 4: AI Relationship Coach</CardTitle>
        {isLoadingIntro ? (
            <Skeleton className="h-4 w-3/4 mt-1" />
        ) : (
            <CardDescription>{introScreen?.content || "Chat with our AI coach to explore your relationship values."}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden p-0"> {/* Remove padding for ScrollArea */}
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}> {/* Add padding back here */}
          {isLoadingHistory ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-16 w-3/4" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'AI' && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src="/coach-avatar.png" alt="AI Coach" /> {/* Placeholder avatar */}
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      msg.sender === 'USER'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.text}
                  </div>
                   {/* Optionally add timestamp */}
                </div>
              ))}
               {/* Optional Typing Indicator Placeholder */}
               {/* {isSending && <TypingIndicator />} */}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
         {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={1}
            className="flex-grow resize-none" // Prevent manual resize, adjust height dynamically if needed
            disabled={isSending || isSubmittingStep}
            onKeyDown={(e) => {
                // Submit on Enter, allow Shift+Enter for newline
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}
          />
          <Button type="submit" size="icon" disabled={isSending || isSubmittingStep || !newMessage.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
         {/* Add a button to manually complete the step */}
         <Button
            onClick={handleCompleteStep}
            disabled={isSubmittingStep || isSending || messages.length < 2} // Example condition: require some interaction
            className="ml-4"
            variant="outline"
         >
            {isSubmittingStep ? 'Finishing...' : 'Finish Conversation'}
         </Button>
      </CardFooter>
    </Card>
  );
};

export default Step4_AICoachChat;