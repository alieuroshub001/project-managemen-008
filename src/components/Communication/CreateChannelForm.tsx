'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import { X, Lock } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function CreateChannelForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/superadmin/users');
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
      
      // Filter out current user and already selected users
      const filteredUsers = data.data.filter((user: User) => 
        user._id !== session?.user.id && !selectedUsers.includes(user._id)
      );
      
      setAvailableUsers(filteredUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchUsers();
  };

  const addUser = (userId: string) => {
    setSelectedUsers(prev => [...prev, userId]);
    setAvailableUsers(prev => prev.filter(user => user._id !== userId));
    setSearchTerm('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
    const userToAddBack = availableUsers.find(user => user._id === userId);
    if (userToAddBack) {
      setAvailableUsers(prev => [...prev, userToAddBack]);
    }
  };

  const createChannel = async () => {
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/communication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          isPrivate,
          members: selectedUsers
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to create channel');
      
      router.push(`/dashboard/communication/${data.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Create New Channel</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Channel Name *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="private"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <label htmlFor="private" className="ml-2 block text-sm text-gray-700 flex items-center">
            <Lock className="w-4 h-4 mr-1" />
            Private Channel
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add Members
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedUsers.map(userId => {
              const user = availableUsers.find(u => u._id === userId) || 
                { _id: userId, name: 'Loading...', email: '' };
              return (
                <div 
                  key={userId} 
                  className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                >
                  <span>{user.name}</span>
                  <button 
                    onClick={() => removeUser(userId)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
          
          <form onSubmit={handleSearch} className="flex space-x-2">
            <input
              type="text"
              placeholder="Search users..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          {availableUsers.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
              {availableUsers.map(user => (
                <div 
                  key={user._id} 
                  className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => addUser(user._id)}
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            onClick={createChannel}
            disabled={loading || !name.trim()}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </div>
    </div>
  );
}