import React, { useState, useEffect } from 'react';

const OrderTimer = ({ startTime, duration, onComplete, orderId, isMobile = false }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 1000);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const elapsed = Date.now() - startTime;
    const initialTimeLeft = Math.max(0, duration * 1000 - elapsed);
    const initialProgress = Math.min(100, (elapsed / (duration * 1000)) * 100);
    
    setTimeLeft(initialTimeLeft);
    setProgress(initialProgress);

    const interval = setInterval(() => {
      const newElapsed = Date.now() - startTime;
      const newTimeLeft = Math.max(0, duration * 1000 - newElapsed);
      const newProgress = Math.min(100, (newElapsed / (duration * 1000)) * 100);
      
      setTimeLeft(newTimeLeft);
      setProgress(newProgress);

      if (newTimeLeft <= 0) {
        clearInterval(interval);
        onComplete(orderId);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, duration, orderId, onComplete]);

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const getProgressColor = () => {
    if (progress < 50) return 'bg-green-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm sm:text-base mb-2">
        <span className="font-medium">Time left: {formatTime(timeLeft)}</span>
        <span className="text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
      </div>
      
      <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
        <span>0s</span>
        <span className="font-medium">{duration}s</span>
      </div>
    </div>
  );
};

export default OrderTimer;