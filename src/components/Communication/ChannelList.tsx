// components/Communication/ChannelList.tsx - Updated with mobile support
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, Lock, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';

interface Channel {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  updatedAt: string;
}

interface ChannelListProps {
  role: UserRole;
  onChannelSelect?: () => void; // Callback for mobile
}

export default function ChannelList({ role, onChannelSelect }: ChannelListProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const currentChannelId = pathname.split('/').pop();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/communication');
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to fetch channels');
        
        setChannels(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch channels');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchChannels();
    }
  }, [session]);

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <span>Channels</span>
        </h2>
        {(role === 'superadmin' || role === 'admin' || role === 'hr') && (
          <Link 
            href="/dashboard/communication/new"
            className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
            title="Create new channel"
            onClick={onChannelSelect}
          >
            <Plus className="w-5 h-5" />
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search channels..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-8">
            {searchTerm ? (
              <div>
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No channels found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No channels yet</p>
                {(role === 'superadmin' || role === 'admin' || role === 'hr') && (
                  <Link 
                    href="/dashboard/communication/new"
                    className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-800"
                    onClick={onChannelSelect}
                  >
                    Create your first channel
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          filteredChannels.map((channel) => (
            <Link
              key={channel._id}
              href={`/dashboard/communication/${channel._id}`}
              onClick={onChannelSelect}
              className={`block p-3 rounded-lg transition-colors border ${
                currentChannelId === channel._id
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center">
                  {channel.isPrivate && <Lock className="w-4 h-4 mr-2 text-gray-500" />}
                  <span className="truncate">{channel.name}</span>
                </h3>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {new Date(channel.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {channel.description && (
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="w-3 h-3 mr-1" />
                  <span>{channel.members.length} members</span>
                </div>
                {currentChannelId === channel._id && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Channel stats */}
      {channels.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {channels.length} channel{channels.length !== 1 ? 's' : ''} total
            {searchTerm && ` • ${filteredChannels.length} filtered`}
          </div>
        </div>
      )}
    </div>
  );
}