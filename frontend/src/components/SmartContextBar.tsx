'use client';

import { PersonaToggle } from './PersonaToggle';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Home,
  ChevronRight,
  Download,
  Share2,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface SmartContextBarProps {
  breadcrumbs?: Breadcrumb[];
  dataQuality?: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  quickActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }>;
  children?: React.ReactNode;
}

export function SmartContextBar({ 
  breadcrumbs = [],
  dataQuality,
  quickActions = [],
  children
}: SmartContextBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: Breadcrumbs + Custom Content */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm">
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Home className="h-4 w-4" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                {crumb.href ? (
                  <Link 
                    href={crumb.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors truncate max-w-[150px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium truncate max-w-[200px]">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Custom content */}
          {children && (
            <>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-2">
                {children}
              </div>
            </>
          )}
        </div>

        {/* Right: Quality + Persona + Actions */}
        <div className="flex items-center gap-3">
          {/* Data Quality Badge */}
          {dataQuality && (
            <DataQualityBadge 
              score={dataQuality.score}
              grade={dataQuality.grade}
            />
          )}

          {/* Persona Toggle */}
          <PersonaToggle />

          {/* Quick Actions Menu */}
          {quickActions.length > 0 && (
            <QuickActionsMenu actions={quickActions} />
          )}
        </div>
      </div>
    </div>
  );
}

// Data Quality Badge Component
function DataQualityBadge({ 
  score, 
  grade 
}: { 
  score: number; 
  grade: 'A' | 'B' | 'C' | 'D' | 'F' 
}) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'F': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        "text-xs font-semibold border px-2 py-1",
        getGradeColor(grade)
      )}
      title={`Data Quality Score: ${score}/100`}
    >
      Quality: {grade}
    </Badge>
  );
}

// Quick Actions Menu Component
function QuickActionsMenu({ 
  actions 
}: { 
  actions: Array<{ label: string; icon?: React.ReactNode; onClick: () => void }> 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            className="flex items-center gap-2 cursor-pointer"
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Standalone Data Quality Indicator
export function DataQualityIndicator({ 
  score, 
  grade 
}: { 
  score: number; 
  grade: 'A' | 'B' | 'C' | 'D' | 'F' 
}) {
  return <DataQualityBadge score={score} grade={grade} />;
}

