// components/Communication/MobileChannelSelector.tsx
'use client';
import { useState } from 'react';
import { Menu, X, MessageSquare } from 'lucide-react';
import ChannelList from './ChannelList';
import { UserRole } from '@/types';

interface MobileChannelSelectorProps {
  role: UserRole;
  currentChannelId?: string;
}

export default function MobileChannelSelector({ 
  role, 
  currentChannelId 
}: MobileChannelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-gray-300 rounded-lg shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Channels</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-hidden">
              <div className="p-4 h-full">
                <ChannelList 
                  role={role} 
                  onChannelSelect={() => setIsOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}