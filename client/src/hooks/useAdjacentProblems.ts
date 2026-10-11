"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axiosInstance";
import { isCancel } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AdjacentProblem {
  id: number;
  title: string;
}

interface AdjacentData {
  prev: AdjacentProblem | null;
  next: AdjacentProblem | null;
}

// Neighbours only change when a problem is added, so a short in-memory
// cache is plenty: it makes stepping back and forth between problems
// instant instead of re-hitting the API on every navigation.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: AdjacentData; at: number }>();

const readCache = (title: string): AdjacentData | null => {
  const entry = cache.get(title);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(title);
    return null;
  }
  return entry.data;
};

const fetchAdjacent = async (
  title: string,
  signal?: AbortSignal,
): Promise<AdjacentData> => {
  const response = await axios.get(`${API_URL}/problem/adjacent`, {
    params: { title },
    signal,
  });
  const { prev = null, next = null } = response.data.data ?? {};
  return { prev, next };
};

// Warms the cache for the problems the arrows lead to, so the NEXT click
// after navigating is also instant. Failures are irrelevant here.
const prefetch = (title: string | undefined) => {
  if (!title || readCache(title)) return;
  fetchAdjacent(title)
    .then((data) => cache.set(title, { data, at: Date.now() }))
    .catch(() => {});
};

/** Builds the same URL every other part of the app uses for a problem. */
export const getProblemDetailUrl = (title: string) =>
  `/problems/problem-detail?title=${encodeURIComponent(title)}&tab=description`;

/**
 * Previous / next problem (by problem id, across ALL problems) for the
 * problem identified by `title` - the title in the URL, so the answer is
 * available the moment the URL changes instead of after the problem
 * details finish loading.
 *
 * While the neighbours for the current title are not known yet
 * (`isLoading`) both are null, so the arrows can be disabled instead of
 * pointing at the previous problem's neighbours.
 */
export function useAdjacentProblems(title: string | null) {
  const [result, setResult] = useState<{
    forTitle: string;
    data: AdjacentData;
  } | null>(null);
  const [failedTitle, setFailedTitle] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!title) return;

    const cached = readCache(title);
    if (cached) {
      setResult({ forTitle: title, data: cached });
      prefetch(cached.prev?.title);
      prefetch(cached.next?.title);
      return;
    }

    const controller = new AbortController();
    fetchAdjacent(title, controller.signal)
      .then((data) => {
        cache.set(title, { data, at: Date.now() });
        setFailedTitle(null);
        setResult({ forTitle: title, data });
        prefetch(data.prev?.title);
        prefetch(data.next?.title);
      })
      .catch((error) => {
        if (isCancel(error)) return;
        setFailedTitle(title);
      });

    return () => controller.abort();
  }, [title, attempt]);

  // If the lookup failed because the connection dropped, try again as
  // soon as it comes back instead of leaving the arrows disabled.
  useEffect(() => {
    if (!failedTitle) return;
    const retry = () => {
      setFailedTitle(null);
      setAttempt((value) => value + 1);
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [failedTitle]);

  const isReady = !!title && result?.forTitle === title;

  return {
    prev: isReady ? result.data.prev : null,
    next: isReady ? result.data.next : null,
    isLoading: !!title && !isReady && failedTitle !== title,
  };
}
