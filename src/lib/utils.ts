import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const formatTime = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const calculateTimeAgo = (date: string | Date) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
}

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

export const getRandomAvatar = (seed?: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || Math.random()}`;
}

export const predefinedInterests = [
  { id: '1', name: 'Gaming' },
  { id: '2', name: 'Music' },
  { id: '3', name: 'Movies' },
  { id: '4', name: 'Books' },
  { id: '5', name: 'Sports' },
  { id: '6', name: 'Technology' },
  { id: '7', name: 'Cooking' },
  { id: '8', name: 'Travel' },
  { id: '9', name: 'Photography' },
  { id: '10', name: 'Art' },
  { id: '11', name: 'Fashion' },
  { id: '12', name: 'Fitness' },
];