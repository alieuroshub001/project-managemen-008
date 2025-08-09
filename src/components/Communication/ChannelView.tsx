'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Send, Paperclip, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/types';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  attachments?: string[];
}

interface ChannelDetails {
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
}

export default function ChannelView({ 
  channelId,
  role 
}: { 
  channelId: string;
  role: UserRole;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [channel, setChannel] = useState<ChannelDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/communication/${channelId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to fetch channel');
        
        setChannel(data.data.channel);
        setMessages(data.data.messages);
        setHasMore(data.data.total > data.data.messages.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch channel');
      } finally {
        setLoading(false);
      }
    };

    if (channelId && session?.user) {
      fetchChannelData();
    }
  }, [channelId, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setIsScrolled(scrollTop > 0);

    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasMore && !loading) {
      loadMoreMessages();
    }
  };

  const loadMoreMessages = async () => {
    try {
      setLoading(true);
      const nextPage = page + 1;
      const response = await fetch(`/api/communication/${channelId}?page=${nextPage}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch messages');
      
      setMessages(prev => [...data.data.messages.reverse(), ...prev]);
      setPage(nextPage);
      setHasMore(data.data.total > data.data.messages.length + messages.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      const response = await fetch(`/api/communication/${channelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageInput
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to send message');
      
      setMessages(prev => [...prev, data.data]);
      setMessageInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading && messages.length === 0) {
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

  if (!channel) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-700 rounded">
        Channel not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/communication" className="md:hidden">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-semibold">{channel.name}</h2>
            <p className="text-sm text-gray-500">
              {channel.members.length} members
            </p>
          </div>
        </div>
        {(role === 'superadmin' || role === 'admin' || role === 'hr') && (
          <button className="text-sm text-indigo-600 hover:text-indigo-800">
            Manage Channel
          </button>
        )}
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {loading && isScrolled && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {messages.map((message) => (
          <div 
            key={message._id} 
            className={`flex ${message.sender._id === session?.user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${message.sender._id === session?.user.id ? 'bg-indigo-100 text-indigo-900' : 'bg-gray-100 text-gray-900'}`}
            >
              {message.sender._id !== session?.user.id && (
                <div className="font-medium text-sm mb-1">
                  {message.sender.name}
                </div>
              )}
              <div className="text-sm">{message.content}</div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="border rounded p-2">
                      <a 
                        href={attachment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Attachment {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1 text-right">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              placeholder="Type a message..."
              className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={1}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button 
            onClick={sendMessage}
            disabled={!messageInput.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}