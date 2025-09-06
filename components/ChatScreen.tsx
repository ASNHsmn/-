import React, { useState, useEffect, useRef } from 'react';
import { AIPersonality, ChatMessage, AppLanguage, Conversation, ModelConfig, AIGender } from '../types';
import { startChat, reviewTextFile, reviewCode, generateImage, generateLogo, generateCode, summarizeConversation, generateConversationTitle, editImage, solveHomeworkFromImage } from '../services/geminiService';
import AvatarDisplay from './AvatarDisplay';
import { Chat } from '@google/genai';
import { translations } from '../locales';
import { SendIcon, Bars3Icon, ClipboardIcon, DocumentTextIcon, CodeBracketIcon, PhotoIcon, TrashIcon, PencilSquareIcon, CheckIcon, XMarkIcon, PaperClipIcon, DocumentMagnifyingGlassIcon, CpuChipIcon, ArrowDownTrayIcon } from './icons/Icons';

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
}) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<{id: string, content: string} | null>(null);
  const [stagedImage, setStagedImage] = useState<{file: File, previewUrl: string, type: 'edit' | 'homework'} | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  
  // Ban & Warning System State
  const [abuseWarnings, setAbuseWarnings] = useState(0);
  const [banEndTime, setBanEndTime] = useState<number | null>(null);
  const [banTimeRemaining, setBanTimeRemaining] = useState(0);

  // Dev mode activation state
  const [devModeStep, setDevModeStep] = useState(0);
  const devCodes = {
    step1: 'KittKittKio=', // *+_+_+*
    step2: 'U2FlZWQyMDA5JA==', // Saeed2009$
    step3: 'U01OMTIzNCQ=', // SMN1224$
    step4: 'SkFNTF9TVVBFUlZJU09SXzIwMzA=', // JAML_SUPERVISOR_2030
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const homeworkInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  
  const name = personality.gender === AIGender.MALE ? 'جمل' : 'ناقة';

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
  
  // On mount, check localStorage for a persistent ban
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

  // When banEndTime is set, manage the interval timer for the countdown
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

          updateTimer(); // Run immediately to set initial time
          const timerId = setInterval(updateTimer, 1000);

          return () => clearInterval(timerId); // Cleanup on unmount or when ban ends
      }
  }, [banEndTime]);
  
  const isBanned = banEndTime !== null && banTimeRemaining > 0;

  useEffect(() => {
    if (conversation) {
      // Pass modelConfig only when in dev mode
      const newChat = startChat(personality, chatHistory, devMode ? modelConfig : undefined);
      setChat(newChat);

      if(chatHistory.length === 0) {
          addMessage({ role: 'model', content: t('initialMessage', { name }) });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, personality, devMode, modelConfig]);
  
  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, isLoading]);
   
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-generate title for new conversations
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

    const sequenceFailed = () => {
        setDevModeStep(0); 
        return false; // Let the AI handle it as a normal message now
    };

    try {
        const b64Prompt = btoa(prompt);

        switch (devModeStep) {
            case 0:
                if (b64Prompt === devCodes.step1) {
                    setDevModeStep(1);
                    addMessage({ role: 'model', content: '...' });
                    return true;
                }
                break;
            case 1:
                if (b64Prompt === devCodes.step2) {
                    setDevModeStep(2);
                    addMessage({ role: 'model', content: '...' });
                    return true;
                }
                return sequenceFailed(); 
            case 2:
                if (b64Prompt === devCodes.step3) {
                    setDevModeStep(3);
                    addMessage({ role: 'model', content: 'كلمة سر الإشراف؟' });
                    return true;
                }
                return sequenceFailed();
            case 3:
                if (b64Prompt === devCodes.step4) {
                    setDevModeStep(0);
                    onDevModeActivate();
                    addMessage({ role: 'model', content: 'تم تفعيل وضع المطور.' });
                    return true;
                }
                return sequenceFailed();
        }
    } catch (e) {
        if (devModeStep > 0) {
            return sequenceFailed();
        }
    }
    return false;
  };


  const handleSendMessage = async (prompt: string, file?: File) => {
    if ((!prompt && !file && !stagedImage) || isLoading || !conversation) return;
    
    if (handleDevModeSequence(prompt)) {
      setUserInput('');
      return;
    }
    
    const finalPrompt = isThinkingMode
        ? `فكر بعمق وبشكل منهجي قبل الإجابة. قدم إجابة مفصلة وشاملة.\n\n${prompt}`
        : prompt;

    setIsLoading(true);

    if (stagedImage) {
        if (stagedImage.type === 'edit') {
            await handleImageEdit(finalPrompt, stagedImage.file);
        } else if (stagedImage.type === 'homework') {
            await handleHomeworkSolve(finalPrompt, stagedImage.file);
        }
        setStagedImage(null);
        setUserInput('');
        setIsLoading(false);
        return;
    }

    const userMessageRole = impersonateMode ? 'model' : 'user';
    addMessage({ role: userMessageRole, content: prompt });
    setUserInput('');

    try {
      if (file) {
        await handleFileReview(file);
      } else if (/شعار|logo/i.test(prompt)) {
        await handleGenerateLogo(finalPrompt, chatHistory);
      } else if (/صمم|ارسم|صورة لـ|design|image of|draw/i.test(prompt)) {
        await handleImageDesign(finalPrompt, chatHistory);
      } else if (/اكتب كود|كود بـ|دالة|function|code|script|برمج/i.test(prompt)) {
        await handleGenerateCode(finalPrompt, chatHistory);
      } else if(chat) {
        const response = await chat.sendMessage({ message: finalPrompt });
        if (response.text.trim() === '[ABUSE_DETECTED]') {
            const newWarningCount = abuseWarnings + 1;
            setAbuseWarnings(newWarningCount);

            if (newWarningCount <= 2) {
                addMessage({ role: 'model', content: t(newWarningCount === 1 ? 'warning1Message' : 'warning2Message') });
            } else {
                const endTime = Date.now() + 5 * 60 * 1000;
                localStorage.setItem('jaml-ban-end-time', String(endTime));
                setBanEndTime(endTime);
                addMessage({ role: 'model', content: t('banMessage') });
                setAbuseWarnings(0); // Reset for after the ban
            }
        } else {
            addMessage({ role: 'model', content: response.text });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage({ role: 'model', content: t('error') });
    } finally {
      setIsLoading(false);
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

        if (result.text) {
            addMessage({ role: 'model', content: result.text });
        }
        if (result.imageUrl) {
            addMessage({ role: 'model', content: '', imageUrl: result.imageUrl });
        }
        if (!result.text && !result.imageUrl) {
            addMessage({ role: 'model', content: t('error') });
        }
    } catch (error) {
        console.error("Error editing image:", error);
        addMessage({ role: 'model', content: t('error') });
    }
  };

  const handleHomeworkSolve = async (prompt: string, file: File) => {
    addMessage({ role: 'user', content: prompt, imageUrl: URL.createObjectURL(file) });
    try {
        const base64Data = await toBase64(file);
        const result = await solveHomeworkFromImage(prompt, { data: base64Data, mimeType: file.type });
        addMessage({ role: 'model', content: result });
    } catch (error) {
        console.error("Error solving homework from image:", error);
        addMessage({ role: 'model', content: t('error') });
    }
  };


  const handleFileReview = async (file: File) => {
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
    }
  };

  const handleSummarize = async () => {
    if (isLoading || chatHistory.length < 2) return;
    setIsLoading(true);
    try {
        const summary = await summarizeConversation(chatHistory, personality);
        addMessage({ role: 'model', content: summary, isSummary: true });
    } catch (error) {
        console.error("Error summarizing:", error);
        addMessage({ role: 'model', content: t('error') });
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageDesign = async (prompt: string, history: ChatMessage[]) => {
    try {
        const base64Image = await generateImage(prompt, history, personality);
        if (base64Image) {
            addMessage({ role: 'model', content: '', imageUrl: `data:image/png;base64,${base64Image}` });
        } else {
            addMessage({ role: 'model', content: t('imagePolicyError') });
        }
    } catch (error) {
        console.error("Error generating image:", error);
        addMessage({ role: 'model', content: t('error') });
    }
  };
  
  const handleGenerateLogo = async (prompt: string, history: ChatMessage[]) => {
    try {
        const base64Image = await generateLogo(prompt, history, personality);
        if (base64Image) {
            addMessage({ role: 'model', content: '', imageUrl: `data:image/png;base64,${base64Image}` });
        } else {
            addMessage({ role: 'model', content: t('logoPolicyError') });
        }
    } catch (error) {
        console.error("Error generating logo:", error);
        addMessage({ role: 'model', content: t('error') });
    }
  };

  const handleGenerateCode = async (prompt: string, history: ChatMessage[]) => {
    try {
        const codeResponse = await generateCode(prompt, history, personality);
        addMessage({ role: 'model', content: '', code: codeResponse });
    } catch (error) {
        console.error("Error generating code:", error);
        addMessage({ role: 'model', content: t('error') });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput.trim());
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileReview(file);
      setIsAttachmentMenuOpen(false);
      e.target.value = ''; // Reset file input
    }
  }
  
  const handleImageStage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setStagedImage({ file, previewUrl: URL.createObjectURL(file), type: 'edit' });
        setIsAttachmentMenuOpen(false);
        e.target.value = ''; // Reset file input
    }
  };
  
  const handleHomeworkStage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setStagedImage({ file, previewUrl: URL.createObjectURL(file), type: 'homework' });
        if (!userInput) {
            setUserInput(t('homeworkPrompt'));
        }
        setIsAttachmentMenuOpen(false);
        e.target.value = ''; // Reset file input
    }
  };

  const handleDownloadImage = async (imageUrl: string, filename: string = 'generated-image.png') => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleEditGeneratedImage = async (imageUrl: string) => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "generated-image.png", { type: blob.type });
        setStagedImage({ file, previewUrl: imageUrl, type: 'edit' });
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    } catch (error) {
        console.error("Error staging generated image for edit:", error);
    }
  };


  const toggleSelection = (id: string) => {
    setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleDeleteSelected = () => {
    deleteSelectedMessages(selectedMessages);
    setSelectedMessages(new Set());
    setIsEditing(false);
  };
  
  const handleSaveEdit = () => {
    if (editingMessage) {
        updateMessageContent(editingMessage.id, editingMessage.content);
        setEditingMessage(null);
    }
  };

  const CodeBlock = ({ language, content }: { language: string, content: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#0d1117] rounded-lg my-2">
            <div className="flex justify-between items-center px-3 py-1 bg-[var(--color-bg-primary)] rounded-t-lg text-xs">
                <span className="text-[var(--color-text-secondary)]">{language}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                    {copied ? t('codeCopied') : t('copyCode')}
                </button>
            </div>
            <pre className="p-3 text-sm overflow-x-auto"><code>{content}</code></pre>
        </div>
    );
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (editingMessage?.id === msg.id) {
        return (
            <div className="flex flex-col gap-2 w-full">
                <textarea 
                    value={editingMessage.content}
                    onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
                    className="w-full p-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-sm"
                    rows={4}
                />
                <div className="flex justify-end gap-2">
                     <button onClick={() => setEditingMessage(null)} className="text-xs p-1 hover:bg-[var(--color-bg-secondary)] rounded"><XMarkIcon className="w-5 h-5"/></button>
                     <button onClick={handleSaveEdit} className="text-xs p-1 hover:bg-[var(--color-bg-secondary)] rounded"><CheckIcon className="w-5 h-5"/></button>
                </div>
            </div>
        )
    }

    if (msg.imageUrl) {
        const isModelImage = msg.role === 'model';
        return (
            <div className="relative group">
                <button onClick={() => setZoomedImage(msg.imageUrl!)} className="block w-full">
                     <img src={msg.imageUrl} alt="Generated content" className="max-w-xs h-auto rounded-lg" />
                </button>
                {isModelImage && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownloadImage(msg.imageUrl!)} title={t('download')} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditGeneratedImage(msg.imageUrl!)} title={t('edit')} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white">
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        );
    }
    if (msg.code) {
        return <CodeBlock language={msg.code.language} content={msg.code.content} />;
    }
    if (msg.isSummary) {
      return (
        <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
          <h3 className="text-lg font-bold mb-2 text-[var(--color-accent)]">{t('summarize')}</h3>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
      );
    }
    if (msg.fileInfo) {
        return (
             <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-[var(--color-accent)]" />
                <span>{msg.content}</span>
             </div>
        )
    }
    return <p className="whitespace-pre-wrap">{msg.content}</p>;
  };
  
  if (!conversation) {
     return (
        <div className="w-full h-full flex flex-col bg-[var(--color-bg-secondary)]">
            <div className="flex-shrink-0 p-3 border-b border-[var(--color-border)] flex justify-between items-center md:hidden">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">{name}</h1>
                    <span className="text-xs font-semibold bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">{t('beta')}</span>
                </div>
                <button onClick={toggleSidebar} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"><Bars3Icon className="w-6 h-6"/></button>
            </div>
            <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-[var(--color-text-secondary)]">ابدأ محادثة جديدة من الشريط الجانبي.</p>
            </div>
        </div>
     )
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-bg-secondary)]">
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in" onClick={() => setZoomedImage(null)}>
            <img src={zoomedImage} className="max-w-[90vw] max-h-[90vh] object-contain" alt="Zoomed content"/>
            <button className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors">
                <XMarkIcon className="w-8 h-8"/>
            </button>
        </div>
      )}
      <div className="flex-shrink-0 p-3 border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] md:hidden"><Bars3Icon className="w-6 h-6"/></button>
            <h1 className="text-xl font-bold truncate">{conversation.title}</h1>
            <span className="text-xs font-semibold bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">{t('beta')}</span>
          </div>
          <div className="flex items-center gap-2">
             <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".txt,.md,.js,.py,.html,.css,.json,.ts,.jsx,.tsx,.c,.cpp,.cs,.go,.rb,.php,.sh,.bat,.xml,.yaml" />
             <button onClick={() => handleSummarize()} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"><DocumentMagnifyingGlassIcon className="w-5 h-5"/></button>
             <button onClick={() => setIsEditing(!isEditing)} className={`p-2 ${isEditing ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'} hover:text-[var(--color-text-primary)]`}><PencilSquareIcon className="w-5 h-5"/></button>
          </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {chatHistory.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 mb-4">
                    <AvatarDisplay avatar={personality.avatar} />
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">{name}</h1>
                  <span className="text-sm font-semibold bg-[var(--color-primary)] text-white px-2.5 py-1 rounded-full">{t('beta')}</span>
                </div>
            </div>
        ) : (
            chatHistory.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex items-end gap-3 my-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                {isEditing && (
                    <input type="checkbox" checked={selectedMessages.has(msg.id)} onChange={() => toggleSelection(msg.id)} className="form-checkbox h-5 w-5 bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                )}
                {msg.role === 'model' && (
                <div className="w-8 h-8 flex-shrink-0 self-start">
                    <AvatarDisplay avatar={personality.avatar} />
                </div>
                )}
                <div className={`relative max-w-xs md:max-w-md lg:max-w-2xl p-3 rounded-2xl break-words group ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-br-lg' : 'bg-[var(--color-bg-tertiary)] rounded-bl-lg'}`}>
                    {renderMessageContent(msg)}
                    {devMode && !editingMessage && (
                        <button onClick={() => setEditingMessage({id: msg.id, content: msg.content})} className="absolute top-0 right-0 p-1 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <PencilSquareIcon className="w-4 h-4"/>
                        </button>
                    )}
                </div>
            </div>
            ))
        )}
        {isLoading && (
          <div className="flex items-end gap-3 my-2 justify-start">
             <div className="w-8 h-8 flex-shrink-0 self-start">
              <AvatarDisplay avatar={personality.avatar} />
            </div>
            <div className="max-w-xs p-3 rounded-2xl bg-[var(--color-bg-tertiary)] rounded-bl-lg">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse [animation-delay:0.1s]"></span>
                    <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse [animation-delay:0.2s]"></span>
                </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 p-2 md:p-4 border-t border-[var(--color-border)] bg-gradient-to-t from-[var(--color-bg-secondary)] to-transparent">
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
                <div className="relative w-20 h-20 mb-2 p-1 bg-[var(--color-bg-tertiary)] rounded-lg">
                    <img src={stagedImage.previewUrl} alt="Staged for upload" className="w-full h-full object-cover rounded-md" />
                    <button onClick={() => setStagedImage(null)} className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-0.5 border-2 border-[var(--color-bg-tertiary)]">
                        <XMarkIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
            <form onSubmit={handleFormSubmit} className={`flex items-center gap-3 ${isBanned ? 'opacity-50' : ''}`}>
                 <div className="relative" ref={attachmentMenuRef}>
                    <input type="file" ref={imageInputRef} onChange={handleImageStage} className="hidden" accept="image/png, image/jpeg, image/webp, image/heic, image/heif" />
                    <input type="file" ref={homeworkInputRef} onChange={handleHomeworkStage} className="hidden" accept="image/png, image/jpeg, image/webp, image/heic, image/heif" />
                    <button type="button" onClick={() => setIsAttachmentMenuOpen(prev => !prev)} className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[var(--color-bg-tertiary)] rounded-full hover:bg-[var(--color-bg-primary)] disabled:opacity-50 transition-colors" disabled={isLoading || isBanned}>
                        <PaperClipIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />
                    </button>
                    {isAttachmentMenuOpen && (
                        <div className="absolute bottom-full mb-2 w-56 bg-[var(--color-bg-tertiary)] rounded-lg shadow-lg border border-[var(--color-border)] overflow-hidden z-10">
                            <button onClick={() => imageInputRef.current?.click()} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-primary)] transition-colors">
                                <PhotoIcon className="w-5 h-5 text-[var(--color-accent)]" />
                                <span>{t('designOrEditImage')}</span>
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-primary)] transition-colors">
                                <DocumentTextIcon className="w-5 h-5 text-[var(--color-accent)]" />
                                <span>{t('reviewFile')}</span>
                            </button>
                            <button onClick={() => homeworkInputRef.current?.click()} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-primary)] transition-colors">
                                <DocumentMagnifyingGlassIcon className="w-5 h-5 text-[var(--color-accent)]" />
                                <span>{t('solveHomework')}</span>
                            </button>
                        </div>
                    )}
                 </div>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t('placeholder', { name })}
                    disabled={isLoading || isBanned}
                    className="flex-1 p-3 bg-[var(--color-bg-tertiary)] border-2 border-[var(--color-border)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors disabled:opacity-50"
                />
                <button type="button" onClick={() => setIsThinkingMode(prev => !prev)} title={t('thinkingModeTooltip')} className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-colors disabled:opacity-50 ${isThinkingMode ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]'}`} disabled={isLoading || isBanned}>
                    <CpuChipIcon className="w-6 h-6" />
                </button>
                <button
                    type="submit"
                    disabled={isLoading || isBanned || (!userInput.trim() && !stagedImage)}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed transition-all"
                >
                    <SendIcon className="w-6 h-6 text-white" />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
