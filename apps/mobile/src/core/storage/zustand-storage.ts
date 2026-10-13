import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { storage } from './mmkv';

const mmkvStateStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => {
    storage.remove(name);
  },
};

export const persistStorage = createJSONStorage(() => mmkvStateStorage);
