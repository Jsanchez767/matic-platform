import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  BookOpen,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navItems = [
    { icon: Home, label: 'Overview', active: false },
    { icon: BookOpen, label: 'School Info', active: false },
    { icon: DollarSign, label: 'FY26 Plan & Budget', active: false },
    { icon: FileText, label: 'FY26 Service Plan', active: false },
    { icon: ClipboardList, label: 'CSI GIP', active: false },
    { icon: Calendar, label: 'Activities / Events', active: true },
    { icon: Users, label: 'Group Interventions', active: false },
    { icon: Users, label: 'Participants & Staff', active: false },
    { icon: BarChart3, label: 'Reports', active: false },
    { icon: FileText, label: 'APR Reports', active: false },
    { icon: Settings, label: 'Utilities', active: false },
    { icon: HelpCircle, label: 'Help Center', active: false }
  ];

  return (
    <aside
      className={cn(
        'bg-[#1e3a5f] text-white transition-all duration-300 flex flex-col',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-blue-800/50 flex items-center justify-between">
        {isOpen && (
          <div>
            <div className="text-sm opacity-80">BPNC</div>
            <p className="text-xs opacity-60 mt-1">Chicago Public Schools</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-white hover:bg-blue-800/50 ml-auto"
        >
          <ChevronLeft className={cn('h-5 w-5 transition-transform', !isOpen && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <a
                  href="#"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    item.active
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-800/50'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="text-sm">{item.label}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-blue-800/50">
          <div className="text-xs text-blue-200">
            <p>FY 2025-26</p>
            <p className="opacity-60 mt-1">Version 2.4.1</p>
          </div>
        </div>
      )}
    </aside>
  );
}
