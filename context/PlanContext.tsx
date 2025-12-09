'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState
} from 'react';
import { UserPlanInfo } from '@/utils/userplan';

interface PlanContextType {
  planInfo: UserPlanInfo;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({
  planInfo,
  children
}: {
  planInfo: UserPlanInfo;
  children: ReactNode;
}) {
  const [currentPlanInfo, setCurrentPlanInfo] =
    useState<UserPlanInfo>(planInfo);

  // Keep local state in sync if server-provided planInfo changes
  useEffect(() => {
    setCurrentPlanInfo(planInfo);
  }, [planInfo]);

  const refreshPlanInfo = async () => {
    try {
      const response = await fetch('/api/current-user-plan', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) return; // fail silently
      const data = (await response.json()) as UserPlanInfo;
      setCurrentPlanInfo(data);
    } catch {
      // ignore network errors; UI will retry on next event/navigation
    }
  };

  // Fetch fresh plan on mount and whenever someone dispatches the revalidation event
  useEffect(() => {
    refreshPlanInfo();
    const handler = () => {
      refreshPlanInfo();
    };
    window.addEventListener('revalidateUserLimits', handler);
    return () => window.removeEventListener('revalidateUserLimits', handler);
  }, []);

  return (
    <PlanContext.Provider value={{ planInfo: currentPlanInfo }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx.planInfo;
}
