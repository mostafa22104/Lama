import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.lamma.owner.refresh-token';

/** The refresh token is long-lived: keep it in the Android Keystore, never in MMKV. */
export async function saveRefreshToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('refresh', token, { service: SERVICE });
}

export async function readRefreshToken(): Promise<string | null> {
  const entry = await Keychain.getGenericPassword({ service: SERVICE });
  return entry ? entry.password : null;
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
