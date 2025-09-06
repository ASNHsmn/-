import React, { useState } from 'react';
import { translations } from '../locales.ts';
import { AppLanguage } from '../types.ts';
import { ClipboardIcon, CheckIcon } from './icons/Icons.tsx';

interface CodeBlockProps {
  language: string;
  content: string;
  appLanguage: AppLanguage;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, content, appLanguage }) => {
    const [copied, setCopied] = useState(false);

    const t = (key: 'copyCode' | 'codeCopied') => {
        return translations.chat[key][appLanguage] || key;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#0d1117] rounded-lg my-2 w-full text-left">
            <div className="flex justify-between items-center px-4 py-2 bg-[var(--color-bg-primary)] rounded-t-lg text-xs">
                <span className="text-[var(--color-text-secondary)]">{language}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? t('codeCopied') : t('copyCode')}</span>
                </button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto"><code>{content}</code></pre>
        </div>
    );
};

export default CodeBlock;
