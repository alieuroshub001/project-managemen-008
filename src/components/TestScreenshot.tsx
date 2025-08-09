'use client'
import { useState } from 'react';
import html2canvas from 'html2canvas';

export default function TestScreenshot() {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const captureAndUpload = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Step 1: Capture screenshot
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        scale: 0.5, // Reduce size for performance
      });
      
      // Step 2: Convert to Blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.7);
      });

      if (!blob) throw new Error('Failed to create blob from canvas');

      // Step 3: Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', blob, `screenshot_${Date.now()}.jpg`);
      formData.append('upload_preset', 'project-management-007'); // Replace with your preset
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);

      // Step 4: Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setScreenshotUrl(data.secure_url);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture screenshot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Screenshot Test</h1>
      
      <button
        onClick={captureAndUpload}
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isLoading ? 'Capturing...' : 'Capture Screenshot'}
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {screenshotUrl && (
        <div className="mt-4">
          <h2 className="font-medium mb-2">Captured Screenshot:</h2>
          <img 
            src={screenshotUrl} 
            alt="Captured screenshot" 
            className="border rounded-md max-w-full"
          />
          <div className="mt-2 text-sm text-gray-600">
            <p>URL: <span className="break-all">{screenshotUrl}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}