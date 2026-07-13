import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { eventAPI } from '../services/api';
import {
  getEventThemeStyle,
  resolveEventAssets,
  resolveEventCopy,
  resolveEventTheme,
} from '../utils/eventTheme';

const ActiveEventContext = createContext(null);

const FALLBACK_ACTIVE_EVENT = {
  event: null,
  loading: true,
  error: '',
  refetch: async () => {},
  theme: resolveEventTheme(null),
  copy: resolveEventCopy(null),
  assets: resolveEventAssets(null),
  themeStyle: getEventThemeStyle(null),
};

export function ActiveEventProvider({ children }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await eventAPI.getActive();
      setEvent(data.data ?? null);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setEvent(null);
        setError('');
      } else {
        setEvent(null);
        setError('Unable to load active event');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value = useMemo(() => {
    const theme = resolveEventTheme(event);
    const copy = resolveEventCopy(event);
    const assets = resolveEventAssets(event);
    const themeStyle = getEventThemeStyle(event);

    return {
      event,
      loading,
      error,
      refetch,
      theme,
      copy,
      assets,
      themeStyle,
    };
  }, [event, loading, error, refetch]);

  return (
    <ActiveEventContext.Provider value={value}>
      <div className="event-themed" style={value.themeStyle}>
        {children}
      </div>
    </ActiveEventContext.Provider>
  );
}

export function useActiveEvent() {
  const ctx = useContext(ActiveEventContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn('useActiveEvent called outside ActiveEventProvider — using fallback');
    }
    return FALLBACK_ACTIVE_EVENT;
  }
  return ctx;
}
