// components/Communication/MediaViewerModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { X, Download, Search, Filter, Image, Video, Music, FileText, Calendar } from 'lucide-react';

interface MediaFile {
  _id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
  type: 'image' | 'video' | 'audio' | 'document';
  resource_type: string;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
}

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

export default function MediaViewerModal({
  isOpen,
  onClose,
  channelId
}: MediaViewerModalProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/communication/${channelId}/media`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch media files');
      
      setMediaFiles(data.data);
      setFilteredFiles(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && channelId) {
      fetchMediaFiles();
    }
  }, [isOpen, channelId]);

  useEffect(() => {
    let filtered = mediaFiles;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(file => file.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFiles(filtered);
  }, [mediaFiles, filterType, searchTerm]);

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const renderFilePreview = (file: MediaFile) => {
    if (file.type === 'image') {
      return (
        <div 
          className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
          onClick={() => setSelectedImage(file.secure_url)}
        >
          <img 
            src={file.secure_url} 
            alt={file.original_filename}
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else if (file.type === 'video') {
      return (
        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
          <video 
            src={file.secure_url}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
        </div>
      );
    } else {
      return (
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          {getFileIcon(file.type)}
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Channel Media</h2>
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
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Files</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No media files found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredFiles.map((file) => (
                      <div key={file._id} className="group">
                        {renderFilePreview(file)}
                        
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {file.original_filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.bytes)} • {file.format.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400">
                            by {file.sender.name}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => downloadFile(file.secure_url, file.original_filename)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-indigo-600"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}