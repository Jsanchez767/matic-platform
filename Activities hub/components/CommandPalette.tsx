import { useState } from 'react';
import { Search, Calendar, Users, FileText, Settings, Plus, TrendingUp, Archive, X } from 'lucide-react';
import { Input } from './ui/input';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  if (!open) return null;

  const actions = [
    { icon: Plus, label: 'Create new activity', category: 'Actions', shortcut: 'N' },
    { icon: Calendar, label: 'View calendar', category: 'Navigate', shortcut: 'C' },
    { icon: Users, label: 'Manage participants', category: 'Navigate', shortcut: 'P' },
    { icon: FileText, label: 'Generate report', category: 'Actions', shortcut: 'R' },
    { icon: TrendingUp, label: 'View analytics', category: 'Navigate', shortcut: 'A' },
    { icon: Archive, label: 'View archived', category: 'Navigate', shortcut: 'V' },
    { icon: Settings, label: 'Settings', category: 'Navigate', shortcut: 'S' },
  ];

  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 h-12 text-base border-0 focus-visible:ring-0 bg-gray-50"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filteredActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white flex items-center justify-center">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.category}</div>
                    </div>
                    <kbd className="px-2 py-1 text-xs bg-gray-100 group-hover:bg-gray-200 rounded border border-gray-300 text-gray-600">
                      {action.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↵</kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
