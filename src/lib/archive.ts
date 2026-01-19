/**
 * Internet Archive (archive.org) API module
 * Provides functions to save URLs to the Wayback Machine and check archive status
 */

// Environment variable validation
const getArchiveCredentials = () => {
  const accessKey = process.env.ARCHIVE_ORG_ACCESS_KEY;
  const secretKey = process.env.ARCHIVE_ORG_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error(
      'Missing archive.org credentials. Set ARCHIVE_ORG_ACCESS_KEY and ARCHIVE_ORG_SECRET_KEY environment variables.'
    );
  }

  return { accessKey, secretKey };
};

// Type definitions
export interface ArchiveSaveResult {
  status: 'success' | 'pending' | 'error';
  job_id?: string;
  timestamp?: string;
  archive_url?: string;
  error?: string;
}

export interface ArchiveStatusResult {
  status: 'pending' | 'success' | 'error';
  timestamp?: string;
  archive_url?: string;
  error?: string;
}

export interface WaybackAvailability {
  available: boolean;
  url?: string;
  timestamp?: string;
}

const FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Save a URL to the Wayback Machine using SPN2 API
 * @param url The URL to archive
 * @returns Archive save result with job_id for status tracking
 */
export async function saveToArchive(url: string): Promise<ArchiveSaveResult> {
  try {
    const { accessKey, secretKey } = getArchiveCredentials();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const formData = new URLSearchParams();
    formData.append('url', url);
    formData.append('capture_all', '1');
    formData.append('skip_first_archive', '1');

    const response = await fetch('https://web.archive.org/save', {
      method: 'POST',
      headers: {
        Authorization: `LOW ${accessKey}:${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: 'error',
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    if (data.status === 'error') {
      return {
        status: 'error',
        error: data.message || data.exception || 'Unknown error',
      };
    }

    // Success or pending
    const result: ArchiveSaveResult = {
      status: data.status === 'success' ? 'success' : 'pending',
      job_id: data.job_id,
    };

    if (data.timestamp) {
      result.timestamp = data.timestamp;
      result.archive_url = `https://web.archive.org/web/${data.timestamp}/${url}`;
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'error',
        error: 'Request timeout',
      };
    }
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check the status of an archive job
 * @param jobId The job ID returned from saveToArchive
 * @returns Current status of the archive job
 */
export async function checkArchiveStatus(
  jobId: string
): Promise<ArchiveStatusResult> {
  try {
    const { accessKey, secretKey } = getArchiveCredentials();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(
      `https://web.archive.org/save/status/${jobId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `LOW ${accessKey}:${secretKey}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: 'error',
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    if (data.status === 'error') {
      return {
        status: 'error',
        error: data.message || data.exception || 'Unknown error',
      };
    }

    const result: ArchiveStatusResult = {
      status: data.status === 'success' ? 'success' : 'pending',
    };

    if (data.timestamp) {
      result.timestamp = data.timestamp;
      if (data.original_url) {
        result.archive_url = `https://web.archive.org/web/${data.timestamp}/${data.original_url}`;
      }
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'error',
        error: 'Request timeout',
      };
    }
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a URL is already archived in the Wayback Machine
 * @param url The URL to check
 * @returns Availability information including the archived URL if available
 */
export async function checkWaybackAvailability(
  url: string
): Promise<WaybackAvailability> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { available: false };
    }

    const data = await response.json();

    if (
      data.archived_snapshots?.closest?.available
    ) {
      return {
        available: true,
        url: data.archived_snapshots.closest.url,
        timestamp: data.archived_snapshots.closest.timestamp,
      };
    }

    return { available: false };
  } catch {
    return { available: false };
  }
}

/**
 * Generate a Wayback Machine URL for a given original URL
 * @param originalUrl The original URL
 * @param timestamp Optional timestamp (YYYYMMDDHHmmss format), uses latest if not provided
 * @returns The Wayback Machine URL
 */
export function getWaybackUrl(originalUrl: string, timestamp?: string): string {
  if (timestamp) {
    return `https://web.archive.org/web/${timestamp}/${originalUrl}`;
  }
  // Without timestamp, Wayback Machine redirects to the latest snapshot
  return `https://web.archive.org/web/${originalUrl}`;
}
