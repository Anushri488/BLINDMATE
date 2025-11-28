import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Volume2, VolumeX, Play, Pause, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
  timestamp: number;
}

interface AppState {
  isDetecting: boolean;
  cameraActive: boolean;
  modelLoaded: boolean;
  speechEnabled: boolean;
  error: string | null;
  detections: Detection[];
  volume: number;
  sensitivity: number;
}

const DETECTION_CLASSES = {
  person: 'Person',
  chair: 'Chair',
  couch: 'Couch',
  'dining table': 'Table',
  door: 'Door',
  stairs: 'Stairs',
  car: 'Vehicle',
  bicycle: 'Bicycle',
  bottle: 'Bottle',
  cup: 'Cup',
  laptop: 'Laptop',
  'cell phone': 'Phone',
  book: 'Book',
  clock: 'Clock',
  'potted plant': 'Plant',
  bed: 'Bed',
  toilet: 'Toilet',
  tv: 'TV',
  microwave: 'Microwave',
  refrigerator: 'Refrigerator'
};

const POSITION_DESCRIPTIONS = {
  left: 'to your left',
  right: 'to your right',
  center: 'ahead of you',
  far_left: 'far to your left',
  far_right: 'far to your right'
};

export default function App() {
  const [state, setState] = useState<AppState>({
    isDetecting: false,
    cameraActive: false,
    modelLoaded: false,
    speechEnabled: true,
    error: null,
    detections: [],
    volume: 0.8,
    sensitivity: 0.5
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize TensorFlow.js and load model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setState(prev => ({ ...prev, error: null }));
        
        // Set TensorFlow.js backend
        await tf.setBackend('webgl');
        await tf.ready();
        
        // Load COCO-SSD model
        const model = await cocoSsd.load();
        modelRef.current = model;
        
        setState(prev => ({ ...prev, modelLoaded: true }));
      } catch (error) {
        console.error('Error loading model:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load AI model. Please refresh the page.' 
        }));
      }
    };

    loadModel();
  }, []);

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setState(prev => ({ ...prev, cameraActive: true }));
    } catch (error) {
      console.error('Error accessing camera:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Camera access denied. Please enable camera permissions.' 
      }));
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setState(prev => ({ ...prev, cameraActive: false }));
  }, []);

  // Get position description based on bbox
  const getPositionDescription = (bbox: [number, number, number, number]): string => {
    const [x, y, width, height] = bbox;
    const centerX = x + width / 2;
    const videoWidth = videoRef.current?.videoWidth || 640;
    
    const leftThird = videoWidth * 0.33;
    const rightThird = videoWidth * 0.67;
    
    if (centerX < leftThird * 0.5) return POSITION_DESCRIPTIONS.far_left;
    if (centerX < leftThird) return POSITION_DESCRIPTIONS.left;
    if (centerX > rightThird * 1.5) return POSITION_DESCRIPTIONS.far_right;
    if (centerX > rightThird) return POSITION_DESCRIPTIONS.right;
    return POSITION_DESCRIPTIONS.center;
  };

  // Speak detection
  const speakDetection = useCallback((detection: Detection) => {
    if (!state.speechEnabled) return;
    
    const now = Date.now();
    if (now - lastSpeechRef.current < 2000) return; // Prevent spam
    
    lastSpeechRef.current = now;
    
    const className = DETECTION_CLASSES[detection.class as keyof typeof DETECTION_CLASSES] || detection.class;
    const position = getPositionDescription(detection.bbox);
    const message = `${className} detected ${position}`;
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = state.volume;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    speechSynthesis.speak(utterance);
  }, [state.speechEnabled, state.volume]);

  // Perform object detection
  const detectObjects = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current) return;
    
    // Ensure video has valid dimensions before detection
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) return;
    
    try {
      const predictions = await modelRef.current.detect(videoRef.current);
      
      // Filter predictions based on sensitivity
      const filteredPredictions = predictions.filter(
        prediction => prediction.score >= state.sensitivity
      );
      
      const detections: Detection[] = filteredPredictions.map(prediction => ({
        class: prediction.class,
        score: prediction.score,
        bbox: prediction.bbox,
        timestamp: Date.now()
      }));
      
      setState(prev => ({ ...prev, detections }));
      
      // Draw detections on canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        detections.forEach(detection => {
          const [x, y, width, height] = detection.bbox;
          
          // Draw bounding box
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          
          // Draw label
          ctx.fillStyle = '#00ff00';
          ctx.font = '16px Arial';
          ctx.fillText(
            `${detection.class} (${Math.round(detection.score * 100)}%)`,
            x,
            y - 5
          );
        });
      }
      
      // Speak most confident detection
      if (detections.length > 0) {
        const mostConfident = detections.reduce((prev, current) => 
          prev.score > current.score ? prev : current
        );
        speakDetection(mostConfident);
      }
    } catch (error) {
      console.error('Detection error:', error);
    }
  }, [state.sensitivity, speakDetection]);

  // Start detection
  const startDetection = useCallback(() => {
    if (!state.cameraActive) {
      initCamera();
    }
    
    setState(prev => ({ ...prev, isDetecting: true }));
    
    detectionIntervalRef.current = setInterval(detectObjects, 500);
  }, [state.cameraActive, initCamera, detectObjects]);

  // Stop detection
  const stopDetection = useCallback(() => {
    setState(prev => ({ ...prev, isDetecting: false }));
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Toggle detection
  const toggleDetection = useCallback(() => {
    if (state.isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  }, [state.isDetecting, startDetection, stopDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopDetection();
    };
  }, [stopCamera, stopDetection]);

  // Update canvas size when video loads
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const updateCanvasSize = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };
      
      video.addEventListener('loadedmetadata', updateCanvasSize);
      return () => video.removeEventListener('loadedmetadata', updateCanvasSize);
    }
  }, [state.cameraActive]);

  const getStatusColor = () => {
    if (state.error) return 'text-red-400';
    if (state.isDetecting) return 'text-green-400';
    if (state.cameraActive) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (state.error) return 'Error';
    if (!state.modelLoaded) return 'Loading AI Model...';
    if (state.isDetecting) return 'Detecting Objects';
    if (state.cameraActive) return 'Camera Ready';
    return 'Offline';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">BlindMate</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              state.isDetecting ? 'bg-green-400' : 
              state.cameraActive ? 'bg-yellow-400' : 'bg-gray-600'
            }`} />
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {state.error && (
          <div className="bg-red-800 border border-red-600 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Video Preview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {!state.cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Main Control */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Detection Control</h2>
            
            <button
              onClick={toggleDetection}
              disabled={!state.modelLoaded}
              className={`w-full h-16 rounded-lg font-semibold text-lg transition-colors ${
                state.isDetecting 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } ${!state.modelLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={state.isDetecting ? 'Stop detection' : 'Start detection'}
            >
              <div className="flex items-center justify-center space-x-2">
                {!state.modelLoaded ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : state.isDetecting ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
                <span>
                  {!state.modelLoaded ? 'Loading...' : 
                   state.isDetecting ? 'Stop Detection' : 'Start Detection'}
                </span>
              </div>
            </button>
            
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => setState(prev => ({ ...prev, speechEnabled: !prev.speechEnabled }))}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  state.speechEnabled 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                aria-label="Toggle voice alerts"
              >
                <div className="flex items-center justify-center space-x-2">
                  {state.speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{state.speechEnabled ? 'Voice On' : 'Voice Off'}</span>
                </div>
              </button>
              
              <button
                onClick={state.cameraActive ? stopCamera : initCamera}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  state.cameraActive 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                aria-label="Toggle camera"
              >
                <div className="flex items-center justify-center space-x-2">
                  {state.cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  <span>{state.cameraActive ? 'Camera Off' : 'Camera On'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Voice Volume: {Math.round(state.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.volume}
                  onChange={(e) => setState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Detection Sensitivity: {Math.round(state.sensitivity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={state.sensitivity}
                  onChange={(e) => setState(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Detections */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Detections</h2>
          
          {state.detections.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No objects detected yet. Start detection to begin scanning.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.detections.map((detection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-medium">
                      {DETECTION_CLASSES[detection.class as keyof typeof DETECTION_CLASSES] || detection.class}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {Math.round(detection.score * 100)}% confidence
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
