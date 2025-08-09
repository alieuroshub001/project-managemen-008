// components/Communication/ChannelView.tsx - Updated with file upload functionality
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Send, Paperclip, ChevronLeft, Settings, Image, Video, Music, FileText, Download, Images } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/types';
import FileUpload, { UploadedFile } from './FileUploadDropdown';
import ChannelManagementModal from './ChannelManagementModal';
import MediaViewerModal from './MediaViewerModal';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  attachments?: any[];
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
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showManagement, setShowManagement] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);

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
    if (!messageInput.trim() && uploadedFiles.length === 0) return;

    try {
      const response = await fetch(`/api/communication/${channelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageInput,
          attachments: uploadedFiles
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to send message');
      
      setMessages(prev => [...prev, data.data]);
      setMessageInput('');
      setUploadedFiles([]);
      setShowFileUpload(false);
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

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

const downloadFile = async (url: string, filename: string) => {
  try {
    // For Cloudinary URLs, we need to handle them differently
    // Cloudinary serves files directly, so we can use them as-is
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank'; // Open in new tab as fallback
    link.rel = 'noopener noreferrer';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Download failed:', error);
    
    // Fallback: open in new window
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (fallbackError) {
      console.error('Fallback download failed:', fallbackError);
      alert('Download failed. Please try right-clicking the link and selecting "Save as..."');
    }
  }
};

  const renderAttachment = (attachment: any) => {
    if (attachment.type === 'image') {
      return (
        <div className="mt-2 max-w-xs">
          <img 
            src={attachment.secure_url} 
            alt={attachment.original_filename}
            className="rounded-lg max-h-48 object-cover cursor-pointer"
            onClick={() => window.open(attachment.secure_url, '_blank')}
          />
        </div>
      );
    } else if (attachment.type === 'video') {
      return (
        <div className="mt-2 max-w-xs">
          <video 
            src={attachment.secure_url}
            controls
            className="rounded-lg max-h-48"
          />
        </div>
      );
    } else {
      return (
        <div className="mt-2 p-2 bg-white bg-opacity-20 rounded border border-gray-200 max-w-xs">
          <div className="flex items-center space-x-2">
            {getFileIcon(attachment.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {attachment.original_filename}
              </p>
              <p className="text-xs opacity-75">
                {formatFileSize(attachment.bytes)} • {attachment.format?.toUpperCase()}
              </p>
            </div>
            <button
              onClick={() => downloadFile(attachment.secure_url, attachment.original_filename)}
              className="p-1 hover:bg-gray-200 hover:bg-opacity-30 rounded"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
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
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowMediaViewer(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="View media"
          >
            <Images className="w-5 h-5" />
          </button>
          {(role === 'superadmin' || role === 'admin' || role === 'hr' || channel.createdBy._id === session?.user.id) && (
            <button 
              onClick={() => setShowManagement(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Manage channel"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
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
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                message.sender._id === session?.user.id 
                  ? 'bg-indigo-100 text-indigo-900' 
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.sender._id !== session?.user.id && (
                <div className="font-medium text-sm mb-1">
                  {message.sender.name}
                </div>
              )}
              {message.content && (
                <div className="text-sm">{message.content}</div>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={index}>
                      {renderAttachment(attachment)}
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
        {/* File Upload Area */}
        {showFileUpload && (
          <div className="mb-4">
            <FileUpload 
              onFilesUploaded={handleFilesUploaded}
              maxFiles={5}
              disabled={false}
            />
          </div>
        )}

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Ready to send:</h4>
            {uploadedFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.original_filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.bytes)} • {file.format.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeUploadedFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`p-2 rounded transition-colors ${
              showFileUpload 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Attach files"
          >
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
            disabled={!messageInput.trim() && uploadedFiles.length === 0}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Channel Management Modal */}
      {showManagement && channel && (
        <ChannelManagementModal
          isOpen={showManagement}
          onClose={() => setShowManagement(false)}
          channel={channel}
          currentUserId={session?.user.id || ''}
          onChannelUpdated={() => {
            // Refresh channel data
            window.location.reload();
          }}
        />
      )}

      {/* Media Viewer Modal */}
      {showMediaViewer && (
        <MediaViewerModal
          isOpen={showMediaViewer}
          onClose={() => setShowMediaViewer(false)}
          channelId={channelId}
        />
      )}
    </div>
  );
}