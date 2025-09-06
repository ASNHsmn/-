import React from 'react';
import { AIAvatar } from '../types.ts';

interface AvatarDisplayProps {
  avatar: AIAvatar;
}

const OrbAvatar: React.FC = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <radialGradient id="orbGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="var(--color-primary-hover)" />
                <stop offset="100%" stopColor="var(--color-primary)" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#orbGradient)" />
    </svg>
);

const BotAvatar: React.FC = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="20" width="70" height="60" rx="10" fill="var(--color-bg-tertiary)"/>
        <rect x="25" y="35" width="50" height="30" fill="var(--color-bg-primary)" rx="5"/>
        <circle cx="40" cy="50" r="8" fill="var(--color-primary)" />
        <circle cx="60" cy="50" r="8" fill="var(--color-primary)" />
        <rect x="10" y="45" width="5" height="10" fill="var(--color-border)" rx="2"/>
        <rect x="85" y="45" width="5" height="10" fill="var(--color-border)" rx="2"/>
    </svg>
);

const GeometricAvatar: React.FC = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
         <g transform="translate(50,50)">
            <path d="M0 -40 L34.6 -20 L34.6 20 L0 40 L-34.6 20 L-34.6 -20 Z" fill="var(--color-accent)" />
            <path d="M0 -20 L17.3 -10 L17.3 10 L0 20 L-17.3 10 L-17.3 -10 Z" fill="var(--color-primary)" stroke="var(--color-bg-primary)" strokeWidth="3"/>
        </g>
    </svg>
);

const CrystalAvatar: React.FC = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path d="M50 10 L70 40 L50 90 L30 40 Z" fill="var(--color-accent)" stroke="var(--color-primary)" strokeWidth="2" />
            <path d="M50 10 L30 40 L50 55 Z" fill="var(--color-accent)" opacity="0.8" />
            <path d="M50 10 L70 40 L50 55 Z" fill="var(--color-primary-hover)" opacity="0.6" />
            <path d="M30 40 L50 90 L50 55 Z" fill="var(--color-primary)" opacity="0.7" />
            <path d="M70 40 L50 90 L50 55 Z" fill="var(--color-primary)" opacity="0.5" />
        </g>
    </svg>
);

const NebulaAvatar: React.FC = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                <feBlend in="SourceGraphic" in2="goo" />
            </filter>
            <radialGradient id="nebulaGradient">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-primary)" />
            </radialGradient>
        </defs>
        <g filter="url(#goo)">
            <circle cx="50" cy="50" r="25" fill="url(#nebulaGradient)" />
            <circle cx="40" cy="40" r="15" fill="var(--color-primary-hover)" />
             <circle cx="60" cy="60" r="18" fill="var(--color-primary-hover)" opacity="0.7" />
        </g>
    </svg>
);

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ avatar }) => {
  switch (avatar) {
    case AIAvatar.ORB:
      return <OrbAvatar />;
    case AIAvatar.BOT:
      return <BotAvatar />;
    case AIAvatar.GEOMETRIC:
      return <GeometricAvatar />;
    case AIAvatar.CRYSTAL:
      return <CrystalAvatar />;
    case AIAvatar.NEBULA:
      return <NebulaAvatar />;
    default:
      return <OrbAvatar />;
  }
};

export default AvatarDisplay;