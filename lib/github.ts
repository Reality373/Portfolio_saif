'use client';

import { useState, useEffect } from 'react';

export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

export interface GitHubData {
  username: string;
  name: string;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  totalContributions: number;
  totalAllTime?: number;
  currentStreak?: number;
  maxStreak: number;
  contributions: ContributionDay[];
}

const CACHE_KEY = 'saif_github_live_cache_v3';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes client cache

// Module-level in-memory singleton cache
let memoryCache: GitHubData | null = null;
let inFlightPromise: Promise<GitHubData | null> | null = null;
const subscribers = new Set<(data: GitHubData) => void>();

function getStorageCache(): GitHubData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
      return parsed.data as GitHubData;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

function setStorageCache(data: GitHubData) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetch GitHub data exactly once on webpage load and cache in memory + sessionStorage.
 * All subsequent calls reuse the cached promise/data with zero network requests.
 */
export async function getOrFetchGitHubData(): Promise<GitHubData | null> {
  // 1. Return in-memory cache if already loaded
  if (memoryCache) {
    return memoryCache;
  }

  // 2. Return sessionStorage cache if available
  const stored = getStorageCache();
  if (stored) {
    memoryCache = stored;
    return stored;
  }

  // 3. Return ongoing in-flight promise if a request is already executing
  if (inFlightPromise) {
    return inFlightPromise;
  }

  // 4. Dispatch single network fetch
  inFlightPromise = (async () => {
    try {
      // Fetch internal API route
      const res = await fetch('/api/github');
      if (res.ok) {
        const json = await res.json();
        if (json && json.contributions && json.contributions.length > 0) {
          memoryCache = json;
          setStorageCache(json);
          subscribers.forEach((cb) => cb(json));
          return json;
        }
      }

      // Public fallback if route fails
      const fallbackRes = await fetch(
        'https://github-contributions-api.jogruber.de/v4/Reality373?y=last'
      );
      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        const list: ContributionDay[] = fallbackJson.contributions || [];
        const total =
          fallbackJson.total?.lastYear ||
          list.reduce((acc, c) => acc + (c.count || 0), 0);

        const data: GitHubData = {
          username: 'Reality373',
          name: 'Saif Shikalgar',
          avatarUrl: 'https://avatars.githubusercontent.com/u/86972716?v=4',
          publicRepos: 23,
          followers: 7,
          totalContributions: total || 531,
          totalAllTime: 612,
          currentStreak: 3,
          maxStreak: 14,
          contributions: list.slice(-168),
        };

        memoryCache = data;
        setStorageCache(data);
        subscribers.forEach((cb) => cb(data));
        return data;
      }
    } catch (err) {
      console.error('Error in initial GitHub data load:', err);
    } finally {
      inFlightPromise = null;
    }

    return null;
  })();

  return inFlightPromise;
}

/**
 * Custom React Hook for components to access cached GitHub data.
 * Reuses the single cached object across the entire application.
 */
export function useGitHubData() {
  const [data, setData] = useState<GitHubData | null>(() => memoryCache || getStorageCache());
  const [loading, setLoading] = useState<boolean>(!memoryCache && !getStorageCache());

  useEffect(() => {
    let isMounted = true;

    // Check if cache already exists
    if (memoryCache) {
      setData(memoryCache);
      setLoading(false);
      return;
    }

    const stored = getStorageCache();
    if (stored) {
      memoryCache = stored;
      setData(stored);
      setLoading(false);
      return;
    }

    // Subscribe to updates if a fetch is in-flight or pending
    const handleData = (newData: GitHubData) => {
      if (isMounted) {
        setData(newData);
        setLoading(false);
      }
    };
    subscribers.add(handleData);

    // Trigger initial page-load fetch once
    getOrFetchGitHubData().then((res) => {
      if (isMounted && res) {
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscribers.delete(handleData);
    };
  }, []);

  return { data, loading };
}
