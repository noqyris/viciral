"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Shared credit balance for the studio shell. The nav shows it; runners call
 * {@link notifyCreditsChanged} after a generation so the badge refetches. A
 * window event (not prop drilling) decouples the runners from the provider.
 */

interface CreditsState {
  balance: number | null;
  loading: boolean;
  refresh: () => void;
}

const CreditsCtx = createContext<CreditsState>({
  balance: null,
  loading: false,
  refresh: () => {},
});

const CREDITS_EVENT = "viciral:credits-changed";

/** Ask the studio shell to refetch the credit balance (call after a run). */
export function notifyCreditsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CREDITS_EVENT));
  }
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch without flipping `loading` synchronously — safe to call from an effect
  // body (setState happens only in the async then/finally callbacks).
  const fetchBalance = useCallback(() => {
    return fetch("/api/credits")
      .then((r) => r.json())
      .then((d: { balance?: number }) =>
        setBalance(typeof d.balance === "number" ? d.balance : null),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Exposed to consumers / event handlers, where a synchronous loading flip is fine.
  const refresh = useCallback(() => {
    setLoading(true);
    void fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    void fetchBalance();
    const onChange = () => refresh();
    window.addEventListener(CREDITS_EVENT, onChange);
    return () => window.removeEventListener(CREDITS_EVENT, onChange);
  }, [fetchBalance, refresh]);

  return (
    <CreditsCtx.Provider value={{ balance, loading, refresh }}>
      {children}
    </CreditsCtx.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsCtx);
}
