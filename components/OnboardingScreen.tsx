import React, { useState } from 'react';
import { translations } from '../locales';
import { AppLanguage, AIAvatar, AIPersonality, AIGender } from '../types';
import { ChatBubbleLeftRightIcon, CodeBracketIcon, DocumentMagnifyingGlassIcon, PaintBrushIcon, PaperClipIcon, CpuChipIcon, PhotoIcon } from './icons/Icons';
import AvatarDisplay from './AvatarDisplay';

interface OnboardingScreenProps {
  language: AppLanguage;
  onComplete: () => void;
  personality: AIPersonality;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ language, onComplete, personality }) => {
  const [step, setStep] = useState(0);
  const name = personality.gender === AIGender.MALE ? 'جمل' : 'ناقة';

  const t = (key: keyof typeof translations['onboarding'], options?: { [key: string]: string | number }) => {
    let text = (translations.onboarding as any)[key]?.[language] || key;
    if (options) {
      Object.entries(options).forEach(([optKey, value]) => {
        text = text.replace(new RegExp(`{{${optKey}}}`, 'g'), String(value));
      });
    }
    return text;
  };


  const steps = [
    {
      icon: <div className="w-24 h-24 mx-auto mb-4"><AvatarDisplay avatar={AIAvatar.ORB} /></div>,
      title: t('welcomeTitle', { name }),
      description: t('welcomeDescription'),
    },
    {
      icon: <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div className="flex flex-col items-center p-2 rounded-lg bg-[var(--color-bg-primary)]"><ChatBubbleLeftRightIcon className="w-8 h-8 mb-2 text-[var(--color-accent)]" /><span>{t('featureChat')}</span></div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-[var(--color-bg-primary)]"><PaintBrushIcon className="w-8 h-8 mb-2 text-[var(--color-accent)]" /><span>{t('featureDesign')}</span></div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-[var(--color-bg-primary)]"><CodeBracketIcon className="w-8 h-8 mb-2 text-[var(--color-accent)]" /><span>{t('featureCode')}</span></div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-[var(--color-bg-primary)]"><DocumentMagnifyingGlassIcon className="w-8 h-8 mb-2 text-[var(--color-accent)]" /><span>{t('featureReview')}</span></div>
            </div>,
      title: t('featuresTitle'),
      description: t('featuresDescription'),
    },
    {
      icon: <div className="space-y-4 text-left">
              <div className="flex items-center gap-4"><PaperClipIcon className="w-8 h-8 flex-shrink-0 text-[var(--color-accent)]" /><div><h4 className="font-bold">{t('tipAttachTitle')}</h4><p className="text-sm text-[var(--color-text-secondary)]">{t('tipAttachDescription')}</p></div></div>
              <div className="flex items-center gap-4"><CpuChipIcon className="w-8 h-8 flex-shrink-0 text-[var(--color-accent)]" /><div><h4 className="font-bold">{t('tipDeepThinkingTitle')}</h4><p className="text-sm text-[var(--color-text-secondary)]">{t('tipDeepThinkingDescription')}</p></div></div>
              <div className="flex items-center gap-4"><PhotoIcon className="w-8 h-8 flex-shrink-0 text-[var(--color-accent)]" /><div><h4 className="font-bold">{t('tipImageInteractionTitle')}</h4><p className="text-sm text-[var(--color-text-secondary)]">{t('tipImageInteractionDescription')}</p></div></div>
            </div>,
      title: t('tipsTitle'),
      description: t('tipsDescription'),
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl p-6 md:p-8 text-center border border-[var(--color-border)] transform transition-all animate-slide-up">
        <div className="mb-6">{currentStep.icon}</div>
        <h2 className="text-2xl font-bold mb-3 text-[var(--color-text-primary)]">{currentStep.title}</h2>
        <p className="text-[var(--color-text-secondary)] mb-8 whitespace-pre-wrap">{currentStep.description}</p>
        
        <div className="flex justify-center mb-4">
          {steps.map((_, index) => (
            <div key={index} className={`w-2 h-2 rounded-full mx-1 transition-colors ${index === step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}></div>
          ))}
        </div>

        <button 
          onClick={handleNext} 
          className="w-full bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-primary)]"
        >
          {step === steps.length - 1 ? t('startButton') : t('nextButton')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
