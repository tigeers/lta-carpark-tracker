import type { Request, Response } from 'express';

export interface LTACarparkRecord {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // format "lat lng", e.g. "1.2934 103.8572"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'M';
  Agency: 'LTA' | 'HDB' | 'URA';
}

export interface LTAResponse {
  'odata.metadata'?: string;
  value: LTACarparkRecord[];
}

// In-memory 30-second cache to prevent burning LTA DataMall rate limits
let cache: {
  timestamp: number;
  data: any;
} | null = null;

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const LTA_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

/**
 * Serverless / Express handler for LTA CarParkAvailabilityv2 API
 * Endpoint: /api/carparkavailability
 */
export default async function handler(req: Request | any, res: Response | any) {
  // Set CORS headers
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  // Retrieve AccountKey from environment or optionally request header
  const accountKey =
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    req.headers?.['accountkey'] ||
    req.headers?.['x-account-key'];

  // Check if AccountKey is configured
  if (!accountKey) {
    const fallbackResponse = {
      status: 'key_not_configured',
      message:
        'LTA_DATAMALL_ACCOUNT_KEY is not configured. Set LTA_DATAMALL_ACCOUNT_KEY in your environment or .env file to enable live LTA DataMall fetching.',
      accountKeyConfigured: false,
      targetEndpoint: LTA_ENDPOINT,
      requiredHeader: 'AccountKey',
      timestamp: new Date().toISOString(),
      instructions: [
        '1. Obtain an API AccountKey from https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html',
        '2. Add LTA_DATAMALL_ACCOUNT_KEY="your_key_here" in .env or your deployment environment variables.',
        '3. Restart server and call /api/carparkavailability.',
      ],
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(fallbackResponse);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(fallbackResponse));
  }

  // Check cache
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    const cachedData = {
      ...cache.data,
      cached: true,
      cacheAgeSeconds: Math.floor((now - cache.timestamp) / 1000),
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(cachedData);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(cachedData));
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Fetch from LTA DataMall
    const ltaRes = await fetch(LTA_ENDPOINT, {
      method: 'GET',
      headers: {
        AccountKey: String(accountKey).trim(),
        accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!ltaRes.ok) {
      const errText = await ltaRes.text();
      const errorPayload = {
        status: 'lta_error',
        statusCode: ltaRes.status,
        statusText: ltaRes.statusText,
        message:
          ltaRes.status === 401 || ltaRes.status === 403
            ? 'LTA rejected the provided AccountKey. Please verify your AccountKey.'
            : 'LTA DataMall service returned an error.',
        rawError: errText.slice(0, 300),
        targetEndpoint: LTA_ENDPOINT,
        timestamp: new Date().toISOString(),
      };

      if (typeof res.status === 'function') {
        return res.status(ltaRes.status === 401 ? 401 : 502).json(errorPayload);
      }
      res.writeHead(ltaRes.status === 401 ? 401 : 502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errorPayload));
    }

    const json: LTAResponse = await ltaRes.json();
    const records = json.value || [];

    const responsePayload = {
      status: 'success',
      accountKeyConfigured: true,
      timestamp: new Date().toISOString(),
      totalRecords: records.length,
      source: 'LTA DataMall CarParkAvailabilityv2',
      value: records,
    };

    // Store in cache
    cache = {
      timestamp: now,
      data: responsePayload,
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(responsePayload);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(responsePayload));
  } catch (error: any) {
    const errorPayload = {
      status: 'fetch_failed',
      message: error.name === 'AbortError' ? 'LTA DataMall request timed out' : error.message,
      targetEndpoint: LTA_ENDPOINT,
      timestamp: new Date().toISOString(),
    };

    if (typeof res.status === 'function') {
      return res.status(504).json(errorPayload);
    }
    res.writeHead(504, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(errorPayload));
  }
}
