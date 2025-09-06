import React, { useState, useRef, useEffect } from 'react';
import { AppLanguage } from '../types.ts';
import { translations } from '../locales.ts';
import { PaperClipIcon, PhotoIcon, DocumentTextIcon, DocumentMagnifyingGlassIcon, CpuChipIcon, SendIcon, XMarkIcon } from './icons/Icons.tsx';

interface ChatInputProps {
    onSendMessage: (prompt: string) => void;
    onFileSelect: (file: File) => void;
    onImageStage: (file: File, type: 'edit' | 'homework') => void;
    isLoading: boolean;
    isBanned: boolean;
    name: string;
    language: AppLanguage;
    stagedImage: { previewUrl: string } | null;
    onClearStagedImage: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    onSendMessage,
    onFileSelect,
    onImageStage,
    isLoading,
    isBanned,
    name,
    language,
    stagedImage,
    onClearStagedImage
}) => {
    const [userInput, setUserInput] = useState('');
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const homeworkInputRef = useRef<HTMLInputElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const t = (key: keyof typeof translations['chat'], options?: { [key: string]: string | number }) => {
        let text = (translations.chat as any)[key]?.[language] || key;
        if (options) {
            Object.entries(options).forEach(([optKey, value]) => {
                text = text.replace(new RegExp(`{{${optKey}}}`, 'g'), String(value));
            });
        }
        return text;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
            setIsAttachmentMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          onFileSelect(file);
          setIsAttachmentMenuOpen(false);
          e.target.value = '';
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'edit' | 'homework') => {
        const file = e.target.files?.[0];
        if (file) {
            onImageStage(file, type);
            if (type === 'homework' && !userInput) {
                setUserInput(t('homeworkPrompt'));
            }
            setIsAttachmentMenuOpen(false);
            e.target.value = '';
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!userInput.trim() && !stagedImage) || isLoading) return;

        const finalPrompt = isThinkingMode
            ? `فكر بعمق وبشكل منهجي قبل الإجابة. قدم إجابة مفصلة وشاملة.\n\n${userInput.trim()}`
            : userInput.trim();

        onSendMessage(finalPrompt);
        setUserInput('');
        setIsThinkingMode(false);
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
        }
    };
    
    // Auto-resize textarea
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [userInput]);

    return (
        <div className="w-full">
            {stagedImage && (
                <div className="relative w-24 h-24 mb-2 p-1.5 bg-[var(--color-bg-tertiary)] rounded-xl shadow-md">
                    <img src={stagedImage.previewUrl} alt="Staged for upload" className="w-full h-full object-cover rounded-lg" />
                    <button onClick={onClearStagedImage} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 border-2 border-[var(--color-bg-secondary)] hover:scale-110 transition-transform">
                        <XMarkIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
            <form onSubmit={handleFormSubmit} className={`relative flex items-end gap-2 p-2 bg-[var(--color-bg-primary)] rounded-2xl border-2 border-transparent focus-within:border-[var(--color-primary)] transition-all ${isBanned ? 'opacity-50' : ''}`}>
                <div className="relative self-center" ref={attachmentMenuRef}>
                    <input type="file" ref={imageInputRef} onChange={(e) => handleImageChange(e, 'edit')} className="hidden" accept="image/png, image/jpeg, image/webp, image/heic, image/heif" />
                    <input type="file" ref={homeworkInputRef} onChange={(e) => handleImageChange(e, 'homework')} className="hidden" accept="image/png, image/jpeg, image/webp, image/heic, image/heif" />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.js,.py,.html,.css,.json,.ts,.jsx,.tsx,.c,.cpp,.cs,.go,.rb,.php,.sh,.bat,.xml,.yaml" />

                    <button type="button" onClick={() => setIsAttachmentMenuOpen(prev => !prev)} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 transition-colors" disabled={isLoading || isBanned}>
                        <PaperClipIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    </button>

                    {isAttachmentMenuOpen && (
                        <div className="absolute bottom-full mb-2 w-60 bg-[var(--color-bg-secondary)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden z-10 animate-fade-in">
                            <button onClick={() => imageInputRef.current?.click()} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                                <PhotoIcon className="w-5 h-5 text-[var(--color-accent)]" />
                                <span>{t('designOrEditImage')}</span>
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                                <DocumentTextIcon className="w-5 h-5 text-[var(--color-accent)]" />
                                <span>{t('reviewFile')}</span>
                            </button>
                            <button onClick={() => homeworkInputRef.current?.click()} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                                <DocumentMagnifyingGlassIcon className="w-5 h-5 text-[var(--color-accent)]" />
                                <span>{t('solveHomework')}</span>
                            </button>
                        </div>
                    )}
                 </div>

                <textarea
                    ref={textAreaRef}
                    rows={1}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleFormSubmit(e);
                        }
                    }}
                    placeholder={t('placeholder', { name })}
                    disabled={isLoading || isBanned}
                    className="flex-1 py-1.5 px-2 bg-transparent resize-none max-h-40 focus:outline-none placeholder-[var(--color-text-secondary)] text-sm"
                />

                <div className="flex items-center gap-2 self-center">
                    <button type="button" onClick={() => setIsThinkingMode(prev => !prev)} title={t('thinkingModeTooltip')} className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 ${isThinkingMode ? 'bg-[var(--color-accent)] text-white scale-110' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`} disabled={isLoading || isBanned}>
                        <CpuChipIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || isBanned || (!userInput.trim() && !stagedImage)}
                        className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-border)] disabled:cursor-not-allowed transition-all"
                    >
                        <SendIcon className="w-5 h-5 text-white" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
