export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
  fileInfo?: {
    name: string;
    type: string;
  };
  code?: {
    language: string;
    content: string;
  };
  isSummary?: boolean;
};

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}


export enum AIAvatar {
  ORB = 'ORB',
  BOT = 'BOT',
  GEOMETRIC = 'GEOMETRIC',
  CRYSTAL = 'CRYSTAL',
  NEBULA = 'NEBULA',
}

export enum AIGender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

export interface AIPersonality {
  avatar: AIAvatar;
  gender: AIGender;
}

export type AppLanguage = 'en' | 'ar';

export type Theme = 'earthy' | 'purple';

export type ModelConfig = {
  temperature: number;
  topP: number;
};
