
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
    createJSONStorage,
    persist,
} from 'zustand/middleware';

/**
 * Shared UI state for the Cars feature.
 *
 * Car and service records are stored in PostgreSQL
 * and fetched through TanStack Query.
 *
 * This store contains only client-side preferences.
 */

export type CarSortOrder =
  | 'newest'
  | 'oldest'
  | 'make'
  | 'mileage';

interface CarStore {
  selectedCarId: string | null;

  searchQuery: string;
  sortOrder: CarSortOrder;
  showPrimaryOnly: boolean;

  selectCar: (id: string | null) => void;
  clearSelectedCar: () => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: CarSortOrder) => void;
  setShowPrimaryOnly: (value: boolean) => void;
  resetFilters: () => void;
}

export const useCarStore = create<CarStore>()(
  persist(
    (set) => ({
      selectedCarId: null,

      searchQuery: '',
      sortOrder: 'newest',
      showPrimaryOnly: false,

      selectCar: (id) =>
        set({
          selectedCarId: id?.trim() || null,
        }),

      clearSelectedCar: () =>
        set({
          selectedCarId: null,
        }),

      setSearchQuery: (query) =>
        set({
          searchQuery: query,
        }),

      setSortOrder: (order) =>
        set({
          sortOrder: order,
        }),

      setShowPrimaryOnly: (value) =>
        set({
          showPrimaryOnly: value,
        }),

      resetFilters: () =>
        set({
          searchQuery: '',
          sortOrder: 'newest',
          showPrimaryOnly: false,
        }),
    }),
    {
      /**
       * New storage key:
       * Do not hydrate obsolete local car records
       * or the old "car-1" selection.
       */
      name: 'lovablecar-car-preferences-v1',

      storage: createJSONStorage(
        () => AsyncStorage,
      ),

      /**
       * Persist preferences only.
       * Never persist car or service records here.
       */
      partialize: (state) => ({
        selectedCarId: state.selectedCarId,
        sortOrder: state.sortOrder,
        showPrimaryOnly: state.showPrimaryOnly,
      }),
    },
  ),
);
