/* ===== Local Storage Utilities ===== */

import { type StickyNoteData } from "./StickyNote";

// Storage keys
export const STORAGE_KEYS = {
  STICKY_NOTES: "calendar-sticky-notes",
  SELECTED_COUNTRY: "calendar-selected-country",
  SELECTED_YEAR: "calendar-selected-year",
  USER_PREFERENCES: "calendar-user-preferences",
} as const;

// Generic storage helpers
export const storage = {
  // Get data from localStorage
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  },

  // Set data to localStorage
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} to localStorage:`, error);
    }
  },

  // Remove data from localStorage
  remove(key: string): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },

  // Clear all calendar data
  clear(): void {
    if (typeof window === "undefined") return;

    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },
};

// Specific storage functions for calendar data
export const calendarStorage = {
  // Sticky notes
  getStickyNotes(): StickyNoteData[] {
    return storage.get(STORAGE_KEYS.STICKY_NOTES) || [];
  },

  setStickyNotes(notes: any[]) {
    storage.set(STORAGE_KEYS.STICKY_NOTES, notes);
  },

  // Country selection
  getSelectedCountry(): string {
    return storage.get(STORAGE_KEYS.SELECTED_COUNTRY) || "IN";
  },

  setSelectedCountry(country: string) {
    storage.set(STORAGE_KEYS.SELECTED_COUNTRY, country);
  },

  // Year selection
  getSelectedYear(): number {
    const stored = storage.get(STORAGE_KEYS.SELECTED_YEAR);
    return typeof stored === "number" && stored > 0
      ? stored
      : new Date().getFullYear();
  },

  setSelectedYear(year: number) {
    storage.set(STORAGE_KEYS.SELECTED_YEAR, year);
  },

  // User preferences
  getPreferences() {
    return storage.get(STORAGE_KEYS.USER_PREFERENCES) || {};
  },

  setPreferences(prefs: any) {
    storage.set(STORAGE_KEYS.USER_PREFERENCES, prefs);
  },
};
