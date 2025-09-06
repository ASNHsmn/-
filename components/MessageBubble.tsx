import React from 'react';
import { ChatMessage, AppLanguage } from '../types.ts';
import { translations } from '../locales.ts';
import CodeBlock from './CodeBlock.tsx';
import { DocumentTextIcon, PencilSquareIcon, ArrowDownTrayIcon } from './icons/Icons.tsx';

interface MessageBubbleProps {
    msg: ChatMessage;
    language: AppLanguage;
    onImageZoom: (imageUrl: string) => void;
    onImageDownload: (imageUrl: string) => void;
    onImageEdit: (imageUrl: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, language, onImageZoom, onImageDownload, onImageEdit }) => {
    const t = (key: keyof typeof translations['chat']) => (translations.chat as any)[key][language] || key;

    if (msg.imageUrl) {
        const isModelImage = msg.role === 'model';
        return (
            <div className="relative group max-w-xs">
                {msg.content && <p className="whitespace-pre-wrap mb-2">{msg.content}</p>}
                <button onClick={() => onImageZoom(msg.imageUrl!)} className="block w-full rounded-lg overflow-hidden transition-transform group-hover:scale-[1.02]">
                    <img src={msg.imageUrl} alt={msg.content || 'Generated content'} className="w-full h-auto" />
                </button>
                {isModelImage && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => onImageDownload(msg.imageUrl!)} title={t('download')} className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onImageEdit(msg.imageUrl!)} title={t('edit')} className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors">
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (msg.code) {
        return <CodeBlock language={msg.code.language} content={msg.code.content} appLanguage={language} />;
    }

    if (msg.isSummary) {
        return (
            <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] w-full">
                <h3 className="text-lg font-bold mb-2 text-[var(--color-accent)]">{t('summarize')}</h3>
                <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
        );
    }

    if (msg.fileInfo) {
        return (
            <div className="flex items-center gap-3 p-2 bg-[var(--color-bg-primary)] rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-[var(--color-accent)] flex-shrink-0" />
                <span className="text-sm">{msg.content}</span>
            </div>
        )
    }

    return <p className="whitespace-pre-wrap">{msg.content}</p>;
};

export default MessageBubble;