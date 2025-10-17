'use client'

import { useState, useCallback, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'
import CustomMarkdown from '@/components/common/CustomMarkdown'
import StreamingContent from './StreamingContent'
import { useAIQuickActions, useExecuteQuickAction } from '@/lib/hooks/useAIQuickActions'
import type { AIQuickAction } from '@/lib/features/aiQuickActions/aiQuickActionsSlice'
import QuickActions from './QuickActions'

interface UserMessage {
  type: 'user'
  content: string
}

interface AgentMessage {
  type: 'agent'
  content: string
  quickActions?: AIQuickAction[]
}

type ConversationMessage = UserMessage | AgentMessage

export default function AssistantPopover() {
  const { quickActions, hasData, loading } = useAIQuickActions()
  const executeQuickAction = useExecuteQuickAction()
  
  // Conversation state
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [typingMessageIndices, setTypingMessageIndices] = useState<Set<number>>(new Set())

  // Initialize conversation with agent greeting when data is available
  useEffect(() => {
    if (!loading && conversation.length === 0) {
      const initialAgentMessage: AgentMessage = {
        type: 'agent',
        content: hasData ? 'How would you like to explore the dataset? Suggestions:' : 'AI feature coming in the future',
        quickActions: hasData ? quickActions : undefined
      }
      setConversation([initialAgentMessage])
      // Start typing animation for the initial message
      setTypingMessageIndices(new Set([0]))
    }
  }, [loading, hasData, quickActions, conversation.length])
  
  const handleQuickActionClick = useCallback((action: AIQuickAction) => {
    // Add user message (the action name)
    const userMessage: UserMessage = {
      type: 'user',
      content: action.name
    }
    
    // Add agent confirmation message
    const agentMessage: AgentMessage = {
      type: 'agent',
      content: action.confirmation
    }
    
    // Update conversation
    setConversation(prev => {
      const newConversation = [...prev, userMessage, agentMessage]
      // Start typing animation for the new agent message
      setTypingMessageIndices(new Set([newConversation.length - 1]))
      return newConversation
    })

    // Execute the action
    executeQuickAction(action)
  }, [executeQuickAction])

  const handleTypingComplete = useCallback((messageIndex: number) => {
    setTypingMessageIndices(prev => {
      const newSet = new Set(prev)
      newSet.delete(messageIndex)
      return newSet
    })
  }, [])

  return (
    <IconPopover
      icon={<Sparkles />}
      tooltip="AI Assistant"
      contentClassName="w-[500px] h-[768px] p-4"
      align="end"
    >
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 mb-4 space-y-4 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Analyzing file for suggestions...</span>
            </div>
          )}

          {/* Render conversation messages */}
          {conversation.map((message, index) => {
            const isTyping = typingMessageIndices.has(index)
            const isAgent = message.type === 'agent'

            return (
              <div key={index} className={`flex items-start gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
                <div className={`p-3 rounded-lg max-w-full ${
                  message.type === 'agent'
                    ? 'bg-muted rounded-lg'
                    : 'bg-primary text-primary-foreground rounded-lg'
                }`}>
                  <div className="text-sm">
                    {isAgent ? (
                      <StreamingContent
                        content={message.content}
                        speed={3}
                        enabled={isTyping}
                        onComplete={() => handleTypingComplete(index)}
                      />
                    ) : (
                      <CustomMarkdown>{message.content}</CustomMarkdown>
                    )}
                  </div>

                  {/* Show quick actions for agent messages that have them - only after typing is complete */}
                  {message.type === 'agent' && message.quickActions && !isTyping && (
                    <QuickActions
                      quickActions={message.quickActions}
                      onActionClick={handleQuickActionClick}
                    />
                  )}
                </div>
              </div>
            )
          })}

          {!loading && !hasData && conversation.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-xs">
                <div className="text-sm text-muted-foreground">
                  <CustomMarkdown>No specific suggestions for this file yet.</CustomMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t pt-3">
          <textarea
            className="w-full h-20 p-3 border rounded-lg resize-none bg-muted/50 text-muted-foreground"
            placeholder="Freeform AI feature will be available in the future"
            disabled
          />
        </div>
      </div>
    </IconPopover>
  )
}