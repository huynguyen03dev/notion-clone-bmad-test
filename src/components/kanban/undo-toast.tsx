'use client';

import { useEffect, useState } from 'react';
import { Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UndoToastProps {
  isVisible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  autoHideDelay?: number; // in milliseconds
}

export function UndoToast({
  isVisible,
  message,
  onUndo,
  onDismiss,
  autoHideDelay = 5000, // 5 seconds default
}: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(autoHideDelay);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setTimeLeft(autoHideDelay);
      setIsAnimatingOut(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          setIsAnimatingOut(true);
          setTimeout(onDismiss, 300); // Allow animation to complete
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, autoHideDelay, onDismiss]);

  const handleUndo = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onUndo();
    }, 150); // Small delay for better UX
  };

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(onDismiss, 300);
  };

  if (!isVisible) return null;

  const progressPercentage = (timeLeft / autoHideDelay) * 100;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          'bg-gray-900 text-white rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]',
          'transform transition-all duration-300 ease-in-out',
          isAnimatingOut 
            ? 'translate-y-2 opacity-0 scale-95' 
            : 'translate-y-0 opacity-100 scale-100'
        )}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-gray-700 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Message */}
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="h-8 px-3 text-blue-400 hover:text-blue-300 hover:bg-gray-800"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Undo
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>

        {/* Time indicator */}
        <div className="mt-2 text-xs text-gray-400">
          Disappears in {Math.ceil(timeLeft / 1000)}s
        </div>
      </div>
    </div>
  );
}
