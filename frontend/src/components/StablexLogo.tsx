'use client';

import { cn } from '@/lib/utils';

interface StablexLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'compact';
}

export function StablexLogo({ className, showText = true, variant = 'default' }: StablexLogoProps) {
  // Base classes that are always applied
  const baseClasses = variant === 'compact' 
    ? "relative inline-flex" 
    : "inline-flex items-center space-x-3";
  
  // Combine with custom className if provided
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  if (variant === 'compact') {
    return (
      <div className={combinedClasses}>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">S</span>
        </div>
      </div>
    );
  }

  return (
    <div className={combinedClasses}>
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">Stablex</span>
          <span className="text-xs text-gray-500">Technology</span>
        </div>
      )}
    </div>
  );
}

// Default export for backward compatibility
export default StablexLogo;