import { createMMKV } from 'react-native-mmkv';

/** Fast local key-value store for non-secret preferences. Never store tokens here. */
export const storage = createMMKV({ id: 'lamma' });
