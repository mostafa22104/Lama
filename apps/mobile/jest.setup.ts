/* Native modules have no JS implementation under Jest; replace them with in-memory fakes. */
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const data = new Map<string, string | number | boolean>();
    return {
      set: (key: string, value: string | number | boolean) => data.set(key, value),
      getString: (key: string) => {
        const value = data.get(key);
        return typeof value === 'string' ? value : undefined;
      },
      contains: (key: string) => data.has(key),
      remove: (key: string) => data.delete(key),
      clearAll: () => data.clear(),
    };
  },
}));

jest.mock('react-native-keychain', () => {
  let stored: false | { username: string; password: string } = false;
  return {
    setGenericPassword: jest.fn(async (username: string, password: string) => {
      stored = { username, password };
      return { service: 'test', storage: 'test' };
    }),
    getGenericPassword: jest.fn(async () => stored),
    resetGenericPassword: jest.fn(async () => {
      stored = false;
      return true;
    }),
  };
});

jest.mock('react-native-restart', () => ({ __esModule: true, default: { restart: jest.fn() } }));

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
