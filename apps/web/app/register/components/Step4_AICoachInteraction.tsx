'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';
import { useAuth } from '@/context/AuthContext'; // Assuming AuthContext provides user info
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ME_QUERY } from '@/graphql/queries'; // Assuming ME_QUERY exists for refetching

// Define placeholder types for messages and coach turn
interface Message {
  id: string;
  sender: 'USER' | 'COACH';
  text: string;
  timestamp: Date;
}

interface CoachTurn {
  coachMessage: {
    id: string;
    text: string;
    timestamp: string; // Assuming ISO string from backend
  };
  stepCompleted?: boolean; // Optional flag if backend sends it
}

// Placeholder GraphQL Query and Mutation (Replace with actual definitions)
// Query to fetch coach conversation
const GET_COACH_CONVERSATION_QUERY = gql`
  query GetCoachConversation {
    getCoachConversation {
      messages {
        id
        sender
        text
        timestamp
      }
      initialPrompt {
         id
         text
         timestamp
      }
      isComplete
    }
  }
`;

// Mutation to save coach message
const SAVE_COACH_MESSAGE_MUTATION = gql`
  mutation SaveCoachMessage($input: SaveMessageInput!) {
    saveCoachMessage(input: $input) {
      userMessage {
        id
        text
        timestamp
      }
      coachMessage {
        id
        text
        timestamp
      }
      isComplete
    }
  }
`;

// Mutation to complete coach interaction
const COMPLETE_COACH_INTERACTION_MUTATION = gql`
  mutation CompleteCoachInteraction {
    completeCoachInteraction {
      success
      registrationStep
    }
  }
`;


export default function Step4_AICoachInteraction() {
  const { user } = useAuth(); // Get user info if needed
  const apolloClient = useApolloClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [isCompleting, setIsCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Fetch coach conversation
  const { loading: queryLoading, error: queryError, data: initialStateData } = useQuery(GET_COACH_CONVERSATION_QUERY, {
    onCompleted: (data) => {
      const initialMessages: Message[] = [];
      if (data?.getCoachConversation?.messages) {
         initialMessages.push(...data.getCoachConversation.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp) // Ensure timestamp is a Date object
         })));
      }
       if (data?.getCoachConversation?.initialPrompt && initialMessages.length === 0) {
         initialMessages.push({
            ...data.getCoachConversation.initialPrompt,
            sender: 'COACH',
            timestamp: new Date(data.getCoachConversation.initialPrompt.timestamp)
         });
       }
       
       // Check if conversation is complete
       if (data?.getCoachConversation?.isComplete) {
         setIsComplete(true);
       }
      setMessages(initialMessages);
    },
    fetchPolicy: 'network-only', // Ensure fresh data is fetched
  });

  // Mutation to save coach message
  const [saveMessage, { loading: mutationLoading, error: mutationError }] = useMutation(
    SAVE_COACH_MESSAGE_MUTATION,
    {
      onCompleted: (data) => {
        if (data?.saveCoachMessage) {
          const { coachMessage, isComplete: messageComplete } = data.saveCoachMessage;
          
          // Add coach response to messages
          if (coachMessage) {
            setMessages((prev) => [
              ...prev,
              {
                id: coachMessage.id,
                sender: 'COACH',
                text: coachMessage.text,
                timestamp: new Date(coachMessage.timestamp),
              },
            ]);
          }
          
          // Check if interaction is complete
          if (messageComplete) {
            setIsComplete(true);
            // Refetch user data to check if registrationStep changed
            apolloClient.refetchQueries({ include: [ME_QUERY] });
          }
        }
      },
      onError: (error) => {
        console.error("Error saving message:", error);
        // Handle error display to user if necessary
      }
    }
  );
  
  // Mutation to complete coach interaction
  const [completeCoachInteraction, { loading: completingLoading, error: completingError }] = useMutation(
    COMPLETE_COACH_INTERACTION_MUTATION,
    {
      onCompleted: (data) => {
        if (data?.completeCoachInteraction?.success) {
          // Refetch user data to update registrationStep
          apolloClient.refetchQueries({ include: [ME_QUERY] });
        }
        setIsCompleting(false);
      },
      onError: (error) => {
        console.error("Error completing coach interaction:", error);
        setIsCompleting(false);
      }
    }
  );

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim() && !mutationLoading) {
      const userMessage: Message = {
        id: `user-${Date.now()}`, // Temporary ID
        sender: 'USER',
        text: inputValue.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      // Save the message
      saveMessage({
        variables: {
          input: {
            message: inputValue.trim()
          }
        }
      });
      
      setInputValue('');
    }
  }, [inputValue, mutationLoading, saveMessage]);
  
  // Handle completing the coach interaction
  const handleComplete = () => {
    if (isCompleting || !isComplete) return;
    
    setIsCompleting(true);
    completeCoachInteraction();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Handle Enter key press in input
   const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in input
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Meet Your AI Relationship Coach</CardTitle>
        <CardDescription>Answer the questions to help us understand you better.</CardDescription>
      </CardHeader>
      <CardContent className="pr-0">
        <ScrollArea className="h-[400px] w-full pr-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {queryLoading && <p>Loading conversation...</p>}
            {queryError && <p className="text-red-500">Error loading conversation: {queryError.message}</p>}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end space-x-2 ${
                  message.sender === 'USER' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'COACH' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-coach.png" alt="Coach" /> {/* Add a coach avatar */}
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.sender === 'USER'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                   {/* Optional: Display timestamp */}
                   {/* <p className="text-xs text-muted-foreground mt-1">{message.timestamp.toLocaleTimeString()}</p> */}
                </div>
                 {message.sender === 'USER' && user && (
                  <Avatar className="h-8 w-8">
                    {/* <AvatarImage src={user?.photos?.[0]?.url ?? undefined} alt={user?.firstName ?? 'User'} /> */} {/* Photo data not available directly on AuthContext user */}
                    <AvatarFallback>{user?.firstName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {mutationLoading && (
                <div className="flex items-center space-x-2 justify-start">
                   <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-coach.png" alt="Coach" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="text-sm italic">Coach is typing...</p> {/* Basic typing indicator */}
                  </div>
                </div>
             )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-center space-x-2">
          <Input
            id="message"
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={mutationLoading || queryLoading}
          />
          <Button type="button" size="icon" onClick={handleSendMessage} disabled={mutationLoading || queryLoading || !inputValue.trim()}>
            <SendIcon className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
         {mutationError && <p className="text-red-500 text-sm mt-2">Error sending message: {mutationError.message}</p>}
         
         {/* Show complete button when conversation is complete */}
         {isComplete && (
           <div className="mt-4 flex justify-end">
             <Button
               onClick={handleComplete}
               disabled={isCompleting || completingLoading}
               variant="outline"
             >
               {isCompleting ? 'Completing...' : 'Complete & Continue'}
             </Button>
           </div>
         )}
      </CardFooter>
    </Card>
  );
}

// Placeholder SendIcon component (replace with actual icon library if available, e.g., lucide-react)
function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}