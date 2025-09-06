import React, { useState, useEffect, useRef } from 'react';
import { AIPersonality, ChatMessage, AppLanguage, Conversation, ModelConfig, AIGender } from '../types.ts';
import { startChat, reviewTextFile, reviewCode, generateImage, generateLogo, generateCode, summarizeConversation, generateConversationTitle, editImage, solveHomeworkFromImage } from '../services/geminiService.ts';
import AvatarDisplay from './AvatarDisplay.tsx';
import { Chat } from '@google/genai';
import { translations } from '../locales.ts';
import { 
    Bars3Icon, DocumentMagnifyingGlassIcon, PencilSquareIcon, XMarkIcon, PaperClipIcon, 
    PhotoIcon, DocumentTextIcon, CpuChipIcon, SendIcon, ClipboardIcon, CheckIcon, 
    ArrowDownTrayIcon, CodeBracketIcon 
} from './icons/Icons.tsx';

interface ChatScreenProps {
  conversation: Conversation | undefined;
  personality: AIPersonality;
  language: AppLanguage;
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  updateConversationTitle: (id: string, title: string) => void;
  toggleSidebar: () => void;
  deleteSelectedMessages: (messageIds: Set<string>) => void;
  // Dev Mode
  devMode: boolean;
  impersonateMode: boolean;
  onDevModeActivate: () => void;
  updateMessageContent: (messageId: string, newContent: string) => void;
  modelConfig: ModelConfig;
  // Message Limit
  messagesLeft: number;
  onMessageSent: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ 
    conversation, 
    personality, 
    language, 
    addMessage, 
    updateConversationTitle, 
    toggleSidebar,
    deleteSelectedMessages,
    devMode,
    impersonateMode,
    onDevModeActivate,
    updateMessageContent,
    modelConfig,
    messagesLeft,
    onMessageSent,
}) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<{id: string, content: string} | null>(null);
  const [stagedImage, setStagedImage] = useState<{file: File, previewUrl: string, type: 'edit' | 'homework'} | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [abuseWarnings, setAbuseWarnings] = useState(0);
  const [banEndTime, setBanEndTime] = useState<number | null>(null);
  const [banTimeRemaining, setBanTimeRemaining] = useState(0);

  const [devModeStep, setDevModeStep] = useState(0);
  const devCodes = {
    step1: 'KittKittKio=', // *+_+_+*
    step2: 'U2FlZWQyMDA5JA==', // Saeed2009$
    step3: 'U01OMTIzNCQ=', // SMN1224$
    step4: 'SkFNTF9TVVBFUlZJU09SXzIwMzA=', // JAML_SUPERVISOR_2030
  };

  const name = personality.gender === AIGender.MALE ? 'جمل' : 'ناقة';
  const isLimitReached = messagesLeft <= 0;

  const t = (key: keyof typeof translations['chat'], options?: { [key: string]: string | number }) => {
    let text = (translations.chat as any)[key]?.[language] || key;
    if (options) {
      Object.entries(options).forEach(([optKey, value]) => {
        text = text.replace(new RegExp(`{{${optKey}}}`, 'g'), String(value));
      });
    }
    return text;
  };
  const chatHistory = conversation?.messages || [];

  // Input state and refs
  const [userInput, setUserInput] = useState('');
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const homeworkInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
      if (textAreaRef.current) {
          textAreaRef.current.style.height = 'auto';
          const scrollHeight = textAreaRef.current.scrollHeight;
          textAreaRef.current.style.height = `${scrollHeight}px`;
      }
  }, [userInput]);

  useEffect(() => {
    try {
        const storedBanEnd = localStorage.getItem('jaml-ban-end-time');
        if (storedBanEnd) {
            const endTime = parseInt(storedBanEnd, 10);
            if (endTime > Date.now()) {
                setBanEndTime(endTime);
            } else {
                localStorage.removeItem('jaml-ban-end-time');
            }
        }
    } catch (error) {
        console.error("Error reading ban end time from localStorage", error);
    }
  }, []);

  useEffect(() => {
      if (banEndTime) {
          const updateTimer = () => {
              const remaining = Math.max(0, banEndTime - Date.now());
              setBanTimeRemaining(remaining);
              if (remaining === 0) {
                  setBanEndTime(null);
                  localStorage.removeItem('jaml-ban-end-time');
              }
          };
          updateTimer();
          const timerId = setInterval(updateTimer, 1000);
          return () => clearInterval(timerId);
      }
  }, [banEndTime]);
  
  const isBanned = banEndTime !== null && banTimeRemaining > 0;

  useEffect(() => {
    if (conversation) {
      const newChat = startChat(personality, chatHistory, devMode ? modelConfig : undefined);
      setChat(newChat);
      if(chatHistory.length === 0) {
          addMessage({ role: 'model', content: t('initialMessage', { name }) });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, personality, devMode, modelConfig]);
  
  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, isLoading]);
   
  useEffect(() => {
    if (conversation && conversation.title === "محادثة جديدة" && conversation.messages.length > 2) {
      const generateTitle = async () => {
        const title = await generateConversationTitle(conversation.messages, personality);
        updateConversationTitle(conversation.id, title);
      };
      generateTitle();
    }
  }, [conversation, updateConversationTitle, personality]);

  const handleDevModeSequence = (prompt: string): boolean => {
    if (devMode) return false;
    const sequenceFailed = () => { setDevModeStep(0); return false; };
    try {
        const b64Prompt = btoa(prompt);
        switch (devModeStep) {
            case 0: if (b64Prompt === devCodes.step1) { setDevModeStep(1); addMessage({ role: 'model', content: '...' }); return true; } break;
            case 1: if (b64Prompt === devCodes.step2) { setDevModeStep(2); addMessage({ role: 'model', content: '...' }); return true; } return sequenceFailed(); 
            case 2: if (b64Prompt === devCodes.step3) { setDevModeStep(3); addMessage({ role: 'model', content: 'كلمة سر الإشراف؟' }); return true; } return sequenceFailed();
            case 3: if (b64Prompt === devCodes.step4) { setDevModeStep(0); onDevModeActivate(); addMessage({ role: 'model', content: 'تم تفعيل وضع المطور.' }); return true; } return sequenceFailed();
        }
    } catch (e) { if (devModeStep > 0) return sequenceFailed(); }
    return false;
  };

  const handleSendMessage = async (prompt: string) => {
    if ((!prompt && !stagedImage) || isLoading || !conversation || isLimitReached) return;
    if (handleDevModeSequence(prompt)) return;
    
    setIsLoading(true);
    onMessageSent(); // Decrement the count for this message

    if (stagedImage) {
        if (stagedImage.type === 'edit') { await handleImageEdit(prompt, stagedImage.file); } 
        else if (stagedImage.type === 'homework') { await handleHomeworkSolve(prompt, stagedImage.file); }
        setStagedImage(null);
        setIsLoading(false);
        return;
    }

    const userMessageRole = impersonateMode ? 'model' : 'user';
    addMessage({ role: userMessageRole, content: prompt });

    try {
      if (/شعار|logo/i.test(prompt)) { await handleGenerateLogo(prompt, chatHistory); } 
      else if (/صمم|ارسم|صورة لـ|design|image of|draw/i.test(prompt)) { await handleImageDesign(prompt, chatHistory); } 
      else if (/اكتب كود|كود بـ|دالة|function|code|script|برمج/i.test(prompt)) { await handleGenerateCode(prompt, chatHistory); } 
      else if(chat) {
        const response = await chat.sendMessage({ message: prompt });
        if (response.text.trim() === '[ABUSE_DETECTED]') {
            const newWarningCount = abuseWarnings + 1;
            setAbuseWarnings(newWarningCount);
            if (newWarningCount <= 2) { addMessage({ role: 'model', content: t(newWarningCount === 1 ? 'warning1Message' : 'warning2Message') }); } 
            else {
                const endTime = Date.now() + 5 * 60 * 1000;
                localStorage.setItem('jaml-ban-end-time', String(endTime));
                setBanEndTime(endTime);
                addMessage({ role: 'model', content: t('banMessage') });
                setAbuseWarnings(0);
            }
        } else { addMessage({ role: 'model', content: response.text }); }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage({ role: 'model', content: t('error') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if ((!userInput.trim() && !stagedImage) || isLoading || isLimitReached) return;

      const finalPrompt = isThinkingMode
          ? `فكر بعمق وبشكل منهجي قبل الإجابة. قدم إجابة مفصلة وشاملة.\n\n${userInput.trim()}`
          : userInput.trim();

      handleSendMessage(finalPrompt);
      setUserInput('');
      setIsThinkingMode(false);
      if (textAreaRef.current) {
          textAreaRef.current.style.height = 'auto';
      }
  };
  
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const handleImageEdit = async (prompt: string, file: File) => {
    addMessage({ role: 'user', content: prompt, imageUrl: URL.createObjectURL(file) });
    try {
        const base64Data = await toBase64(file);
        const result = await editImage(prompt, { data: base64Data, mimeType: file.type });
        if (result.text) { addMessage({ role: 'model', content: result.text }); }
        if (result.imageUrl) { addMessage({ role: 'model', content: '', imageUrl: result.imageUrl }); }
        if (!result.text && !result.imageUrl) { addMessage({ role: 'model', content: t('error') }); }
    } catch (error) { console.error("Error editing image:", error); addMessage({ role: 'model', content: t('error') }); }
  };

  const handleHomeworkSolve = async (prompt: string, file: File) => {
    addMessage({ role: 'user', content: prompt, imageUrl: URL.createObjectURL(file) });
    try {
        const base64Data = await toBase64(file);
        const result = await solveHomeworkFromImage(prompt, { data: base64Data, mimeType: file.type });
        addMessage({ role: 'model', content: result });
    } catch (error) { console.error("Error solving hw:", error); addMessage({ role: 'model', content: t('error') }); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileReview(file);
      setIsAttachmentMenuOpen(false);
      e.target.value = '';
    }
  };
  
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'edit' | 'homework') => {
      const file = e.target.files?.[0];
      if (file) {
          setStagedImage({ file, previewUrl: URL.createObjectURL(file), type });
          if (type === 'homework' && !userInput) {
              setUserInput(t('homeworkPrompt'));
          }
          setIsAttachmentMenuOpen(false);
          e.target.value = '';
      }
  };

  const handleFileReview = async (file: File) => {
    if (isLimitReached) return;
    setIsLoading(true);
    onMessageSent(); // Decrement count
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'md', 'sh', 'bat'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isCodeFile = extension && codeExtensions.includes(extension);
    const messageContent = `${isCodeFile ? t('codeReviewing') : t('textReviewing')} ${file.name}`;
    addMessage({ role: 'user', content: messageContent, fileInfo: { name: file.name, type: file.type } });
    try {
        const content = await file.text();
        const review = isCodeFile ? await reviewCode(content, file.name) : await reviewTextFile(content, file.name);
        addMessage({ role: 'model', content: review });
    } catch (error) {
        console.error("Error reviewing file:", error);
        addMessage({ role: 'model', content: t('fileReadError') });
    } finally { setIsLoading(false); }
  };

  const handleSummarize = async () => {
    if (isLoading || chatHistory.length < 2 || isLimitReached) return;
    setIsLoading(true);
    onMessageSent(); // Decrement count
    try {
        const summary = await summarizeConversation(chatHistory, personality);
        addMessage({ role: 'model', content: summary, isSummary: true });
    } catch (error) { console.error("Error summarizing:", error); addMessage({ role: 'model', content: t('error') }); } 
    finally { setIsLoading(false); }
  };

  const handleImageDesign = async (prompt: string, history: ChatMessage[]) => {
    try {
        const base64Image = await generateImage(prompt, history, personality);
        if (base64Image) { addMessage({ role: 'model', content: '', imageUrl: `data:image/png;base64,${base64Image}` }); } 
        else { addMessage({ role: 'model', content: t('imagePolicyError') }); }
    } catch (error) { console.error("Error generating image:", error); addMessage({ role: 'model', content: t('error') }); }
  };
  
  const handleGenerateLogo = async (prompt: string, history: ChatMessage[]) => {
    try {
        const base64Image = await generateLogo(prompt, history, personality);
        if (base64Image) { addMessage({ role: 'model', content: '', imageUrl: `data:image/png;base64,${base64Image}` }); } 
        else { addMessage({ role: 'model', content: t('logoPolicyError') }); }
    } catch (error) { console.error("Error generating logo:", error); addMessage({ role: 'model', content: t('error') }); }
  };

  const handleGenerateCode = async (prompt: string, history: ChatMessage[]) => {
    try {
        const codeResponse = await generateCode(prompt, history, personality);
        addMessage({ role: 'model', content: '', code: codeResponse });
    } catch (error) { console.error("Error generating code:", error); addMessage({ role: 'model', content: t('error') }); }
  };

  const handleDownloadImage = async (imageUrl: string, filename: string = 'generated-image.png') => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) { console.error("Error downloading image:", error); }
  };

  const handleEditGeneratedImage = async (imageUrl: string) => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "generated-image.png", { type: blob.type });
        setStagedImage({ file, previewUrl: imageUrl, type: 'edit' });
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    } catch (error) { console.error("Error staging generated image for edit:", error); }
  };

  const toggleSelection = (id: string) => {
    setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
        return newSet;
    });
  };

  const handleDeleteSelected = () => {
    deleteSelectedMessages(selectedMessages);
    setSelectedMessages(new Set());
    setIsEditing(false);
  };
  
  const CodeBlock: React.FC<{ language: string; content: string; appLanguage: AppLanguage; }> = ({ language, content, appLanguage }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-[#0d1117] rounded-lg my-2 w-full">
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

  if (!conversation) {
     return (
        <div className="w-full h-full flex flex-col bg-[var(--color-bg-secondary)]">
            <div className="flex-shrink-0 p-3 border-b border-[var(--color-border)] flex justify-between items-center md:hidden">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">{name}</h1>
                </div>
                <button onClick={toggleSidebar} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"><Bars3Icon className="w-6 h-6"/></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                 <div className="w-24 h-24 mb-4">
                    <AvatarDisplay avatar={personality.avatar} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">ابدأ محادثة جديدة</h2>
                <p className="text-[var(--color-text-secondary)] max-w-sm">اختر محادثة أو ابدأ واحدة جديدة من الشريط الجانبي للتحدث مع {name}.</p>
            </div>
        </div>
     )
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-secondary)]">
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setZoomedImage(null)}>
            <img src={zoomedImage} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" alt="Zoomed content"/>
            <button className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors">
                <XMarkIcon className="w-8 h-8"/>
            </button>
        </div>
      )}
      <header className="flex-shrink-0 p-3 border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] md:hidden" aria-label="Toggle sidebar"><Bars3Icon className="w-6 h-6"/></button>
            <h1 className="text-lg font-bold truncate">{conversation.title}</h1>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => handleSummarize()} title={t('summarize')} disabled={isLoading || isLimitReached} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><DocumentMagnifyingGlassIcon className="w-5 h-5"/></button>
             <button onClick={() => setIsEditing(!isEditing)} title={t('editMessages')} className={`p-2 transition-colors ${isEditing ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'} hover:text-[var(--color-text-primary)]`}><PencilSquareIcon className="w-5 h-5"/></button>
          </div>
      </header>

      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {chatHistory.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex items-start gap-3 my-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                {isEditing && msg.role !== 'model' && <div className="w-12 flex-shrink-0"></div>}
                {isEditing && msg.role === 'model' && (
                    <input type="checkbox" checked={selectedMessages.has(msg.id)} onChange={() => toggleSelection(msg.id)} className="form-checkbox h-5 w-5 mt-2 bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] flex-shrink-0" />
                )}
                
                {msg.role === 'model' && (
                    <div className="w-8 h-8 flex-shrink-0 self-start mt-1">
                        <AvatarDisplay avatar={personality.avatar} />
                    </div>
                )}

                <div className={`relative max-w-xs md:max-w-md lg:max-w-2xl p-3.5 rounded-2xl break-words group ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-br-lg' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-bl-lg'}`}>
                    {msg.imageUrl && (
                        <div className="relative group max-w-xs">
                            {msg.content && <p className="whitespace-pre-wrap mb-2">{msg.content}</p>}
                            <button onClick={() => setZoomedImage(msg.imageUrl!)} className="block w-full rounded-lg overflow-hidden">
                                <img src={msg.imageUrl} alt={msg.content || 'Generated content'} className="w-full h-auto" />
                            </button>
                            {msg.role === 'model' && (
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDownloadImage(msg.imageUrl!)} title={t('download')} className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors">
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleEditGeneratedImage(msg.imageUrl!)} title={t('edit')} className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors">
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {msg.code && <CodeBlock language={msg.code.language} content={msg.code.content} appLanguage={language} />}
                    {msg.isSummary && (
                        <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] w-full">
                            <h3 className="text-lg font-bold mb-2 text-[var(--color-accent)]">{t('summarize')}</h3>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    )}
                    {msg.fileInfo && (
                        <div className="flex items-center gap-3 p-2 bg-[var(--color-bg-primary)] rounded-lg">
                            <DocumentTextIcon className="w-6 h-6 text-[var(--color-accent)] flex-shrink-0" />
                            <span className="text-sm">{msg.content}</span>
                        </div>
                    )}
                    {!msg.imageUrl && !msg.code && !msg.isSummary && !msg.fileInfo && <p className="whitespace-pre-wrap">{msg.content}</p>}
                </div>

                {isEditing && msg.role === 'user' && (
                    <input type="checkbox" checked={selectedMessages.has(msg.id)} onChange={() => toggleSelection(msg.id)} className="form-checkbox h-5 w-5 mt-2 bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] flex-shrink-0" />
                )}
            </div>
            ))
        }
        {isLoading && (
          <div className="flex items-start gap-3 my-3 justify-start">
             <div className="w-8 h-8 flex-shrink-0 self-start mt-1">
              <AvatarDisplay avatar={personality.avatar} />
            </div>
            <div className="max-w-xs p-3.5 rounded-2xl bg-[var(--color-bg-tertiary)] rounded-bl-lg">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full animate-pulse"></span>
                    <span className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full animate-pulse [animation-delay:0.1s]"></span>
                    <span className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full animate-pulse [animation-delay:0.2s]"></span>
                </div>
            </div>
          </div>
        )}
      </div>
      <footer className="flex-shrink-0 p-2 md:p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        {isEditing && (
             <div className="max-w-2xl mx-auto mb-2 flex justify-between items-center p-2 bg-[var(--color-bg-tertiary)] rounded-md">
                <span className="text-sm">{t('deleteSelectedPrompt', { count: selectedMessages.size })}</span>
                <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="text-sm px-3 py-1 rounded-md hover:bg-[var(--color-border)]">{t('done')}</button>
                    <button onClick={handleDeleteSelected} disabled={selectedMessages.size === 0} className="text-sm px-3 py-1 rounded-md bg-red-500 text-white disabled:bg-red-500/50">{t('deleteSelected')}</button>
                </div>
             </div>
        )}
        <div className="max-w-2xl mx-auto">
            {impersonateMode && devMode && <div className="text-center text-xs text-yellow-400 mb-1">{t('impersonateActive')}</div>}
            {isBanned && (
                <div className="text-center text-red-400 text-sm mb-2">
                    <p>{t('banTimeRemaining')}: {Math.floor(banTimeRemaining / 60000)}:{('0' + Math.floor((banTimeRemaining % 60000) / 1000)).slice(-2)}</p>
                </div>
            )}
            {stagedImage && (
                <div className="relative w-24 h-24 mb-2 p-1.5 bg-[var(--color-bg-tertiary)] rounded-xl shadow-md">
                    <img src={stagedImage.previewUrl} alt="Staged for upload" className="w-full h-full object-cover rounded-lg" />
                    <button onClick={() => setStagedImage(null)} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 border-2 border-[var(--color-bg-secondary)] hover:scale-110 transition-transform">
                        <XMarkIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
            <form onSubmit={handleFormSubmit} className={`relative flex items-end gap-2 p-2 bg-[var(--color-bg-primary)] rounded-2xl border-2 border-transparent focus-within:border-[var(--color-primary)] transition-all ${isBanned || isLimitReached ? 'opacity-50' : ''}`}>
                <div className="relative self-center" ref={attachmentMenuRef}>
                    <input type="file" ref={imageInputRef} onChange={(e) => handleImageFileChange(e, 'edit')} className="hidden" accept="image/png, image/jpeg, image/webp, image/heic, image/heif" />
                    <input type="file" ref={homeworkInputRef} onChange={(e) => handleImageFileChange(e, 'homework')} className="hidden" accept="image/png, image/jpeg, image/webp, image/heic, image/heif" />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.js,.py,.html,.css,.json,.ts,.jsx,.tsx,.c,.cpp,.cs,.go,.rb,.php,.sh,.bat,.xml,.yaml" />

                    <button type="button" onClick={() => setIsAttachmentMenuOpen(prev => !prev)} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 transition-colors" disabled={isLoading || isBanned || isLimitReached}>
                        <PaperClipIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    </button>

                    {isAttachmentMenuOpen && (
                        <div className="absolute bottom-full mb-2 w-60 bg-[var(--color-bg-secondary)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden z-10">
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
                    placeholder={isLimitReached ? t('limitReachedPlaceholder') : t('placeholder', { name })}
                    disabled={isLoading || isBanned || isLimitReached}
                    className="flex-1 py-1.5 px-2 bg-transparent resize-none max-h-40 focus:outline-none placeholder-[var(--color-text-secondary)] text-sm"
                />

                <div className="flex items-center gap-2 self-center">
                    <button type="button" onClick={() => setIsThinkingMode(prev => !prev)} title={t('thinkingModeTooltip')} className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 ${isThinkingMode ? 'bg-[var(--color-accent)] text-white scale-110' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`} disabled={isLoading || isBanned || isLimitReached}>
                        <CpuChipIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || isBanned || isLimitReached || (!userInput.trim() && !stagedImage)}
                        className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-border)] disabled:cursor-not-allowed transition-all"
                    >
                        <SendIcon className="w-5 h-5 text-white" />
                    </button>
                </div>
            </form>
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;