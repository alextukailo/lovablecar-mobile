
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
    createJSONStorage,
    persist,
} from 'zustand/middleware';

/**
 * Service records belong to PostgreSQL.
 *
 * This store contains UI preferences only.
 * Do not add service records or API response
 * objects to this Zustand store.
 */

export type ServiceSortOrder =
  | 'newest'
  | 'oldest'
  | 'mileage-high'
  | 'mileage-low';

export type ServiceViewMode =
  | 'list'
  | 'compact';

interface ServiceStore {
  searchQuery: string;
  sortOrder: ServiceSortOrder;
  viewMode: ServiceViewMode;
  showCosts: boolean;

  setSearchQuery: (query: string) => void;

  setSortOrder: (
    order: ServiceSortOrder,
  ) => void;

  setViewMode: (
    mode: ServiceViewMode,
  ) => void;

  setShowCosts: (
    show: boolean,
  ) => void;

  resetFilters: () => void;
}

const initialPreferences = {
  searchQuery: '',
  sortOrder: 'newest' as ServiceSortOrder,
  viewMode: 'list' as ServiceViewMode,
  showCosts: true,
};

export const useServiceStore =
  create<ServiceStore>()(
    persist(
      (set) => ({
        ...initialPreferences,

        setSearchQuery: (searchQuery) =>
          set({ searchQuery }),

        setSortOrder: (sortOrder) =>
          set({ sortOrder }),

        setViewMode: (viewMode) =>
          set({ viewMode }),

        setShowCosts: (showCosts) =>
          set({ showCosts }),

        resetFilters: () =>
          set({
            searchQuery:
              initialPreferences.searchQuery,

            sortOrder:
              initialPreferences.sortOrder,

            viewMode:
              initialPreferences.viewMode,

            showCosts:
              initialPreferences.showCosts,
          }),
      }),
      {
        // New key: never hydrate legacy
        // AsyncStorage service records.
        name: 'lovablecar-service-preferences-v1',

        storage: createJSONStorage(
          () => AsyncStorage,
        ),

        partialize: (state) => ({
          searchQuery: state.searchQuery,
          sortOrder: state.sortOrder,
          viewMode: state.viewMode,
          showCosts: state.showCosts,
        }),
      },
    ),
  );
