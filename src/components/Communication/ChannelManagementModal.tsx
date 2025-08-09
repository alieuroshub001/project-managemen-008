// components/Communication/ChannelManagementModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, Search } from 'lucide-react';
import { UserRole } from '@/types';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface ChannelMember extends User {
  isCreator: boolean;
}

interface ChannelManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: {
    _id: string;
    name: string;
    description?: string;
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
  };
  currentUserId: string;
  onChannelUpdated: () => void;
}

export default function ChannelManagementModal({
  isOpen,
  onClose,
  channel,
  currentUserId,
  onChannelUpdated
}: ChannelManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCreator = channel.createdBy._id === currentUserId;

  const channelMembers: ChannelMember[] = channel.members.map(member => ({
    ...member,
    role: 'employee' as UserRole, // You might want to fetch this from the actual user data
    isCreator: member._id === channel.createdBy._id
  }));

  const fetchAvailableUsers = async () => {
    if (!isCreator) return;

    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/users');
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
      
      // Filter out users who are already members
      const memberIds = channel.members.map(m => m._id);
      const filteredUsers = data.data.filter((user: User) => 
        !memberIds.includes(user._id) && 
        (searchTerm === '' || 
         user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setAvailableUsers(filteredUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'add' && isCreator) {
      fetchAvailableUsers();
    }
  }, [activeTab, searchTerm, isCreator]);

  const addMember = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/communication', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channel._id,
          membersToAdd: [userId]
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to add member');
      
      onChannelUpdated();
      setActiveTab('members');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (userId === channel.createdBy._id) {
      setError('Cannot remove channel creator');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/communication', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channel._id,
          membersToRemove: [userId]
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to remove member');
      
      onChannelUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Channel</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">{channel.name}</h3>
            {channel.description && (
              <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex mb-4 border-b">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'members'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Members ({channel.members.length})
            </button>
            {isCreator && (
              <button
                onClick={() => setActiveTab('add')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'add'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-1" />
                Add Members
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="max-h-80 overflow-y-auto">
            {activeTab === 'members' && (
              <div className="space-y-2">
                {channelMembers.map((member) => (
                  <div 
                    key={member._id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{member.name}</span>
                        {member.isCreator && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Creator
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    {isCreator && !member.isCreator && (
                      <button
                        onClick={() => removeMember(member._id)}
                        disabled={loading}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'add' && isCreator && (
              <div>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        {searchTerm ? 'No users found' : 'All users are already members'}
                      </p>
                    ) : (
                      availableUsers.map((user) => (
                        <div 
                          key={user._id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{user.name}</div>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                              {user.role}
                            </span>
                          </div>
                          <button
                            onClick={() => addMember(user._id)}
                            disabled={loading}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}