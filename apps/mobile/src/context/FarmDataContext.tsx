import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as api from '../api';

type Status = 'loading' | 'ready' | 'error';

type FarmDataValue = {
  data: api.FarmData | null;
  status: Status;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
};

const FarmDataContext = createContext<FarmDataValue | null>(null);

export function FarmDataProvider({children}: {children: React.ReactNode}) {
  const [data, setData] = useState<api.FarmData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setStatus('loading');
    }
    try {
      const next = await api.loadFarmData();
      setData(next);
      setStatus('ready');
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      if (mode !== 'refresh') {
        setStatus('error');
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const reload = useCallback(() => load('initial'), [load]);

  const value = useMemo<FarmDataValue>(
    () => ({data, status, error, refreshing, refresh, reload}),
    [data, status, error, refreshing, refresh, reload],
  );

  return (
    <FarmDataContext.Provider value={value}>
      {children}
    </FarmDataContext.Provider>
  );
}

export function useFarmData() {
  const ctx = useContext(FarmDataContext);
  if (!ctx) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return ctx;
}
