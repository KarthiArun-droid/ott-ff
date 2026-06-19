export async function downloadEpisodeForOffline(
  hlsManifestUrl: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    console.log("Fetching manifest for offline caching:", hlsManifestUrl);
    const response = await fetch(hlsManifestUrl);
    if (!response.ok) throw new Error("Failed to retrieve HLS playlist");
    const manifestText = await response.text();

    const baseUrl = hlsManifestUrl.substring(0, hlsManifestUrl.lastIndexOf('/') + 1);
    const videoChunks = parseManifestSegments(manifestText, baseUrl);
    console.log(`Resolved ${videoChunks.length} segments to download locally.`);

    const storageCache = await caches.open('offline-videos-v1');

    // Cache the master playlist first
    await storageCache.put(hlsManifestUrl, new Response(manifestText, {
      headers: { 'Content-Type': 'application/x-mpegURL' }
    }));

    // Cache segment blocks sequentially with progress tracking
    let completed = 0;
    for (const chunk of videoChunks) {
      await storageCache.add(chunk);
      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / videoChunks.length) * 100));
      }
    }

    console.log("HLS video downloaded successfully to browser CacheStorage!");
    return true;
  } catch (err) {
    console.error("Offline download failed:", err);
    throw err;
  }
}

export async function isMovieCached(hlsManifestUrl: string): Promise<boolean> {
  try {
    const storageCache = await caches.open('offline-videos-v1');
    const match = await storageCache.match(hlsManifestUrl);
    return !!match;
  } catch (e) {
    return false;
  }
}

export async function deleteCachedMovie(hlsManifestUrl: string): Promise<boolean> {
  try {
    const response = await fetch(hlsManifestUrl);
    if (!response.ok) return false;
    const manifestText = await response.text();
    const baseUrl = hlsManifestUrl.substring(0, hlsManifestUrl.lastIndexOf('/') + 1);
    const videoChunks = parseManifestSegments(manifestText, baseUrl);

    const storageCache = await caches.open('offline-videos-v1');
    await storageCache.delete(hlsManifestUrl);
    for (const chunk of videoChunks) {
      await storageCache.delete(chunk);
    }
    return true;
  } catch (e) {
    return false;
  }
}

function parseManifestSegments(manifestText: string, baseUrl: string): string[] {
  const lines = manifestText.split('\n');
  const segments: string[] = [];
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#') || line === '') continue;
    if (!line.startsWith('http://') && !line.startsWith('https://')) {
      segments.push(new URL(line, baseUrl).toString());
    } else {
      segments.push(line);
    }
  }
  return segments;
}
