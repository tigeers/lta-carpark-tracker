import type { Request, Response } from 'express';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    ltaAccountKeyConfigured: boolean;
    nodeEnv: string;
  };
  endpoints: {
    health: string;
    carparkAvailability: string;
  };
  dataSource: {
    ltaDataMallUrl: string;
    dataGovSgUrl: string;
  };
}

/**
 * Serverless / Express health check handler
 * Checks service health, uptime, and whether LTA DataMall AccountKey is configured
 */
export default async function handler(req: Request | any, res: Response | any) {
  const hasAccountKey = Boolean(
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY
  );

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: {
      ltaAccountKeyConfigured: hasAccountKey,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    endpoints: {
      health: '/api/health',
      carparkAvailability: '/api/carparkavailability',
    },
    dataSource: {
      ltaDataMallUrl: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      dataGovSgUrl: 'https://api.data.gov.sg/v1/transport/carpark-availability',
    },
  };

  // If res has standard status/json methods
  if (typeof res.status === 'function') {
    return res.status(200).json(payload);
  }

  // Fallback for raw Node HTTP response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}
