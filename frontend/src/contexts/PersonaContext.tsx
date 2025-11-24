'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Persona = 'pm' | 'designer' | 'executive';

interface PersonaContextType {
  activePersona: Persona;
  setActivePersona: (persona: Persona) => void;
  personaConfig: {
    label: string;
    description: string;
    icon: string;
    color: string;
  };
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const personaConfigs = {
  pm: {
    label: 'Product Manager',
    description: 'Strategic feature analysis and roadmap planning',
    icon: 'Target',
    color: 'blue'
  },
  designer: {
    label: 'Product Designer',
    description: 'UI/UX quality and visual benchmarking',
    icon: 'Palette',
    color: 'purple'
  },
  executive: {
    label: 'Executive',
    description: 'High-level metrics and strategic insights',
    icon: 'TrendingUp',
    color: 'emerald'
  }
};

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [activePersona, setActivePersona] = useState<Persona>('pm');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('activePersona') as Persona;
    if (saved && ['pm', 'designer', 'executive'].includes(saved)) {
      setActivePersona(saved);
    }
  }, []);

  // Save to localStorage on change
  const handleSetPersona = (persona: Persona) => {
    setActivePersona(persona);
    localStorage.setItem('activePersona', persona);
  };

  const personaConfig = personaConfigs[activePersona];

  return (
    <PersonaContext.Provider
      value={{
        activePersona,
        setActivePersona: handleSetPersona,
        personaConfig
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}

export { personaConfigs };

