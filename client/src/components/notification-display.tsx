import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLatestNotification } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  username?: string;
}

interface NotificationDisplayProps {
  className?: string;
}

export function NotificationDisplay({ className }: NotificationDisplayProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [hasSeenNotification, setHasSeenNotification] = useState(false);
  
  // Fetch most recent notification
  const { data: notification, isLoading, isError } = useQuery({
    queryKey: ['/api/notifications/latest'],
    queryFn: fetchLatestNotification,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if user has seen this notification before
  useEffect(() => {
    if (notification?.id) {
      const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications') || '{}');
      if (seenNotifications[notification.id]) {
        setHasSeenNotification(true);
        
        // If user already dismissed it, keep it hidden
        if (seenNotifications[notification.id].dismissed) {
          setIsDismissed(true);
          setShowNotification(false);
        }
      }
    }
  }, [notification]);

  // Dismiss notification and save to localStorage
  const handleDismiss = () => {
    setIsDismissed(true);
    setShowNotification(false);
    
    if (notification?.id) {
      const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications') || '{}');
      seenNotifications[notification.id] = {
        seen: true,
        dismissed: true,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications));
    }
  };

  // Mark as seen when notification is displayed
  useEffect(() => {
    if (notification?.id && showNotification && !hasSeenNotification) {
      const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications') || '{}');
      seenNotifications[notification.id] = {
        seen: true,
        dismissed: false,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications));
      setHasSeenNotification(true);
    }
  }, [notification, showNotification, hasSeenNotification]);

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch (error) {
      return '';
    }
  };

  // Don't render anything if no notification or loading or error or dismissed
  if (isLoading || isError || !notification || !notification.isActive || isDismissed || !showNotification) {
    return null;
  }

  return (
    <div className={cn(
      "relative w-full bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg p-3 md:p-4 animate-fade-in",
      className
    )}>
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium text-primary text-sm md:text-base line-clamp-1">{notification.title}</h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          
          <p className="text-xs md:text-sm text-foreground/80 line-clamp-2">{notification.content}</p>
        </div>
        
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 shrink-0 rounded-full hover:bg-primary/20" 
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Ẩn thông báo</span>
        </Button>
      </div>
    </div>
  );
}