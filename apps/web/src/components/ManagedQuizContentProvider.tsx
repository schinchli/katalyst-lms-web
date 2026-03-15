'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyManagedQuizContent, type ManagedQuizContent } from '@/lib/managedQuizContent';

const ManagedQuizContentContext = createContext(0);

export function useManagedQuizContentVersion() {
  return useContext(ManagedQuizContentContext);
}

export function ManagedQuizContentProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    fetch('/api/quiz-content')
      .then((response) => response.json() as Promise<{ content?: ManagedQuizContent }>)
      .then((body) => {
        if (!active) return;
        applyManagedQuizContent(body.content);
        setVersion((current) => current + 1);
      })
      .catch(() => {
        if (!active) return;
        setVersion((current) => current + 1);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => version, [version]);

  return (
    <ManagedQuizContentContext.Provider value={value}>
      {children}
    </ManagedQuizContentContext.Provider>
  );
}
