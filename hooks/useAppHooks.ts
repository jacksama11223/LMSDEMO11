
import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext, GlobalStateContext } from '../contexts/AppProviders';
import type { ServiceStatus } from '../types';

export const useFeatureFlag = (flagName: string): boolean => {
  const { user } = useContext(AuthContext)!;
  const { featureFlags } = useContext(GlobalStateContext)!;

  const isEnabled = useMemo(() => {
    if (!user || !featureFlags || !featureFlags[flagName]) {
      return false;
    }
    const flag = featureFlags[flagName];
    switch (flag.status) {
      case 'ALL':
        return true;
      case 'OFF':
        return false;
      case 'SPECIFIC':
        const userList = flag.specificUsers.split(',').map(s => s.trim()).filter(Boolean);
        return userList.includes(user.id);
      default:
        return false;
    }
  }, [featureFlags, flagName, user]);

  return isEnabled;
};

export const useMockMetrics = (serviceStatus: ServiceStatus) => {
  const [metrics, setMetrics] = useState({
    cpu: 50 + (Math.random() - 0.5) * 20,
    memory: 60 + (Math.random() - 0.5) * 15,
    responseTime: 150 + (Math.random() - 0.5) * 50,
    errorRate: 0.5 + (Math.random() - 0.5) * 0.4,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      let cpuImpact = 0;
      let memImpact = 0;
      let rtImpact = 0;
      let errImpact = 0;

      Object.values(serviceStatus).forEach(status => {
        if (status === 'DEGRADED') {
          cpuImpact += 2;
          memImpact += 1;
          rtImpact += 10;
          errImpact += 0.1;
        } else if (status === 'CRITICAL') {
          cpuImpact += 6;
          memImpact += 4;
          rtImpact += 40;
          errImpact += 0.5;
        }
      });

      setMetrics({
        cpu: Math.max(10, Math.min(95, 50 + (Math.random() - 0.5) * 20 + cpuImpact)),
        memory: Math.max(20, Math.min(90, 60 + (Math.random() - 0.5) * 15 + memImpact)),
        responseTime: Math.max(50, 150 + (Math.random() - 0.5) * 50 + rtImpact),
        errorRate: Math.max(0.1, Math.min(15, 0.5 + (Math.random() - 0.5) * 0.4 + errImpact)),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [serviceStatus]);

  return metrics;
};
