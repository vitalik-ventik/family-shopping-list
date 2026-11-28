import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Firestore,
  writeBatch,
  deleteField,
} from 'firebase/firestore';

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => sanitizeForFirestore(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (val !== undefined) {
        result[key] = sanitizeForFirestore(val);
      }
    });
    return result as T;
  }
  return value;
}
import {
  FirebaseConfig,
  ShoppingItem,
  Category,
  WeekendTemplate,
  NotificationSchedule,
  SyncStatus,
  RecentItem,
} from '../types';
import { parsePairingTokenFromUrl } from '../utils/pairing';
import {
  DEFAULT_CATEGORIES,
  INITIAL_ITEMS,
  DEFAULT_WEEKEND_TEMPLATES,
  DEFAULT_NOTIFICATIONS,
} from '../data/defaultData';

const CONFIG_STORAGE_KEY = 'family_shopping_firebase_config';
const LOCAL_ITEMS_KEY = 'family_shopping_local_items';
const LOCAL_CATEGORIES_KEY = 'family_shopping_local_categories';
const LOCAL_TEMPLATES_KEY = 'family_shopping_local_templates';
const LOCAL_SCHEDULES_KEY = 'family_shopping_local_schedules';
const LOCAL_RECENT_ITEMS_KEY = 'family_shopping_recent_items';

// BroadcastChannel for instant multi-tab sync in local/demo mode
let localBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel('family_shopping_local_sync');
  } catch {
    // broadcast channel not supported in this environment
  }
}

class FirebaseSyncManager {
  private currentConfig: FirebaseConfig;
  private firebaseApp: FirebaseApp | null = null;
  private firestore: Firestore | null = null;
  private unsubscribeItems: (() => void) | null = null;
  private unsubscribeCategories: (() => void) | null = null;
  private unsubscribeTemplates: (() => void) | null = null;
  private unsubscribeSchedules: (() => void) | null = null;

  private syncStatusListeners: Set<(status: SyncStatus) => void> = new Set();
  private itemsListeners: Set<(items: ShoppingItem[]) => void> = new Set();
  private categoriesListeners: Set<(categories: Category[]) => void> = new Set();
  private templatesListeners: Set<(templates: WeekendTemplate[]) => void> = new Set();
  private schedulesListeners: Set<(schedules: NotificationSchedule[]) => void> = new Set();

  private cachedItems: ShoppingItem[] = [];
  private cachedCategories: Category[] = [];
  private cachedTemplates: WeekendTemplate[] = [];
  private cachedSchedules: NotificationSchedule[] = [];
  private cachedRecentItems: RecentItem[] = [];
  private recentItemsListeners: Set<(items: RecentItem[]) => void> = new Set();

  public autoImportedFromUrl = false;

  private currentStatus: SyncStatus = {
    state: 'disconnected',
  };
  private initialSnapshotSeededGroups: Set<string> = new Set();

  constructor() {
    this.currentConfig = this.loadStoredConfig();
    this.initLocalCache();
    this.setupBroadcastChannel();
    this.initialize();
  }

  public getStoredConfig(): FirebaseConfig {
    return { ...this.currentConfig };
  }

  public getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }

  private loadStoredConfig(): FirebaseConfig {
    const urlPayload = parsePairingTokenFromUrl();
    if (urlPayload) {
      const importedConfig: FirebaseConfig = {
        apiKey: urlPayload.apiKey,
        projectId: urlPayload.projectId,
        appId: urlPayload.appId,
        storageBucket: urlPayload.storageBucket || '',
        messagingSenderId: urlPayload.messagingSenderId || '',
        authDomain: urlPayload.authDomain || '',
        groupId: urlPayload.groupId || 'my-family',
        isConfigured: Boolean(urlPayload.apiKey && urlPayload.projectId),
        mode: urlPayload.apiKey && urlPayload.projectId ? 'firebase' : 'demo',
      };
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(importedConfig));
        if (typeof window !== 'undefined') {
          const cleanUrl = `${window.location.pathname}${window.location.hash}`;
          window.history.replaceState({}, '', cleanUrl);
        }
        this.autoImportedFromUrl = true;
      } catch (e) {
        console.warn('Failed to persist imported QR config', e);
      }
      return importedConfig;
    }

    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.projectId) {
          return {
            ...parsed,
            isConfigured: true,
            mode: parsed.mode || 'firebase',
            groupId: parsed.groupId?.trim() || 'my-family',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored Firebase config', e);
    }

    // Default unconfigured state: Demo mode
    return {
      apiKey: '',
      projectId: '',
      appId: '',
      messagingSenderId: '',
      storageBucket: '',
      authDomain: '',
      groupId: 'my-family',
      isConfigured: false,
      mode: 'demo',
    };
  }

  private initLocalCache() {
    try {
      const itemsJson = localStorage.getItem(LOCAL_ITEMS_KEY);
      this.cachedItems = itemsJson ? JSON.parse(itemsJson) : INITIAL_ITEMS;

      const catsJson = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      this.cachedCategories = catsJson ? JSON.parse(catsJson) : DEFAULT_CATEGORIES;

      const tmplJson = localStorage.getItem(LOCAL_TEMPLATES_KEY);
      this.cachedTemplates = tmplJson ? JSON.parse(tmplJson) : DEFAULT_WEEKEND_TEMPLATES;

      const schedJson = localStorage.getItem(LOCAL_SCHEDULES_KEY);
      this.cachedSchedules = schedJson ? JSON.parse(schedJson) : DEFAULT_NOTIFICATIONS;

      const recentJson = localStorage.getItem(LOCAL_RECENT_ITEMS_KEY);
      if (recentJson) {
        this.cachedRecentItems = (JSON.parse(recentJson) as RecentItem[]).sort(
          (a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0)
        );
      } else {
        this.cachedRecentItems = [];
      }
      this.mergeRecentItemsFromList(this.cachedItems);
    } catch {
      this.cachedItems = INITIAL_ITEMS;
      this.cachedCategories = DEFAULT_CATEGORIES;
      this.cachedTemplates = DEFAULT_WEEKEND_TEMPLATES;
      this.cachedSchedules = DEFAULT_NOTIFICATIONS;
      this.cachedRecentItems = [];
    }
  }

  private setupBroadcastChannel() {
    if (localBroadcastChannel) {
      localBroadcastChannel.onmessage = (event) => {
        const { type } = event.data || {};
        if (type === 'LOCAL_SYNC_UPDATE' && this.currentConfig.mode === 'demo') {
          this.initLocalCache();
          this.notifyAllSubscribers();
        }
      };
    }
  }

  private broadcastLocalUpdate() {
    if (localBroadcastChannel) {
      localBroadcastChannel.postMessage({ type: 'LOCAL_SYNC_UPDATE', timestamp: Date.now() });
    }
  }

  private updateStatus(status: SyncStatus) {
    this.currentStatus = status;
    this.syncStatusListeners.forEach((listener) => listener(status));
  }

  private notifyAllSubscribers() {
    this.itemsListeners.forEach((l) => l([...this.cachedItems]));
    this.categoriesListeners.forEach((l) => l([...this.cachedCategories]));
    this.templatesListeners.forEach((l) => l([...this.cachedTemplates]));
    this.schedulesListeners.forEach((l) => l([...this.cachedSchedules]));
  }

  public async initialize(): Promise<void> {
    // Teardown previous listeners if active
    this.teardownListeners();

    if (this.currentConfig.mode === 'demo' || !this.currentConfig.apiKey || !this.currentConfig.projectId) {
      this.updateStatus({
        state: 'demo',
        lastSyncTime: Date.now(),
        details: 'Local Demo Mode (Multi-tab active). Enter Firebase credentials in Settings for live cloud sync.',
      });
      this.notifyAllSubscribers();
      return;
    }

    try {
      this.updateStatus({ state: 'connecting', details: `Connecting to ${this.currentConfig.projectId}...` });

      const appName = `family-app-${this.currentConfig.projectId}-${this.currentConfig.groupId}`;
      const existingApps = getApps();
      const existing = existingApps.find((a) => a.name === appName);

      this.firebaseApp = existing || initializeApp(
        {
          apiKey: this.currentConfig.apiKey,
          authDomain: this.currentConfig.authDomain || `${this.currentConfig.projectId}.firebaseapp.com`,
          projectId: this.currentConfig.projectId,
          storageBucket: this.currentConfig.storageBucket || `${this.currentConfig.projectId}.appspot.com`,
          messagingSenderId: this.currentConfig.messagingSenderId,
          appId: this.currentConfig.appId,
        },
        appName
      );

      this.firestore = getFirestore(this.firebaseApp);
      await this.startFirestoreListeners();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Failed to initialize dynamic Firebase:', err);
      this.updateStatus({
        state: 'error',
        errorMessage: errorMsg,
        details: 'Failed to connect. Falling back to local offline mode.',
      });
      this.notifyAllSubscribers();
    }
  }

  private teardownListeners() {
    if (this.unsubscribeItems) {
      this.unsubscribeItems();
      this.unsubscribeItems = null;
    }
    if (this.unsubscribeCategories) {
      this.unsubscribeCategories();
      this.unsubscribeCategories = null;
    }
    if (this.unsubscribeTemplates) {
      this.unsubscribeTemplates();
      this.unsubscribeTemplates = null;
    }
    if (this.unsubscribeSchedules) {
      this.unsubscribeSchedules();
      this.unsubscribeSchedules = null;
    }
  }

  private getGroupCollectionPath(collectionName: string): string {
    const groupId = encodeURIComponent(this.currentConfig.groupId || 'default-family');
    return `family_groups/${groupId}/${collectionName}`;
  }

  private async startFirestoreListeners() {
    if (!this.firestore) return;

    try {
      const groupId = (this.currentConfig.groupId || 'my-family').trim() || 'my-family';

      // 1. Items Listener (fetch full collection and sort client-side so docs without createdAt are never excluded)
      const itemsCol = collection(this.firestore, 'family_groups', groupId, 'items');

      this.unsubscribeItems = onSnapshot(
        itemsCol,
        (snapshot) => {
          if (
            snapshot.empty &&
            !snapshot.metadata.fromCache &&
            !this.initialSnapshotSeededGroups.has(groupId) &&
            this.cachedItems.length > 0
          ) {
            // First time seeding if completely fresh Firestore collection
            this.initialSnapshotSeededGroups.add(groupId);
            this.seedFirestoreInitialData();
            return;
          }
          this.initialSnapshotSeededGroups.add(groupId);
          const items: ShoppingItem[] = [];
          snapshot.forEach((d) => {
            items.push({ id: d.id, ...(d.data() as Omit<ShoppingItem, 'id'>) });
          });
          items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          this.cachedItems = items;
          this.mergeRecentItemsFromList(items);
          this.saveLocalCache();
          this.itemsListeners.forEach((l) => l([...items]));
          this.updateStatus({
            state: 'connected',
            lastSyncTime: Date.now(),
            details: `Connected to Firestore (Project: ${this.currentConfig.projectId}, Group: ${groupId})`,
          });
        },
        (error) => {
          console.error('Firestore items listener error:', error);
          this.updateStatus({
            state: 'error',
            errorMessage: error.message,
            details: 'Permission denied or Firestore rules blocked access. Check security rules.',
          });
        }
      );

      // 2. Categories Listener
      const catCol = collection(this.firestore, 'family_groups', groupId, 'categories');
      this.unsubscribeCategories = onSnapshot(catCol, (snapshot) => {
        if (!snapshot.empty) {
          const cats: Category[] = [];
          snapshot.forEach((d) => {
            cats.push({ id: d.id, ...(d.data() as Omit<Category, 'id'>) });
          });
          cats.sort((a, b) => a.order - b.order);
          this.cachedCategories = cats;
          this.saveLocalCache();
          this.categoriesListeners.forEach((l) => l([...cats]));
        }
      });

      // 3. Templates Listener
      const tmplCol = collection(this.firestore, 'family_groups', groupId, 'templates');
      this.unsubscribeTemplates = onSnapshot(tmplCol, (snapshot) => {
        if (!snapshot.empty) {
          const tmpls: WeekendTemplate[] = [];
          snapshot.forEach((d) => {
            tmpls.push({ id: d.id, ...(d.data() as Omit<WeekendTemplate, 'id'>) });
          });
          this.cachedTemplates = tmpls;
          this.saveLocalCache();
          this.templatesListeners.forEach((l) => l([...tmpls]));
        }
      });

      // 4. Schedules Listener
      const schedCol = collection(this.firestore, 'family_groups', groupId, 'schedules');
      this.unsubscribeSchedules = onSnapshot(schedCol, (snapshot) => {
        if (!snapshot.empty) {
          const scheds: NotificationSchedule[] = [];
          snapshot.forEach((d) => {
            scheds.push({ id: d.id, ...(d.data() as Omit<NotificationSchedule, 'id'>) });
          });
          this.cachedSchedules = scheds;
          this.saveLocalCache();
          this.schedulesListeners.forEach((l) => l([...scheds]));
        }
      });
    } catch (e: unknown) {
      console.error('Error attaching Firestore listeners:', e);
    }
  }

  private async seedFirestoreInitialData() {
    if (!this.firestore) return;
    try {
      const batch = writeBatch(this.firestore);
      const groupId = this.currentConfig.groupId || 'default-family';

      // Seed items
      this.cachedItems.forEach((item) => {
        const itemRef = doc(this.firestore!, 'family_groups', groupId, 'items', item.id);
        const { id, ...data } = item;
        batch.set(itemRef, sanitizeForFirestore(data));
      });

      // Seed categories
      this.cachedCategories.forEach((cat) => {
        const catRef = doc(this.firestore!, 'family_groups', groupId, 'categories', cat.id);
        const { id, ...data } = cat;
        batch.set(catRef, sanitizeForFirestore(data));
      });

      // Seed templates
      this.cachedTemplates.forEach((tmpl) => {
        const tmplRef = doc(this.firestore!, 'family_groups', groupId, 'templates', tmpl.id);
        const { id, ...data } = tmpl;
        batch.set(tmplRef, sanitizeForFirestore(data));
      });

      // Seed schedules
      this.cachedSchedules.forEach((sch) => {
        const schRef = doc(this.firestore!, 'family_groups', groupId, 'schedules', sch.id);
        const { id, ...data } = sch;
        batch.set(schRef, sanitizeForFirestore(data));
      });

      await batch.commit();
      console.log('Successfully seeded initial data to Firestore group:', groupId);
    } catch (err) {
      console.warn('Seeding skipped or not permitted:', err);
    }
  }

  private saveLocalCache() {
    try {
      localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(this.cachedItems));
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(this.cachedCategories));
      localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(this.cachedTemplates));
      localStorage.setItem(LOCAL_SCHEDULES_KEY, JSON.stringify(this.cachedSchedules));
      localStorage.setItem(LOCAL_RECENT_ITEMS_KEY, JSON.stringify(this.cachedRecentItems));
      this.broadcastLocalUpdate();
    } catch {
      // ignore quota errors
    }
  }

  private recordRecentItem(entry: RecentItem) {
    const normalized = entry.title.trim().toLowerCase();
    if (!normalized) return;
    const timestamp = entry.lastUsedAt || Date.now();
    const filtered = this.cachedRecentItems.filter(
      (r) => r.title.trim().toLowerCase() !== normalized
    );
    this.cachedRecentItems = [
      { ...entry, title: entry.title.trim(), lastUsedAt: timestamp },
      ...filtered,
    ]
      .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
      .slice(0, 500);
    try {
      localStorage.setItem(LOCAL_RECENT_ITEMS_KEY, JSON.stringify(this.cachedRecentItems));
    } catch {
      // ignore quota
    }
    this.recentItemsListeners.forEach((l) => l([...this.cachedRecentItems]));
  }

  private mergeRecentItemsFromList(items: ShoppingItem[]) {
    const byKey = new Map<string, RecentItem>();
    this.cachedRecentItems.forEach((r) => {
      const key = r.title.trim().toLowerCase();
      if (!key) return;
      const prev = byKey.get(key);
      if (!prev || (r.lastUsedAt || 0) > (prev.lastUsedAt || 0)) {
        byKey.set(key, { ...r, title: r.title.trim() });
      }
    });

    let changed = false;
    items.forEach((item) => {
      const key = item.title.trim().toLowerCase();
      if (!key) return;
      const itemUsedAt = Math.max(item.completedAt || 0, item.createdAt || 0) || Date.now();
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          title: item.title.trim(),
          categoryId: item.categoryId,
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          lastUsedAt: itemUsedAt,
        });
        changed = true;
      } else if (itemUsedAt > (existing.lastUsedAt || 0)) {
        byKey.set(key, {
          title: item.title.trim(),
          categoryId: item.categoryId || existing.categoryId,
          quantity: item.quantity || existing.quantity || 1,
          unit: item.unit || existing.unit || 'pcs',
          lastUsedAt: itemUsedAt,
        });
        changed = true;
      }
    });

    if (changed) {
      this.cachedRecentItems = Array.from(byKey.values())
        .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
        .slice(0, 500);
      try {
        localStorage.setItem(LOCAL_RECENT_ITEMS_KEY, JSON.stringify(this.cachedRecentItems));
      } catch {
        // ignore quota
      }
      this.recentItemsListeners.forEach((l) => l([...this.cachedRecentItems]));
    }
  }

  public subscribeToRecentItems(callback: (items: RecentItem[]) => void): () => void {
    this.recentItemsListeners.add(callback);
    callback([...this.cachedRecentItems]);
    return () => this.recentItemsListeners.delete(callback);
  }

  public removeRecentItem(title: string) {
    const key = title.trim().toLowerCase();
    this.cachedRecentItems = this.cachedRecentItems.filter(
      (r) => r.title.trim().toLowerCase() !== key
    );
    try {
      localStorage.setItem(LOCAL_RECENT_ITEMS_KEY, JSON.stringify(this.cachedRecentItems));
    } catch {
      // ignore quota
    }
    this.recentItemsListeners.forEach((l) => l([...this.cachedRecentItems]));
  }

  // --- Public API for subscribing ---
  public subscribeToStatus(callback: (status: SyncStatus) => void): () => void {
    this.syncStatusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.syncStatusListeners.delete(callback);
  }

  public subscribeToItems(callback: (items: ShoppingItem[]) => void): () => void {
    this.itemsListeners.add(callback);
    callback([...this.cachedItems]);
    return () => this.itemsListeners.delete(callback);
  }

  public subscribeToCategories(callback: (categories: Category[]) => void): () => void {
    this.categoriesListeners.add(callback);
    callback([...this.cachedCategories]);
    return () => this.categoriesListeners.delete(callback);
  }

  public subscribeToTemplates(callback: (templates: WeekendTemplate[]) => void): () => void {
    this.templatesListeners.add(callback);
    callback([...this.cachedTemplates]);
    return () => this.templatesListeners.delete(callback);
  }

  public subscribeToSchedules(callback: (schedules: NotificationSchedule[]) => void): () => void {
    this.schedulesListeners.add(callback);
    callback([...this.cachedSchedules]);
    return () => this.schedulesListeners.delete(callback);
  }

  // --- Config update & connection test ---
  public async saveConfig(config: FirebaseConfig): Promise<void> {
    const normalized: FirebaseConfig = {
      ...config,
      apiKey: (config.apiKey || '').trim(),
      projectId: (config.projectId || '').trim(),
      appId: (config.appId || '').trim(),
      storageBucket: (config.storageBucket || '').trim(),
      messagingSenderId: (config.messagingSenderId || '').trim(),
      authDomain: (config.authDomain || '').trim(),
      groupId: (config.groupId || '').trim() || 'my-family',
    };
    this.currentConfig = normalized;
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to save config to localStorage', e);
    }
    await this.initialize();
  }

  public async testConnection(config: FirebaseConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    if (!config.apiKey || !config.projectId || !config.appId) {
      return { success: false, message: 'Missing apiKey, projectId, or appId' };
    }

    const testAppName = `test-conn-${Date.now()}`;
    const startTime = performance.now();
    try {
      const testApp = initializeApp(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
          projectId: config.projectId,
          storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        },
        testAppName
      );

      const db = getFirestore(testApp);
      const testDoc = doc(db, 'family_groups', config.groupId || 'test', '_connection_test', 'ping');
      await setDoc(testDoc, { ping: Date.now(), testBy: 'FamilyShoppingApp' });
      await deleteDoc(testDoc);

      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        message: `Successfully connected to Firestore! (${latencyMs}ms)`,
        latencyMs,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Connection failed: ${msg}`,
      };
    }
  }

  // --- Mutations (Shopping Items) ---
  public async addItem(item: Omit<ShoppingItem, 'id' | 'createdAt'>): Promise<string> {
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem: ShoppingItem = {
      ...item,
      id,
      createdAt: Date.now(),
    };

    this.recordRecentItem({
      title: newItem.title,
      categoryId: newItem.categoryId,
      quantity: newItem.quantity || 1,
      unit: newItem.unit || 'pcs',
      lastUsedAt: Date.now(),
    });

    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const groupId = (this.currentConfig.groupId || 'my-family').trim() || 'my-family';
        const itemRef = doc(this.firestore, 'family_groups', groupId, 'items', id);
        const { id: _, ...data } = newItem;
        await setDoc(itemRef, sanitizeForFirestore(data));
        return id;
      } catch (err) {
        console.error('Firestore addItem failed, writing to local cache:', err);
      }
    }

    // Local / Demo fallback
    this.cachedItems = [newItem, ...this.cachedItems];
    this.saveLocalCache();
    this.itemsListeners.forEach((l) => l([...this.cachedItems]));
    return id;
  }

  public async updateItem(id: string, updates: Partial<ShoppingItem>): Promise<void> {
    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const itemRef = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'items', id);
        const firestoreUpdates: Record<string, unknown> = {};
        Object.entries(updates).forEach(([k, v]) => {
          firestoreUpdates[k] = v === undefined ? deleteField() : v;
        });
        await updateDoc(itemRef, firestoreUpdates);
        return;
      } catch (err) {
        console.error('Firestore updateItem failed:', err);
      }
    }

    this.cachedItems = this.cachedItems.map((item) => (item.id === id ? { ...item, ...updates } : item));
    this.saveLocalCache();
    this.itemsListeners.forEach((l) => l([...this.cachedItems]));
  }

  public async toggleItem(id: string): Promise<void> {
    const target = this.cachedItems.find((i) => i.id === id);
    if (!target) return;

    const completed = !target.completed;
    const completedAt = completed ? Date.now() : null;
    this.recordRecentItem({
      title: target.title,
      categoryId: target.categoryId,
      quantity: target.quantity || 1,
      unit: target.unit || 'pcs',
      lastUsedAt: Date.now(),
    });
    await this.updateItem(id, {
      completed,
      completedAt,
      cancelled: false,
      cancelledAt: null,
    });
  }

  public async cancelItem(id: string): Promise<void> {
    const target = this.cachedItems.find((i) => i.id === id);
    if (!target) return;
    await this.updateItem(id, {
      cancelled: true,
      cancelledAt: Date.now(),
      completed: false,
      completedAt: null,
    });
  }

  public async restoreItem(id: string): Promise<void> {
    const target = this.cachedItems.find((i) => i.id === id);
    if (!target) return;
    await this.updateItem(id, {
      cancelled: false,
      cancelledAt: null,
    });
  }

  public async deleteItem(id: string): Promise<void> {
    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const itemRef = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'items', id);
        await deleteDoc(itemRef);
        return;
      } catch (err) {
        console.error('Firestore deleteItem failed:', err);
      }
    }

    this.cachedItems = this.cachedItems.filter((i) => i.id !== id);
    this.saveLocalCache();
    this.itemsListeners.forEach((l) => l([...this.cachedItems]));
  }

  public async clearCompletedItems(): Promise<number> {
    const completedItems = this.cachedItems.filter((i) => i.completed && !i.cancelled);
    if (completedItems.length === 0) return 0;

    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const batch = writeBatch(this.firestore);
        completedItems.forEach((i) => {
          const itemRef = doc(this.firestore!, 'family_groups', this.currentConfig.groupId, 'items', i.id);
          batch.delete(itemRef);
        });
        await batch.commit();
        return completedItems.length;
      } catch (err) {
        console.error('Firestore batch clear completed failed:', err);
      }
    }

    this.cachedItems = this.cachedItems.filter((i) => !(i.completed && !i.cancelled));
    this.saveLocalCache();
    this.itemsListeners.forEach((l) => l([...this.cachedItems]));
    return completedItems.length;
  }

  public async clearCancelledItems(): Promise<number> {
    const cancelledItems = this.cachedItems.filter((i) => Boolean(i.cancelled));
    if (cancelledItems.length === 0) return 0;

    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const batch = writeBatch(this.firestore);
        cancelledItems.forEach((i) => {
          const itemRef = doc(this.firestore!, 'family_groups', this.currentConfig.groupId, 'items', i.id);
          batch.delete(itemRef);
        });
        await batch.commit();
        return cancelledItems.length;
      } catch (err) {
        console.error('Firestore batch clear cancelled failed:', err);
      }
    }

    this.cachedItems = this.cachedItems.filter((i) => !i.cancelled);
    this.saveLocalCache();
    this.itemsListeners.forEach((l) => l([...this.cachedItems]));
    return cancelledItems.length;
  }

  // --- Weekend Template Master ---
  public async applyTemplate(templateId: string, mode: 'merge' | 'replace' = 'merge'): Promise<number> {
    const template = this.cachedTemplates.find((t) => t.id === templateId);
    if (!template || template.items.length === 0) return 0;

    const newItems: ShoppingItem[] = template.items.map((tmplItem, index) => ({
      id: `item_tmpl_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      title: tmplItem.title,
      categoryId: tmplItem.categoryId,
      quantity: tmplItem.quantity,
      unit: tmplItem.unit,
      note: tmplItem.note,
      urgent: tmplItem.urgent || false,
      estimatedPrice: tmplItem.estimatedPrice,
      completed: false,
      createdAt: Date.now() + index * 10,
      addedBy: 'Template Master',
    }));

    newItems.forEach((ni) => {
      this.recordRecentItem({
        title: ni.title,
        categoryId: ni.categoryId,
        quantity: ni.quantity || 1,
        unit: ni.unit || 'pcs',
        lastUsedAt: ni.createdAt,
      });
    });

    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const batch = writeBatch(this.firestore);
        const groupId = (this.currentConfig.groupId || 'my-family').trim() || 'my-family';

        if (mode === 'replace') {
          // Delete existing items
          this.cachedItems.forEach((item) => {
            const ref = doc(this.firestore!, 'family_groups', groupId, 'items', item.id);
            batch.delete(ref);
          });
        }

        // Add template items
        newItems.forEach((item) => {
          const ref = doc(this.firestore!, 'family_groups', groupId, 'items', item.id);
          const { id: _, ...data } = item;
          batch.set(ref, sanitizeForFirestore(data));
        });

        // Update template lastUsedAt
        const tmplRef = doc(this.firestore, 'family_groups', groupId, 'templates', templateId);
        batch.set(tmplRef, { lastUsedAt: Date.now() }, { merge: true });

        await batch.commit();
        return newItems.length;
      } catch (err) {
        console.error('Firestore applyTemplate failed:', err);
      }
    }

    // Local / Demo mode
    let updatedList: ShoppingItem[];
    if (mode === 'replace') {
      updatedList = [...newItems];
    } else {
      // Merge: avoid exact duplicate titles if already uncompleted
      const existingUncompletedTitles = new Set(
        this.cachedItems.filter((i) => !i.completed).map((i) => i.title.toLowerCase().trim())
      );
      const itemsToAdd = newItems.filter((i) => !existingUncompletedTitles.has(i.title.toLowerCase().trim()));
      updatedList = [...itemsToAdd, ...this.cachedItems];
    }

    this.cachedItems = updatedList;
    this.cachedTemplates = this.cachedTemplates.map((t) =>
      t.id === templateId ? { ...t, lastUsedAt: Date.now() } : t
    );
    this.saveLocalCache();
    this.itemsListeners.forEach((l) => l([...this.cachedItems]));
    this.templatesListeners.forEach((l) => l([...this.cachedTemplates]));
    return newItems.length;
  }

  public async saveTemplate(template: Omit<WeekendTemplate, 'id' | 'createdAt'>): Promise<string> {
    const id = `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTemplate: WeekendTemplate = {
      ...template,
      id,
      createdAt: Date.now(),
    };

    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const ref = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'templates', id);
        const { id: _, ...data } = newTemplate;
        await setDoc(ref, sanitizeForFirestore(data));
        return id;
      } catch (err) {
        console.error('Firestore saveTemplate failed:', err);
      }
    }

    this.cachedTemplates = [newTemplate, ...this.cachedTemplates];
    this.saveLocalCache();
    this.templatesListeners.forEach((l) => l([...this.cachedTemplates]));
    return id;
  }

  public async deleteTemplate(id: string): Promise<void> {
    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const ref = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'templates', id);
        await deleteDoc(ref);
        return;
      } catch (err) {
        console.error('Firestore deleteTemplate failed:', err);
      }
    }

    this.cachedTemplates = this.cachedTemplates.filter((t) => t.id !== id);
    this.saveLocalCache();
    this.templatesListeners.forEach((l) => l([...this.cachedTemplates]));
  }

  // --- Category Management ---
  public async addCategory(cat: Omit<Category, 'id'>): Promise<string> {
    const id = `cat_${Date.now()}`;
    const newCat: Category = { ...cat, id };

    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const ref = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'categories', id);
        const { id: _, ...data } = newCat;
        await setDoc(ref, sanitizeForFirestore(data));
        return id;
      } catch (err) {
        console.error('Firestore addCategory failed:', err);
      }
    }

    this.cachedCategories = [...this.cachedCategories, newCat].sort((a, b) => a.order - b.order);
    this.saveLocalCache();
    this.categoriesListeners.forEach((l) => l([...this.cachedCategories]));
    return id;
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const ref = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'categories', id);
        await updateDoc(ref, sanitizeForFirestore(updates as Record<string, unknown>));
        return;
      } catch (err) {
        console.error('Firestore updateCategory failed:', err);
      }
    }

    this.cachedCategories = this.cachedCategories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveLocalCache();
    this.categoriesListeners.forEach((l) => l([...this.cachedCategories]));
  }

  public async deleteCategory(id: string): Promise<void> {
    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const ref = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'categories', id);
        await deleteDoc(ref);
        return;
      } catch (err) {
        console.error('Firestore deleteCategory failed:', err);
      }
    }

    this.cachedCategories = this.cachedCategories.filter((c) => c.id !== id);
    this.saveLocalCache();
    this.categoriesListeners.forEach((l) => l([...this.cachedCategories]));
  }

  // --- Notification Schedules ---
  public async saveNotificationSchedule(
    schedule: Omit<NotificationSchedule, 'id' | 'createdAt'> & { id?: string }
  ): Promise<string> {
    const id = schedule.id || `sched_${Date.now()}`;
    const newSchedule: NotificationSchedule = {
      ...schedule,
      id,
      createdAt: Date.now(),
    };

    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const ref = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'schedules', id);
        const { id: _, ...data } = newSchedule;
        await setDoc(ref, sanitizeForFirestore(data));
        return id;
      } catch (err) {
        console.error('Firestore saveSchedule failed:', err);
      }
    }

    const existingIndex = this.cachedSchedules.findIndex((s) => s.id === id);
    if (existingIndex >= 0) {
      this.cachedSchedules[existingIndex] = newSchedule;
    } else {
      this.cachedSchedules = [newSchedule, ...this.cachedSchedules];
    }

    this.saveLocalCache();
    this.schedulesListeners.forEach((l) => l([...this.cachedSchedules]));
    return id;
  }

  public async toggleNotificationSchedule(id: string): Promise<void> {
    const sched = this.cachedSchedules.find((s) => s.id === id);
    if (!sched) return;
    await this.saveNotificationSchedule({ ...sched, active: !sched.active });
  }

  public async deleteNotificationSchedule(id: string): Promise<void> {
    if (this.currentConfig.mode === 'firebase' && this.firestore) {
      try {
        const ref = doc(this.firestore, 'family_groups', this.currentConfig.groupId, 'schedules', id);
        await deleteDoc(ref);
        return;
      } catch (err) {
        console.error('Firestore deleteSchedule failed:', err);
      }
    }

    this.cachedSchedules = this.cachedSchedules.filter((s) => s.id !== id);
    this.saveLocalCache();
    this.schedulesListeners.forEach((l) => l([...this.cachedSchedules]));
  }
}

export const firebaseService = new FirebaseSyncManager();
