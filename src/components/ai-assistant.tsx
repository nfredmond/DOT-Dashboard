'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, User, Trash, ChevronDown, ChevronUp, BrainCircuit, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScenarioDefinition, ScenarioResults } from '@/types/trend-navigator';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  scenario?: ScenarioDefinition | null;
  results?: ScenarioResults | null;
  className?: string;
}

export function AIAssistant({ scenario, results, className }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi there! I\'m your AI planning assistant. I can help you analyze scenarios, explain transportation concepts, suggest improvements, and answer questions about your plan. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Generate suggested questions based on available data
  const suggestedQuestions = useMemo(() => {
    const questions: string[] = [];
    
    if (scenario) {
      questions.push('What are the key elements of this scenario?');
    }
    
    if (results) {
      questions.push('What are the main impacts of this scenario?');
    }
    
    if (results?.comparisonToBaseline) {
      questions.push('How does this scenario compare to the baseline?');
    }
    
    // Always add these general questions
    questions.push('How might I improve transit mode share?');
    questions.push('What policies are most effective for reducing emissions?');
    
    return questions;
  }, [scenario, results]);
  
  // Scroll to the end of messages when new messages are added
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // In a production app, this would call your API to get a response from an LLM
      // Here we'll simulate a response after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prepare context about the current scenario for the AI
      let context = '';
      if (scenario) {
        context += `Scenario Name: ${scenario.name}\n`;
        context += `Description: ${scenario.description || 'No description'}\n`;
        
        if (scenario.assumptions && scenario.assumptions.length > 0) {
          context += `Assumptions: ${scenario.assumptions.length} assumptions applied\n`;
        }
        
        if (scenario.policyPackages && scenario.policyPackages.length > 0) {
          context += `Policies: ${scenario.policyPackages.length} policy packages applied\n`;
        }
      }
      
      if (results) {
        const horizonYear = results.horizonYears[0];
        const metrics = results.aggregateMetrics[horizonYear];
        
        context += `Horizon Year: ${horizonYear}\n`;
        context += `Total VMT: ${metrics.totalVmt.toLocaleString()}\n`;
        context += `GHG Emissions: ${metrics.ghgEmissions.toLocaleString()} tons\n`;
        context += `Mode Shares: Drive ${(metrics.modeShares.drive_alone * 100).toFixed(1)}%, 
                   Transit ${(metrics.modeShares.transit * 100).toFixed(1)}%, 
                   Walk/Bike ${((metrics.modeShares.walk + metrics.modeShares.bike) * 100).toFixed(1)}%\n`;
                   
        if (results.comparisonToBaseline) {
          context += `Comparison to Baseline: 
                    VMT Change ${results.comparisonToBaseline.vmtChange.toFixed(1)}%, 
                    GHG Change ${results.comparisonToBaseline.ghgEmissionsChange.toFixed(1)}%\n`;
        }
      }
      
      // Generate response (in production, send the context + query to your LLM API)
      const response = generateResponse(userMessage.content, context);
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };
  
  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi there! I\'m your AI planning assistant. I can help you analyze scenarios, explain transportation concepts, suggest improvements, and answer questions about your plan. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };
  
  // Toggle the expanded state of the assistant
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <Card className={cn(className, 'shadow-md transition-all duration-200', {
      'h-[500px]': isExpanded,
      'h-[58px]': !isExpanded,
    })}>
      <CardHeader className="px-4 py-2 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <BrainCircuit className="h-5 w-5 text-primary mr-2" />
          <CardTitle className="text-lg">AI Planning Assistant</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleExpanded}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex', {
                      'justify-end': message.role === 'user',
                      'justify-start': message.role === 'assistant',
                    })}
                  >
                    <div
                      className={cn('rounded-lg px-4 py-2 max-w-[85%] flex gap-3', {
                        'bg-primary text-primary-foreground': message.role === 'user',
                        'bg-muted': message.role === 'assistant',
                      })}
                    >
                      {message.role === 'assistant' && (
                        <Bot className="h-5 w-5 mt-1 flex-shrink-0" />
                      )}
                      <div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <User className="h-5 w-5 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={endOfMessagesRef} />
              </div>
            </ScrollArea>
            
            {/* Suggested questions */}
            {suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors truncate max-w-[180px]"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {question}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-2 mt-4">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your scenario..."
                className="min-h-[80px]"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="h-10 w-10"
              >
                {isLoading ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between px-4 py-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              className="text-xs h-8"
            >
              <Trash className="h-3 w-3 mr-1" />
              Clear Chat
            </Button>
            
            <CardDescription className="text-xs">
              Powered by AI planning models
            </CardDescription>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

// In a real app, this would be replaced with an API call to an LLM
function generateResponse(query: string, context: string): string {
  // Simple keyword-based responses for demo purposes
  const lowercaseQuery = query.toLowerCase();
  
  if (lowercaseQuery.includes('improve transit') || lowercaseQuery.includes('transit mode share')) {
    return `Based on transportation research, here are strategies to improve transit mode share:

1. Increase service frequency to reduce wait times
2. Expand coverage to serve more origins and destinations
3. Improve first/last mile connections with bike share and pedestrian infrastructure
4. Implement transit signal priority to improve travel times
5. Use transit-oriented development to locate housing and jobs near transit

Would you like me to analyze which of these might work best for your specific scenario?`;
  }
  
  if (lowercaseQuery.includes('reducing emissions') || lowercaseQuery.includes('ghg')) {
    return `The most effective policies for reducing transportation GHG emissions typically include:

1. Vehicle electrification incentives and infrastructure
2. Transit investment and service improvements
3. Land use policies that reduce trip distances
4. Pricing mechanisms like congestion pricing or VMT fees
5. Active transportation infrastructure

The effectiveness varies by context, so a mix of strategies is usually most effective. What specific emissions targets are you trying to reach?`;
  }
  
  if (lowercaseQuery.includes('key elements') || lowercaseQuery.includes('main components')) {
    if (context.includes('Scenario Name')) {
      const scenarioName = context.split('Scenario Name: ')[1]?.split('\n')[0];
      return `${scenarioName} includes these key elements based on the information I have:

${context.includes('Assumptions') ? '• ' + context.split('Assumptions: ')[1]?.split('\n')[0] : ''}
${context.includes('Policies') ? '• ' + context.split('Policies: ')[1]?.split('\n')[0] : ''}

Would you like me to analyze any specific aspect of this scenario in more detail?`;
    } else {
      return `I don't have information about a specific scenario currently. If you'd like to discuss key elements of a transportation scenario, please provide more details about what you're working on.`;
    }
  }
  
  if (lowercaseQuery.includes('main impacts') || lowercaseQuery.includes('results')) {
    if (context.includes('GHG Emissions')) {
      return `Based on the model results, here are the main impacts:

• VMT: ${context.split('Total VMT: ')[1]?.split('\n')[0]}
• GHG Emissions: ${context.split('GHG Emissions: ')[1]?.split('\n')[0]}
• Mode Split: ${context.split('Mode Shares: ')[1]?.split('\n')[0]}

${context.includes('Comparison to Baseline') ? 'Compared to baseline: ' + context.split('Comparison to Baseline: ')[1] : ''}

Would you like a deeper analysis of any specific impact area?`;
    } else {
      return `I don't see any results data for the current scenario. Please run the model first to generate impacts, and then I can help analyze them.`;
    }
  }
  
  if (lowercaseQuery.includes('compare') || lowercaseQuery.includes('baseline')) {
    if (context.includes('Comparison to Baseline')) {
      return `Compared to the baseline scenario, this scenario shows:

${context.split('Comparison to Baseline:')[1]}

The most significant changes appear to be in ${
        context.includes('VMT Change') && 
        parseFloat(context.split('VMT Change ')[1]?.split('%')[0]) < -5 ? 
        'vehicle miles traveled reduction' : 
        context.includes('GHG Change') && 
        parseFloat(context.split('GHG Change ')[1]?.split('%')[0]) < -5 ? 
        'greenhouse gas emissions reduction' : 
        'modest changes across several metrics'
      }.
      
Would you like me to suggest ways to further improve these results?`;
    } else {
      return `I don't see comparison data between this scenario and a baseline. To perform a comparison, you'll need to:

1. Define a baseline scenario
2. Run both scenarios with the model
3. Then I can help analyze the differences and suggest improvements`;
    }
  }
  
  // Default response
  return `I'll help answer your question about "${query}". While I don't have a specific response programmed for this exact query, I can certainly discuss transportation planning concepts, analyze scenario results, explain modeling methods, or suggest policy approaches.

What specific aspect would you like to explore further?`;
} 