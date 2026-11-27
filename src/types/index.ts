export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  databaseURL?: string;
  groupId: string; // Group / Family namespace for isolation
  isConfigured: boolean;
  mode: 'firebase' | 'demo';
}

export interface ShoppingItem {
  id: string;
  title: string;
  categoryId: string;
  quantity: number;
  unit: string;
  note?: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  addedBy?: string;
  urgent?: boolean;
  estimatedPrice?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  order: number;
}

export interface WeekendTemplateItem {
  title: string;
  categoryId: string;
  quantity: number;
  unit: string;
  note?: string;
  estimatedPrice?: number;
  urgent?: boolean;
}

export interface WeekendTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tag: string;
  items: WeekendTemplateItem[];
  createdAt: number;
  lastUsedAt?: number;
}

export interface NotificationSchedule {
  id: string;
  title: string;
  time: string; // "17:30"
  daysOfWeek: number[]; // [1,2,3,4,5] = Mon-Fri
  categoryIds: string[]; // specific categories to monitor
  active: boolean;
  createdAt: number;
}

export type SyncState = 'connected' | 'connecting' | 'disconnected' | 'demo' | 'error';

export interface SyncStatus {
  state: SyncState;
  lastSyncTime?: number;
  errorMessage?: string;
  details?: string;
}

export type SupportedLocale = 'en' | 'uk';
