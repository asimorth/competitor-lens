'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Grid3X3, 
  Image, 
  BarChart3, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Ana Sayfa'
  },
  {
    href: '/matrix',
    icon: Grid3X3,
    label: 'Matrix'
  },
  {
    href: '/screenshots',
    icon: Image,
    label: 'Görseller'
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Analitik'
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Ayarlar'
  }
];

export function MobileNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <img src="/stablex-logo.png" alt="Stablex" className="h-8 w-8" />
          <span className="font-semibold text-lg">CompetitorLens</span>
        </Link>
        
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Slide Menu */}
      <div className={cn(
        "md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
        isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed top-0 right-0 h-full w-64 bg-white shadow-xl transition-transform duration-300",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-4 border-b">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="ml-auto block p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2",
                    isActive 
                      ? "bg-blue-50 text-blue-600" 
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 relative",
                  isActive ? "text-blue-600" : "text-gray-500"
                )}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-600" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed elements */}
      <div className="md:hidden h-16" />
      <div className="md:hidden h-16" />
    </>
  );
}
