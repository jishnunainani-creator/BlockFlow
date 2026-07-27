import React from 'react';
import logoImg from '../../assets/blockflow_logo.png';

interface BlockFlowLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BlockFlowLogo: React.FC<BlockFlowLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={logoImg}
        alt="BlockFlow Logo"
        className={`${sizeClasses[size]} object-contain drop-shadow-md transition-transform duration-200 hover:scale-105`}
      />
    </div>
  );
};
