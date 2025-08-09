'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
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

export default function ChannelList({ role }: { role: UserRole }) {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      <div className="p-4 bg-red-100 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Channels</h2>
        {(role === 'superadmin' || role === 'admin' || role === 'hr') && (
          <Link 
            href="/dashboard/communication/new"
            className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
            title="Create new channel"
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

      <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No channels found
          </div>
        ) : (
          filteredChannels.map((channel) => (
            <Link
              key={channel._id}
              href={`/dashboard/communication/${channel._id}`}
              className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center">
                  {channel.isPrivate && <Lock className="w-4 h-4 mr-2 text-gray-500" />}
                  {channel.name}
                </h3>
                <span className="text-xs text-gray-500">
                  {new Date(channel.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {channel.description && (
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Users className="w-3 h-3 mr-1" />
                <span>{channel.members.length} members</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}