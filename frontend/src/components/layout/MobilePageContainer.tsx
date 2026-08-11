import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function MobilePageContainer({ children, className = '' }: Props) {
  return (
    <div className={`min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-20 ${className}`}>
      {children}
    </div>
  );
}
