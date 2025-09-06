import React, { useRef, useEffect, useState } from 'react';
import { AppLanguage, Theme, Conversation, ModelConfig, AIPersonality, AIGender, MessageLimit } from '../types.ts';
import { translations } from '../locales.ts';
import { PlusIcon, TrashIcon, UserCircleIcon, EyeIcon } from './icons/Icons.tsx';

const DAILY_MESSAGE_LIMIT = 50;

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  language: AppLanguage;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  devMode: boolean;
  impersonateMode: boolean;
  setImpersonateMode: (impersonate: boolean) => void;
  onViewSystemPrompt: () => void;
  modelConfig: ModelConfig;
  onModelConfigChange: (config: Partial<ModelConfig>) => void;
  onResetApp: () => void;
  aiPersonality: AIPersonality;
  onAiPersonalityChange: (gender: AIGender) => void;
  dailyMessageLimit: MessageLimit;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  language,
  theme,
  setTheme,
  isOpen,
  setIsOpen,
  devMode,
  impersonateMode,
  setImpersonateMode,
  onViewSystemPrompt,
  modelConfig,
  onModelConfigChange,
  onResetApp,
  aiPersonality,
  onAiPersonalityChange,
  dailyMessageLimit,
}) => {
  const name = aiPersonality.gender === AIGender.MALE ? 'جمل' : 'ناقة';
  const t = (key: keyof typeof translations['chat'], options?: { [key: string]: string | number }) => {
    let text = (translations.chat as any)[key]?.[language] || key;
    if (options) {
      Object.entries(options).forEach(([optKey, value]) => {
        text = text.replace(new RegExp(`{{${optKey}}}`, 'g'), String(value));
      });
    }
    return text;
  };
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t('deleteConvoConfirm'))) {
        onDeleteConversation(id);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside 
        ref={sidebarRef}
        className={`absolute md:relative z-40 flex flex-col h-full w-72 bg-[var(--color-bg-primary)] p-3 transition-transform transform ${isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')} md:translate-x-0`}
      >
        <div className="flex-shrink-0 mb-4">
          <button 
            onClick={onNewChat} 
            className="w-full flex items-center gap-3 p-3 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors"
          >
            <PlusIcon className="w-5 h-5"/>
            <span>{t('newChat')}</span>
          </button>
        </div>
            
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            {conversations.map(convo => (
              <div
                key={convo.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelectConversation(convo.id)
                  setIsOpen(false);
                }}
                onKeyDown={(e) => {
                    if(e.key === 'Enter' || e.key === ' ') {
                        onSelectConversation(convo.id);
                        setIsOpen(false);
                    }
                }}
                onMouseEnter={() => setDeletingId(convo.id)}
                onMouseLeave={() => setDeletingId(null)}
                className={`relative w-full p-3 text-sm rounded-md cursor-pointer transition-colors truncate ${activeConversationId === convo.id ? 'bg-[var(--color-bg-tertiary)]' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
              >
                {convo.title || t('untitledChat')}
                {deletingId === convo.id && (
                  <button onClick={(e) => handleDeleteClick(e, convo.id)} aria-label={`Delete ${convo.title}`} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-red-400 hover:text-red-300">
                     <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-[var(--color-border)] pt-2">
          {devMode && (
            <div className="p-2 mb-2 border border-[var(--color-border)] rounded-lg space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-accent)] mb-2">{t('devMode')}</h3>
                <div className="flex items-center justify-between text-sm">
                    <label htmlFor="impersonate" className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                        <UserCircleIcon className="w-5 h-5" />
                        {t('impersonate')}
                    </label>
                    <input 
                        id="impersonate"
                        type="checkbox" 
                        checked={impersonateMode}
                        onChange={(e) => setImpersonateMode(e.target.checked)}
                        className="toggle-checkbox"
                    />
                </div>
                 <button onClick={onViewSystemPrompt} className="w-full flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 rounded transition-colors">
                     <EyeIcon className="w-5 h-5"/>
                     {t('viewSystemPrompt', { name })}
                 </button>
                <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('temperature')} ({modelConfig.temperature.toFixed(2)})</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={modelConfig.temperature}
                        onChange={(e) => onModelConfigChange({ temperature: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('topP')} ({modelConfig.topP.toFixed(2)})</label>
                     <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={modelConfig.topP}
                        onChange={(e) => onModelConfigChange({ topP: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer"
                    />
                </div>
                <button onClick={onResetApp} className="w-full text-center text-sm p-2 bg-red-800/50 hover:bg-red-800/80 rounded-md transition-colors mt-2">
                    {t('resetApp')}
                </button>
            </div>
          )}

          <div className="p-2">
            <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">{t('dailyLimit')}</label>
            <div className="text-center text-xs mb-1 text-[var(--color-text-secondary)]">
                {t('messagesRemaining', { count: dailyMessageLimit.count, limit: DAILY_MESSAGE_LIMIT })}
            </div>
            <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                <div 
                    className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(dailyMessageLimit.count / DAILY_MESSAGE_LIMIT) * 100}%` }}
                ></div>
            </div>
          </div>

          <div className="p-2 border-t border-[var(--color-border)] mt-2">
             <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">{translations.chat.persona.title[language]}</label>
             <div className="flex gap-2">
                <button onClick={() => onAiPersonalityChange(AIGender.MALE)} className={`flex-1 p-2 rounded-md text-sm transition-colors ${aiPersonality.gender === AIGender.MALE ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'}`}>{translations.chat.persona.male[language]}</button>
                <button onClick={() => onAiPersonalityChange(AIGender.FEMALE)} className={`flex-1 p-2 rounded-md text-sm transition-colors ${aiPersonality.gender === AIGender.FEMALE ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'}`}>{translations.chat.persona.female[language]}</button>
             </div>
          </div>

          <div className="p-2 border-t border-[var(--color-border)] mt-2">
            <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">{t('theme')}</label>
            <div className="flex gap-2">
              <button onClick={() => setTheme('earthy')} className={`flex-1 p-2 rounded-md text-sm transition-colors ${theme === 'earthy' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'}`}>{t('earthy')}</button>
              <button onClick={() => setTheme('purple')} className={`flex-1 p-2 rounded-md text-sm transition-colors ${theme === 'purple' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'}`}>{t('purple')}</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;