
import React, { useState, useEffect, useCallback } from 'react';
import { AIPersonality, ChatMessage, AppLanguage, AIAvatar, AIGender, Theme, Conversation, ModelConfig, MessageLimit } from './types.ts';
import ChatScreen from './components/ChatScreen.tsx';
import Sidebar from './components/Sidebar.tsx';
import { getSystemInstruction } from './services/geminiService.ts';
import OnboardingScreen from './components/OnboardingScreen.tsx';
import SetupScreen from './components/SetupScreen.tsx';
import { translations } from './locales.ts';

const generateUUID = () => crypto.randomUUID();
const DAILY_MESSAGE_LIMIT = 50;

const defaultPersonality: AIPersonality = {
  avatar: AIAvatar.ORB,
  gender: AIGender.MALE,
};

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const language: AppLanguage = 'ar';
  const [theme, setTheme] = useState<Theme>('earthy');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>(defaultPersonality);
  
  // Developer Mode State
  const [devMode, setDevMode] = useState(false);
  const [impersonateMode, setImpersonateMode] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    temperature: 0.7,
    topP: 0.95,
  });

  // Onboarding & Setup State
  const [showSetup, setShowSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Daily Message Limit
  const [dailyMessageLimit, setDailyMessageLimit] = useState<MessageLimit>({
    count: DAILY_MESSAGE_LIMIT,
    lastReset: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('jaml-conversations');
      const savedActiveId = localStorage.getItem('jaml-active-id');
      const savedTheme = localStorage.getItem('jaml-theme') as Theme | null;
      const onboardingComplete = localStorage.getItem('jaml-onboarding-complete');
      const savedModelConfig = localStorage.getItem('jaml-model-config');
      const savedPersonality = localStorage.getItem('jaml-personality');
      const savedLimit = localStorage.getItem('jaml-message-limit');

      if (savedPersonality) {
        setAiPersonality(JSON.parse(savedPersonality));
        if (!onboardingComplete) {
          setShowOnboarding(true);
        }
      } else {
        setShowSetup(true);
      }
      
      if (savedLimit) {
          const limitData: MessageLimit = JSON.parse(savedLimit);
          const today = new Date().toISOString().split('T')[0];
          // Check if the last reset was today
          if (limitData.lastReset === today) {
              setDailyMessageLimit(limitData);
          } else {
              // It's a new day, reset the limit
              setDailyMessageLimit({
                  count: DAILY_MESSAGE_LIMIT,
                  lastReset: today,
              });
          }
      }

      if (savedConversations) {
        setConversations(JSON.parse(savedConversations));
      }
      if (savedActiveId) {
        setActiveConversationId(savedActiveId);
      }
      if (savedTheme) {
        setTheme(savedTheme);
      }
      if (savedModelConfig) {
        setModelConfig(JSON.parse(savedModelConfig));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    if (isLoaded) {
       localStorage.setItem('jaml-conversations', JSON.stringify(conversations));
       localStorage.setItem('jaml-active-id', activeConversationId || '');
       localStorage.setItem('jaml-theme', theme);
       localStorage.setItem('jaml-model-config', JSON.stringify(modelConfig));
       localStorage.setItem('jaml-personality', JSON.stringify(aiPersonality));
       localStorage.setItem('jaml-message-limit', JSON.stringify(dailyMessageLimit));
       document.documentElement.setAttribute('data-theme', theme);
    }
  }, [conversations, activeConversationId, theme, modelConfig, aiPersonality, dailyMessageLimit, isLoaded]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  
  const handlePersonalitySelect = (gender: AIGender) => {
    const newPersonality = { ...aiPersonality, gender };
    setAiPersonality(newPersonality);
    setShowSetup(false);
    setShowOnboarding(true); // After setup, show onboarding
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem('jaml-onboarding-complete', 'true');
    } catch (error) {
      console.error("Failed to save onboarding status to localStorage", error);
    }
  };

  const startNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: generateUUID(),
      title: "محادثة جديدة", // Placeholder title
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setIsSidebarOpen(false);
  }, []);
  
  const deleteConversation = useCallback((id: string) => {
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.filter(c => c.id !== id);
      
      if (id === activeConversationId) {
        const newActiveId = updatedConversations.length > 0 ? updatedConversations[0].id : null;
        setActiveConversationId(newActiveId);
      }
      
      return updatedConversations;
    });
  }, [activeConversationId]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    if (!activeConversationId && conversations.length > 0) {
        setActiveConversationId(conversations[0].id);
    }
    const currentId = activeConversationId || (conversations.length > 0 ? conversations[0].id : null);
    if (!currentId) return;

    setConversations(prev =>
      prev.map(c =>
        c.id === currentId
          ? { ...c, messages: [...c.messages, { ...message, id: generateUUID() }] }
          : c
      )
    );
  }, [activeConversationId, conversations]);

  const updateMessageContent = useCallback((messageId: string, newContent: string) => {
    if (!activeConversationId) return;
    setConversations(prev =>
        prev.map(c =>
            c.id === activeConversationId
                ? {
                    ...c,
                    messages: c.messages.map(m =>
                        m.id === messageId ? { ...m, content: newContent } : m
                    ),
                }
                : c
        )
    );
  }, [activeConversationId]);


  const deleteSelectedMessages = useCallback((messageIds: Set<string>) => {
    if (!activeConversationId) return;
    setConversations(prev => 
      prev.map(c =>
        c.id === activeConversationId
          ? { ...c, messages: c.messages.filter(m => !messageIds.has(m.id)) }
          : c
      )
    );
  }, [activeConversationId]);

  const updateConversationTitle = useCallback((id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle } : c))
    );
  }, []);

  const resetApp = useCallback(() => {
      if (window.confirm(translations.chat.resetAppConfirm.ar)) {
          localStorage.clear();
          window.location.reload();
      }
  }, []);
  
  const handleModelConfigChange = useCallback((newConfig: Partial<ModelConfig>) => {
      setModelConfig(prev => ({...prev, ...newConfig}));
  }, []);

  const handleAiPersonalityChange = useCallback((gender: AIGender) => {
    setAiPersonality(prev => ({ ...prev, gender }));
  }, []);

  const handleMessageSent = useCallback(() => {
    setDailyMessageLimit(prev => ({ ...prev, count: Math.max(0, prev.count - 1) }));
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <div className="h-screen w-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex overflow-hidden">
      {showSetup && <SetupScreen language={language} onSelect={handlePersonalitySelect} />}
      {!showSetup && showOnboarding && <OnboardingScreen language={language} onComplete={handleOnboardingComplete} personality={aiPersonality} />}
      
      <Sidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={startNewChat}
        onDeleteConversation={deleteConversation}
        language={language}
        theme={theme}
        setTheme={setTheme}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        devMode={devMode}
        impersonateMode={impersonateMode}
        setImpersonateMode={setImpersonateMode}
        onViewSystemPrompt={() => alert(getSystemInstruction(aiPersonality))}
        modelConfig={modelConfig}
        onModelConfigChange={handleModelConfigChange}
        onResetApp={resetApp}
        aiPersonality={aiPersonality}
        onAiPersonalityChange={handleAiPersonalityChange}
        dailyMessageLimit={dailyMessageLimit}
      />
      <main className="flex-1 flex flex-col h-full">
         <ChatScreen 
            key={activeConversationId} // Force re-mount on conversation change
            conversation={activeConversation}
            personality={aiPersonality}
            language={language}
            addMessage={addMessage}
            updateConversationTitle={updateConversationTitle}
            toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            deleteSelectedMessages={deleteSelectedMessages}
            // Dev mode props
            devMode={devMode}
            impersonateMode={impersonateMode}
            onDevModeActivate={() => setDevMode(true)}
            updateMessageContent={updateMessageContent}
            modelConfig={modelConfig}
            // Message Limit Props
            messagesLeft={dailyMessageLimit.count}
            onMessageSent={handleMessageSent}
        />
      </main>
    </div>
  );
};

export default App;