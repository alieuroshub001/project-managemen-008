// components/Communication/FileUploadDropdown.tsx - Fixed version
'use client';
import { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, Music, FileText } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export interface UploadedFile {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
  type: 'image' | 'video' | 'audio' | 'document';
  resource_type: string;
}

export default function FileUpload({ 
  onFilesUploaded, 
  maxFiles = 5,
  disabled = false 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is 50MB.`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return `File ${file.name} is empty.`;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mpeg',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 
      'application/zip', 
      'application/x-rar-compressed'
    ];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isAllowedType = allowedTypes.includes(file.type) || 
      (file.type === 'application/octet-stream' && fileExtension && 
       ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar'].includes(fileExtension));

    if (!isAllowedType) {
      return `File type ${file.type} for ${file.name} is not supported.`;
    }

    return null;
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    const fileArray = Array.from(files);
    if (fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files first
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      if (validFiles.length === 0) return;
    }

    setUploading(true);
    setUploadProgress({});

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Upload was not successful');
      }

      const newFiles = data.data as UploadedFile[];
      onFilesUploaded(newFiles);

      // Show success message if there were partial failures
      if (data.message.includes('failed')) {
        alert(data.message);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };



  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        {uploading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-sm text-gray-600">Uploading files...</span>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max {maxFiles} files, 50MB each
            </p>
            <p className="text-xs text-gray-400">
              Supported: Images, Videos, Audio, PDF, Office docs, Text, Archives
            </p>
          </div>
        )}
      </div>
    </div>
  );
}