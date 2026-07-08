import { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client.js';
import { generateKeySet } from '../crypto/keys.js';
import {
  addKeySetToRing,
  getCurrentKeyPair,
  hasKeyring,
  saveSession,
  getStoredUser,
  clearSession,
  getToken,
} from '../crypto/keyStorage.js';
import { connectSocket, disconnectSocket } from '../api/socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());

  const register = useCallback(async ({ username, email, password }) => {
    const keySet = generateKeySet();
    const publicKeys = keySet.map((k) => k.publicKey);
    const { data } = await client.post('/auth/register', { username, email, password, publicKeys });
    const { token, user: newUser } = data.data;
    addKeySetToRing(newUser.id, keySet);
    saveSession(token, newUser);
    setUser(newUser);
    connectSocket();
    return newUser;
  }, []);

  // Every login rotates the whole 5-key pool: a fresh set is generated
  // client-side and submitted alongside the password, and if login
  // succeeds the server replaces the advertised keys with it. The previous
  // pool stays in the local keyring, so this device can still read history
  // sealed under it — only the publicly-advertised "current" keys move on.
  const login = useCallback(async ({ email, password }) => {
    const keySet = generateKeySet();
    const publicKeys = keySet.map((k) => k.publicKey);
    const { data } = await client.post('/auth/login', { email, password, publicKeys });
    const { token, user: loggedInUser } = data.data;
    addKeySetToRing(loggedInUser.id, keySet);
    saveSession(token, loggedInUser);
    setUser(loggedInUser);
    connectSocket();
    return loggedInUser;
  }, []);

  // Generates a fresh 5-key pool, adds it to the local keyring, and
  // publishes it to the server. Used both for the automatic 30-minute
  // rotation and to recover a missing keyring on a new/wiped device — in the
  // latter case, history encrypted under prior keys stays unreadable unless
  // this device already held those keys, which is the expected E2E tradeoff.
  const rotateKey = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const keySet = generateKeySet();
    const publicKeys = keySet.map((k) => k.publicKey);
    const { data } = await client.patch('/users/me/public-keys', { publicKeys });
    addKeySetToRing(user.id, keySet);
    saveSession(getToken(), data.data);
    setUser(data.data);
    return data.data;
  }, [user]);

  const logout = useCallback(() => {
    clearSession();
    disconnectSocket();
    setUser(null);
  }, []);

  const hasLocalKeyring = user ? hasKeyring(user.id) : false;
  const currentKeyPair = user ? getCurrentKeyPair(user.id) : null;

  return (
    <AuthContext.Provider value={{ user, register, login, logout, rotateKey, hasLocalKeyring, currentKeyPair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
