'use client';

import { usePersona, Persona } from '@/contexts/PersonaContext';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Palette, 
  TrendingUp,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const icons = {
  pm: Target,
  designer: Palette,
  executive: TrendingUp
};

const colors = {
  pm: 'blue',
  designer: 'purple',
  executive: 'emerald'
};

const labels = {
  pm: 'Product Manager',
  designer: 'Product Designer',
  executive: 'Executive'
};

const descriptions = {
  pm: 'Strategic & Roadmap',
  designer: 'UI/UX & Quality',
  executive: 'High-level Insights'
};

export function PersonaToggle() {
  const { activePersona, setActivePersona, personaConfig } = usePersona();
  const Icon = icons[activePersona];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "flex items-center gap-2 border-2 transition-all",
            activePersona === 'pm' && "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100",
            activePersona === 'designer' && "border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100",
            activePersona === 'executive' && "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">
            {personaConfig.label}
          </span>
          <span className="sm:hidden font-medium">
            {activePersona.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-gray-500">
          View Mode
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {(['pm', 'designer', 'executive'] as Persona[]).map((persona) => {
          const PersonaIcon = icons[persona];
          const isActive = activePersona === persona;
          
          return (
            <DropdownMenuItem
              key={persona}
              onClick={() => setActivePersona(persona)}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                isActive && "bg-gray-100"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                persona === 'pm' && "bg-blue-100",
                persona === 'designer' && "bg-purple-100",
                persona === 'executive' && "bg-emerald-100"
              )}>
                <PersonaIcon className={cn(
                  "h-4 w-4",
                  persona === 'pm' && "text-blue-600",
                  persona === 'designer' && "text-purple-600",
                  persona === 'executive' && "text-emerald-600"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{labels[persona]}</span>
                  {isActive && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {descriptions[persona]}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function PersonaToggleCompact() {
  const { activePersona, setActivePersona } = usePersona();

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {(['pm', 'designer', 'executive'] as Persona[]).map((persona) => {
        const Icon = icons[persona];
        const isActive = activePersona === persona;
        
        return (
          <button
            key={persona}
            onClick={() => setActivePersona(persona)}
            className={cn(
              "p-2 rounded-md transition-all flex items-center justify-center",
              isActive && persona === 'pm' && "bg-blue-500 text-white shadow-sm",
              isActive && persona === 'designer' && "bg-purple-500 text-white shadow-sm",
              isActive && persona === 'executive' && "bg-emerald-500 text-white shadow-sm",
              !isActive && "text-gray-600 hover:bg-gray-200"
            )}
            title={labels[persona]}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

