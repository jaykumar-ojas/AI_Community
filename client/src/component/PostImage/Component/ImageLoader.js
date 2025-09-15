import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Sparkles, Zap, Cpu, Clock, Camera } from 'lucide-react';


const ImageLoader = forwardRef(
  ({ aspectRatio = "1:1", onComplete, isVisible = false, model, onProgress, onStageChange }, ref) => {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('initializing');
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const stages = [
      { name: 'initializing', label: 'Initializing Ultra HD AI...', icon: Cpu, color: 'text-blue-400' },
      { name: 'analyzing', label: 'Analyzing composition...', icon: Camera, color: 'text-cyan-400' },
      { name: 'processing', label: 'Processing prompt...', icon: Zap, color: 'text-yellow-400' },
      { name: 'generating', label: 'Generating ultra HD...', icon: Sparkles, color: 'text-purple-400' },
      { name: 'enhancing', label: 'Enhancing details...', icon: Sparkles, color: 'text-pink-400' },
      { name: 'finalizing', label: 'Finalizing quality output...', icon: Clock, color: 'text-green-400' },
    ];

useEffect(() => {
  if (!isVisible || isComplete) {
    setProgress(0);
    setIsComplete(false);
    setStage("initializing");
    setTimeElapsed(0);
    return;
  }

  const startTime = Date.now();

  let frameId;
  const tick = () => {
    const elapsed = Date.now() - startTime;
    setTimeElapsed(Math.floor(elapsed / 1000));

    // Smooth exponential curve
    const progressValue = Math.min(95, 100 * (1 - Math.exp(-elapsed / 10000)));
    setProgress(progressValue);
    if (onProgress) onProgress(progressValue);

    // Stage mapping
    let newStage;
    if (elapsed < 3000) newStage = "initializing";
    else if (elapsed < 8000) newStage = "analyzing";
    else if (elapsed < 15000) newStage = "processing";
    else if (elapsed < 25000) newStage = "generating";
    else if (elapsed < 35000) newStage = "enhancing";
    else newStage = "finalizing";

    if (newStage !== stage) {
      setStage(newStage);
      if (onStageChange) onStageChange(newStage);
    }

    // Keep looping until complete
    if (!isComplete) {
      frameId = requestAnimationFrame(tick);
    }
  };

  frameId = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frameId);
}, [isVisible]);


    useImperativeHandle(ref, () => ({
      completeGeneration: () => {
        setProgress(100);
        setIsComplete(true);
        if (onComplete) onComplete();
      },
    }));


  const getRatioClasses = () => {
    switch (aspectRatio) {
      case '1:1': return 'w-80 h-80'; // Square
      case '3:4': return 'w-64 h-80'; // Portrait
      case '4:3': return 'w-80 h-60'; // Landscape
      case '16:9': return 'w-96 h-54'; // Widescreen
      case '9:16': return 'w-54 h-96'; // Vertical/Stories
      case '2:3': return 'w-64 h-96'; // Tall Portrait
      case '21:9': return 'w-[420px] h-[180px]'; // Ultra-wide
      default: return 'w-80 h-80';
    }
  };

  const getResolution = () => {
    switch (aspectRatio) {
      case '1:1': return '2048×2048';
      case '3:4': return '1536×2048';
      case '4:3': return '2048×1536';
      case '16:9': return '2048×1152';
      case '9:16': return '1152×2048';
      case '2:3': return '1365×2048';
      case '21:9': return '2048×878';
      default: return '2048×2048';
    }
  };

  if (!isVisible) return null;

  const currentStage = stages.find(s => s.name === stage);
  const StageIcon = currentStage?.icon || Sparkles;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
        {/* Main loader container */}
        <div className={`${getRatioClasses()} relative flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900`}>
          
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] animate-spin" style={{ animationDuration: '12s' }}></div>
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(59,130,246,0.1),transparent)] animate-spin" style={{ animationDuration: '8s' }}></div>
          </div>

          {/* Scanning line */}
          <div 
            className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80 transition-transform duration-200"
            style={{ transform: `translateY(${(progress / 100) * 300}px)` }}
          ></div>
          <div 
            className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60 transition-transform duration-300"
            style={{ transform: `translateY(${(progress / 100) * 300}px)`, transitionDelay: '100ms' }}
          ></div>

          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{ 
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          {/* Central content */}
          <div className="text-center z-10">
            <div className="relative mb-4">
              {/* Rotating rings */}
              <div className="w-20 h-20 border-2 border-gray-600 rounded-full animate-spin mx-auto" style={{ animationDuration: '4s' }}>
                <div className="w-full h-full border-t-2 border-blue-400 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-2 border border-purple-400/50 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
              </div>
              
              {/* Stage icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <StageIcon className={`w-7 h-7 ${currentStage?.color} animate-pulse`} />
              </div>
            </div>
            
            {/* Progress percentage */}
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(progress)}%
            </div>
            
            {/* Ultra HD indicator */}
            <div className="text-xs text-purple-400 font-semibold mb-2">
              ULTRA HD • {getResolution()}
            </div>
            
            {/* Time remaining */}
            <div className="text-sm text-gray-400 mb-2">
                {isComplete ? 'Generation Complete!' : `${timeElapsed}s elapsed`}
            </div>
          </div>

          {/* Corner effects */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`absolute w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-70 animate-ping`}
              style={{
                top: i < 3 ? '8px' : 'auto',
                bottom: i >= 3 ? '8px' : 'auto',
                left: i % 3 === 0 ? '8px' : i % 3 === 1 ? '50%' : 'auto',
                right: i % 3 === 2 ? '8px' : 'auto',
                transform: i % 3 === 1 ? 'translateX(-50%)' : 'none',
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2.5s'
              }}
            ></div>
          ))}
        </div>

        {/* Status bar */}
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <StageIcon className={`w-4 h-4 ${currentStage?.color}`} />
              <span className="text-sm text-gray-300">{currentStage?.label}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{aspectRatio} RATIO</div>
              <div className="text-xs text-purple-400 font-semibold">{getResolution()}</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-yellow-400 transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* Quality indicators */}
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className="text-gray-500">Quality: Ultra high</span>
            <span className="text-gray-500">Model: {model}</span>
          </div>
        </div>

        {/* Completion overlay */}
        {isComplete && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="text-white font-bold text-lg">Ultra HD Generated!</div>
              <div className="text-green-200 text-sm">{getResolution()} • {aspectRatio} Ratio</div>
            </div>
          </div>
        )}
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
});
ImageLoader.displayName = 'ImageLoader';

export default ImageLoader;