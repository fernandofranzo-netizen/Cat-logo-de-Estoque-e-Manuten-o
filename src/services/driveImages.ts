import { useState, useEffect } from 'react';

interface DriveImageResponse {
  found: boolean;
  fileId?: string;
  name?: string;
  mimeType?: string;
  imageUrl?: string;
  proxyUrl?: string;
  message?: string;
  error?: string;
}

// Memory cache for looked-up codes
const imageCache = new Map<string, string | null>();
const pendingPromises = new Map<string, Promise<string | null>>();

// Preloaded folder index map: normalized code -> direct image URL
let folderIndexLoaded = false;
let folderIndexPromise: Promise<Record<string, string>> | null = null;
const folderIndex: Record<string, string> = {};

/**
 * Normalizes an item code for index lookup (removes special chars, trims, uppercase)
 */
function normalizeCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Loads the bulk folder index if available, allowing immediate local matching
 */
export async function preloadDriveFolderIndex(): Promise<Record<string, string>> {
  if (folderIndexLoaded) return folderIndex;
  if (folderIndexPromise) return folderIndexPromise;

  folderIndexPromise = (async () => {
    try {
      const res = await fetch('/api/drive-folder-index');
      if (!res.ok) return folderIndex;
      const data = await res.json();
      if (data.available && data.images) {
        Object.entries(data.images).forEach(([key, val]: [string, any]) => {
          const directUrl = typeof val === 'string' ? val : val.imageUrl;
          folderIndex[normalizeCode(key)] = directUrl;
        });
        folderIndexLoaded = true;
      }
    } catch {
      // Ignored: fallback to per-item search
    }
    return folderIndex;
  })();

  return folderIndexPromise;
}

/**
 * Fetches the Google Drive image URL for a given item code
 */
export async function getDriveImageForCode(code: string): Promise<string | null> {
  const norm = normalizeCode(code);

  // 1. Check client memory cache
  if (imageCache.has(norm)) {
    return imageCache.get(norm) ?? null;
  }

  // 2. Check if already known from folder index
  if (folderIndex[norm]) {
    const url = folderIndex[norm];
    imageCache.set(norm, url);
    return url;
  }

  // Partial match from index (e.g. filename "AU-ANEIS-00001-00.jpg" matches "AU-ANEIS-00001-00")
  for (const [key, url] of Object.entries(folderIndex)) {
    if (key.includes(norm) || norm.includes(key)) {
      imageCache.set(norm, url);
      return url;
    }
  }

  // 3. Avoid duplicated concurrent network requests for the same code
  if (pendingPromises.has(norm)) {
    return pendingPromises.get(norm)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`/api/drive-image?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        imageCache.set(norm, null);
        return null;
      }
      const data: DriveImageResponse = await res.json();
      if (data.found && data.imageUrl) {
        imageCache.set(norm, data.imageUrl);
        return data.imageUrl;
      } else {
        imageCache.set(norm, null);
        return null;
      }
    } catch {
      imageCache.set(norm, null);
      return null;
    } finally {
      pendingPromises.delete(norm);
    }
  })();

  pendingPromises.set(norm, fetchPromise);
  return fetchPromise;
}

/**
 * React hook to load and observe a dynamic Drive image for an item code
 */
export function useDriveItemImage(codigo: string) {
  const norm = normalizeCode(codigo);
  const [imageUrl, setImageUrl] = useState<string | null>(() => imageCache.get(norm) || folderIndex[norm] || null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !imageCache.has(norm) && !folderIndex[norm]);

  useEffect(() => {
    let isMounted = true;
    const initialCached = imageCache.get(norm) || folderIndex[norm];

    if (initialCached) {
      setImageUrl(initialCached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getDriveImageForCode(codigo).then((url) => {
      if (isMounted) {
        setImageUrl(url);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [codigo, norm]);

  return { imageUrl, isLoading, hasDriveImage: Boolean(imageUrl) };
}
