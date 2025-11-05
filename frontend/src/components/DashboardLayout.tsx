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
      {/* Mobile Header - Clean & Minimal */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 safe-area-top">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <StablexLogo className="h-5" showText={false} />
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{currentPage}</span>
        </div>
      </div>

      {/* Sidebar - Modern Design */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 lg:translate-x-0 transition-transform duration-300 shadow-xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo - Modern Gradient Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <StablexLogo className="h-8" showText={false} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors">CompetitorLens</h1>
                <p className="text-xs text-blue-100">Rakip Analiz Platformu</p>
              </div>
            </Link>
          </div>

          {/* Navigation - Modern Style */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                      : item.highlight 
                        ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:shadow-sm"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 animate-pulse" />
                  )}
                  <div className={cn(
                    "mr-3 h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center transition-all relative z-10",
                    isActive 
                      ? "bg-white/20 backdrop-blur-sm shadow-inner" 
                      : "bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 transition-all group-hover:scale-110",
                      isActive ? "text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
                    )} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{item.name}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-white/80 animate-pulse" />}
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5 transition-all",
                      isActive ? "text-white/90" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer - Modern Gradient */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="space-y-3">
              <div className="px-4 py-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]"></div>
                <div className="relative z-10">
                  <p className="text-xs font-medium text-blue-100">Platform Versiyon</p>
                  <p className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                    v2.0.0
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-medium">STABLE</span>
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-blue-100">© 2025 Stablex</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                      <span className="text-xs text-white font-medium">Online</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                  <StablexLogo variant="compact" showText={false} className="h-6" />
                </div>
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

      {/* Main Content - Mobile Optimized Spacing */}
      <div className="lg:pl-72">
        <main className={cn(
          "min-h-screen pb-20 lg:pb-6", // Extra bottom padding for mobile nav
          "pt-14 lg:pt-0", // Compact mobile header
          "px-3 py-4 md:px-4 md:py-6 lg:px-8"
        )}>
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb for desktop only */}
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
