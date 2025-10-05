'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Building2, 
  Sparkles, 
  BarChart3, 
  Menu,
  X,
  Home,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StablexLogo } from '@/components/StablexLogo';
import { cn } from '@/lib/utils';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    description: 'Genel bakış'
  },
  { 
    name: 'Stablex vs TR', 
    href: '/stablex-vs-tr', 
    icon: Building2,
    description: 'TR borsaları karşılaştırması',
    highlight: true
  },
  { 
    name: 'Feature Matrix', 
    href: '/matrix', 
    icon: LayoutGrid,
    description: 'Özellik karşılaştırma tablosu'
  },
  { 
    name: 'Rakipler', 
    href: '/competitors', 
    icon: Building2,
    description: 'Tüm borsalar'
  },
  { 
    name: 'Özellikler', 
    href: '/features', 
    icon: Sparkles,
    description: 'Feature detayları'
  },
  { 
    name: 'Analizler', 
    href: '/analytics', 
    icon: BarChart3,
    description: 'Gap analizi'
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const currentPage = navigation.find(item => pathname.startsWith(item.href))?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <StablexLogo className="h-8" showText={false} />
          </div>
          <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{currentPage}</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 lg:translate-x-0 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-3">
              <StablexLogo className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">CompetitorLens</h1>
                <p className="text-xs text-gray-500">Rakip Analiz Platformu</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm"
                      : item.highlight 
                        ? "text-blue-700 bg-blue-50/50 hover:bg-blue-100/50"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-blue-400" />}
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5 transition-all",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <p className="text-xs font-medium text-gray-700">Platform Versiyon</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">v2.0.0</p>
                <p className="text-xs text-gray-500 mt-2">© 2024 Stablex</p>
              </div>
              <div className="flex justify-center">
                <StablexLogo variant="compact" showText={false} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-72">
        <main className={cn(
          "min-h-screen",
          "pt-16 lg:pt-0", // Mobile için header yüksekliği kadar padding
          "px-4 py-6 lg:px-8"
        )}>
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb for desktop */}
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <Link href="/dashboard" className="hover:text-gray-900">
                Dashboard
              </Link>
              {pathname !== '/dashboard' && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{currentPage}</span>
                </>
              )}
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
