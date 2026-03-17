import React from 'react';

interface BrandMarkProps {
  className?: string;
}

const BrandMark: React.FC<BrandMarkProps> = ({ className = 'h-10 w-10' }) => {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="56" height="52" rx="16" fill="#f3f5f7" />
      <path d="M15 23.5C15 21.567 16.567 20 18.5 20H45.5C47.433 20 49 21.567 49 23.5V26H15V23.5Z" fill="#141718" />
      <path d="M18 30H46" stroke="#141718" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 30V46" stroke="#141718" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 30V46" stroke="#141718" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 46H46" stroke="#141718" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 46V36.5C28 35.1193 29.1193 34 30.5 34H33.5C34.8807 34 36 35.1193 36 36.5V46" stroke="#141718" strokeWidth="3" strokeLinecap="round" />
      <circle cx="49.5" cy="16.5" r="4.5" fill="#2e9e58" />
    </svg>
  );
};

export default BrandMark;
