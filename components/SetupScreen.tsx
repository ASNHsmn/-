import React from 'react';
import { translations } from '../locales';
import { AppLanguage, AIGender } from '../types';
import { UserCircleIcon } from './icons/Icons'; // Using UserCircle as a generic person icon

interface SetupScreenProps {
  language: AppLanguage;
  onSelect: (gender: AIGender) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ language, onSelect }) => {
  const t = (key: keyof typeof translations['setup']) => translations.setup[key][language];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl p-6 md:p-8 text-center border border-[var(--color-border)] transform transition-all animate-slide-up">
        <h2 className="text-2xl font-bold mb-3 text-[var(--color-text-primary)]">{t('title')}</h2>
        <p className="text-[var(--color-text-secondary)] mb-8">{t('description')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onSelect(AIGender.MALE)}
              className="flex flex-col items-center justify-center p-6 bg-[var(--color-bg-primary)] rounded-lg border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all transform hover:scale-105"
            >
                <UserCircleIcon className="w-12 h-12 mb-3 text-[var(--color-accent)]"/>
                <span className="text-lg font-bold">{t('male')}</span>
            </button>
            <button
               onClick={() => onSelect(AIGender.FEMALE)}
               className="flex flex-col items-center justify-center p-6 bg-[var(--color-bg-primary)] rounded-lg border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all transform hover:scale-105"
            >
                <UserCircleIcon className="w-12 h-12 mb-3 text-[var(--color-primary-hover)]"/>
                <span className="text-lg font-bold">{t('female')}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
