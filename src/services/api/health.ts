import axios from 'axios';
import { apiClient } from './client';

export interface HealthCheckResult {
  serverReachable: boolean;
  serverUrl: string;
  message: string;
  databaseConnected?: boolean;
  latencyMs?: number;
}

/**
 * Health check utility to verify communication between the Android app runtime
 * and the Express backend.
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const rootUrl = process.env.EXPO_PUBLIC_BACKEND_ORIGIN || 'http://10.0.2.2:4000';
  const startTime = Date.now();

  try {
    // 1. Check root Express server status
    const rootRes = await axios.get(rootUrl, { timeout: 5000 });
    const latency = Date.now() - startTime;

    // 2. Check database / API status via public categories endpoint
    let dbConnected = false;
    try {
      const apiRes = await apiClient.get('/category/list', { timeout: 5000 });
      if (apiRes.data && apiRes.data.success !== false) {
        dbConnected = true;
      }
    } catch {
      dbConnected = false;
    }

    return {
      serverReachable: true,
      serverUrl: rootUrl,
      message: typeof rootRes.data === 'string' ? rootRes.data : 'Server reachable',
      databaseConnected: dbConnected,
      latencyMs: latency,
    };
  } catch (error: any) {
    return {
      serverReachable: false,
      serverUrl: rootUrl,
      message: error?.message || 'Cannot reach Express backend',
      databaseConnected: false,
      latencyMs: Date.now() - startTime,
    };
  }
}
