'use client'
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, StopCircle, Clock as ClockIcon, Monitor, Camera } from 'lucide-react';

interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in seconds
  screenshots: string[]; // Base64 data URLs
}

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  projectId: string;
}

export default function TimeTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [screenshotInterval, setScreenshotInterval] = useState<number>(5); // minutes
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch projects and tasks (mock data for example)
  useEffect(() => {
    const mockProjects: Project[] = [
      { id: '1', name: 'Website Redesign' },
      { id: '2', name: 'Mobile App Development' },
      { id: '3', name: 'Marketing Campaign' },
    ];

    const mockTasks: Task[] = [
      { id: '1', name: 'Design Homepage', projectId: '1' },
      { id: '2', name: 'Develop API', projectId: '2' },
      { id: '3', name: 'Create Social Media Posts', projectId: '3' },
    ];

    setProjects(mockProjects);
    setTasks(mockTasks);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isTracking && !isTestMode && isScreenSharing) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      startScreenshotCapture();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }
    };
  }, [isTracking, isTestMode, isScreenSharing]);

  // Cleanup screen stream when component unmounts
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenStream]);

  const startScreenCapture = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Request screen sharing permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 1, max: 5 } // Low frame rate since we're taking periodic screenshots
        },
        audio: false
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      // Set up video element to receive the stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsScreenSharing(false);
        setIsTracking(false);
        setScreenStream(null);
        setError('Screen sharing was stopped');
      });

      setSuccess('Screen sharing started! You can now begin time tracking.');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error starting screen capture:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Screen sharing permission denied. Please allow screen sharing to use this feature.');
        } else if (err.name === 'NotSupportedError') {
          setError('Screen sharing is not supported in this browser.');
        } else {
          setError('Failed to start screen sharing: ' + err.message);
        }
      } else {
        setError('Failed to start screen sharing');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopScreenCapture = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    if (isTracking) {
      stopTimer();
    }
  };

  const startScreenshotCapture = () => {
    captureScreenshot();
    screenshotIntervalRef.current = setInterval(() => {
      captureScreenshot();
    }, screenshotInterval * 60 * 1000);
  };

  const captureScreenshot = async () => {
    if (!screenStream || !videoRef.current || !canvasRef.current) {
      setError('Screen capture not available');
      return;
    }

    try {
      setUploadProgress(0);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setUploadProgress(50);

      // Add watermark if in test mode
      if (isTestMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 250, canvas.height - 40, 240, 30);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('TEST SCREENSHOT - ' + new Date().toLocaleTimeString(), canvas.width - 240, canvas.height - 20);
      }

      // Convert to data URL
      const screenshotUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      setScreenshots(prev => [...prev, screenshotUrl]);
      setUploadProgress(100);

      if (activeTimer) {
        setActiveTimer(prev => ({
          ...prev!,
          screenshots: [...prev!.screenshots, screenshotUrl]
        }));
      }

      if (isTestMode) {
        setSuccess('Test screenshot captured successfully!');
        setTimeout(() => setSuccess(''), 5000);
      }

      setTimeout(() => setUploadProgress(null), 2000);

    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture screenshot');
      setTimeout(() => setError(''), 5000);
      setUploadProgress(null);
    }
  };

  const startTimer = () => {
    if (!selectedProject || !selectedTask) {
      setError('Please select both project and task');
      return;
    }

    if (!isScreenSharing) {
      setError('Please start screen sharing first');
      return;
    }

    setError('');
    const newTimer: TimeEntry = {
      id: Date.now().toString(),
      projectId: selectedProject,
      taskId: selectedTask,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      screenshots: [],
    };

    setActiveTimer(newTimer);
    setIsTracking(true);
    setElapsedTime(0);
    setScreenshots([]);
  };

  const pauseTimer = () => {
    setIsTracking(false);
  };

  const stopTimer = async () => {
    setIsTracking(false);
    setIsLoading(true);

    try {
      const completedTimer: TimeEntry = {
        ...activeTimer!,
        endTime: new Date(),
        duration: elapsedTime,
        screenshots,
      };

      console.log('Time entry saved:', completedTimer);
      
      setSuccess('Time entry saved successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      setActiveTimer(null);
      setElapsedTime(0);
      setScreenshots([]);
      setSelectedProject('');
      setSelectedTask('');
    } catch (err) {
      setError('Failed to save time entry');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTasks = tasks.filter(task => task.projectId === selectedProject);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Hidden video and canvas elements for screen capture */}
      <video 
        ref={videoRef} 
        style={{ display: 'none' }} 
        autoPlay 
        muted 
      />
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }} 
      />
      
      <h2 className="text-xl font-semibold mb-6">Time Tracker</h2>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Screen Sharing Controls */}
      <div className="mb-6 p-4 bg-purple-50 rounded-md border border-purple-100">
        <h3 className="font-medium text-purple-800 mb-2 flex items-center">
          <Monitor className="w-4 h-4 mr-2" />
          Screen Capture
        </h3>
        
        {!isScreenSharing ? (
          <div className="space-y-3">
            <p className="text-sm text-purple-700">
              Start screen sharing to enable automatic screenshot capture during time tracking.
            </p>
            <button
              onClick={startScreenCapture}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300 flex items-center"
            >
              <Monitor className="w-4 h-4 mr-2" />
              {isLoading ? 'Starting...' : 'Start Screen Sharing'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Screen sharing active - capturing entire screen/window
            </div>
            <button
              onClick={stopScreenCapture}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Screen Sharing
            </button>
          </div>
        )}
      </div>

      {/* Test Mode Controls */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
        <label className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            checked={isTestMode}
            onChange={(e) => setIsTestMode(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="font-medium">Test Mode</span>
        </label>
        
        {isTestMode && (
          <div className="space-y-3">
            <p className="text-sm text-blue-700">
              In test mode, timer functionality is disabled. Test screenshot capture with screen sharing.
            </p>
            <button
              onClick={captureScreenshot}
              disabled={uploadProgress !== null || !isScreenSharing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploadProgress !== null ? `Processing... ${uploadProgress}%` : 'Capture Test Screenshot'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isTracking || isTestMode}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isTracking || !selectedProject || isTestMode}
            >
              <option value="">Select a task</option>
              {filteredTasks.map(task => (
                <option key={task.id} value={task.id}>{task.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-mono font-bold">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>Auto-screenshots every {screenshotInterval} min</span>
            </div>
            {isScreenSharing && (
              <div className="flex items-center text-sm text-green-600">
                <Monitor className="w-4 h-4 mr-1" />
                <span>Screen recording active</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            {!isTracking ? (
              <button
                onClick={startTimer}
                disabled={!selectedProject || !selectedTask || isTestMode || !isScreenSharing}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </button>
            ) : (
              <>
                <button
                  onClick={pauseTimer}
                  className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </button>
                <button
                  onClick={stopTimer}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={isLoading}
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Stop'}
                </button>
              </>
            )}
          </div>
        </div>

        {!isScreenSharing && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <Monitor className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">Screen sharing required</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              You need to start screen sharing before you can begin time tracking with automatic screenshots.
            </p>
          </div>
        )}

        {screenshots.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              {isTestMode ? 'Test Screenshots' : 'Activity Screenshots'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {screenshots.map((url, index) => (
                <div key={index} className="border rounded-md overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Screenshot ${index + 1}`} 
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '150px' }}
                  />
                  <div className="p-1 text-xs text-center text-gray-500">
                    {new Date(Date.now() - (screenshots.length - index - 1) * screenshotInterval * 60000).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot Interval (minutes)</label>
          <select
            value={screenshotInterval}
            onChange={(e) => setScreenshotInterval(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md"
            disabled={isTracking}
          >
            <option value="1">1 minute</option>
            <option value="2">2 minutes</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-800 mb-1">Privacy Notice</h3>
          <p className="text-sm text-blue-700">
            This feature captures your entire screen or selected window/application. 
            You have full control over what is shared and can stop sharing at any time.
            {isTestMode && ' Test screenshots include a visible watermark.'}
          </p>
        </div>

        {/* Technical Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-800 mb-1">How it works</h3>
          <p className="text-sm text-gray-600">
            Uses the Screen Capture API to record your screen and automatically takes screenshots at set intervals. 
            You can choose to share your entire screen, a specific window, or a browser tab.
          </p>
        </div>
      </div>
    </div>
  );
}