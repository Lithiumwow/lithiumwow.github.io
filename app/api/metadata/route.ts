import { NextRequest } from 'next/server';

const STREAM_URL = 'https://mscp4.live-streams.nl:8092/radio';
const TIMEOUT = 15000;

async function fetchWithTimeout(url: string, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function identifyWithShazam(audioBuffer: ArrayBuffer): Promise<string> {
  const apiKey = process.env.SHAZAM_API_KEY;
  
  if (!apiKey) {
    return 'Trance 24x7 Stream';
  }

  try {
    const response = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'shazam.p.rapidapi.com',
        'Content-Type': 'audio/mpeg',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      return 'Unable to identify track';
    }

    const responseText = await response.text();
    if (!responseText) {
      return 'Unknown Track';
    }

    const data = JSON.parse(responseText) as any;
    if (data.matches && data.matches.length > 0) {
      const match = data.matches[0];
      const artist = match.metadata?.artists?.[0]?.name || 'Unknown Artist';
      const song = match.metadata?.title || 'Unknown Song';
      return `${artist} - ${song}`;
    }

    return 'Unknown Track';
  } catch {
    return 'Unable to identify';
  }
}

async function getStreamSample(): Promise<ArrayBuffer> {
  try {
    const response = await fetchWithTimeout(STREAM_URL, TIMEOUT);

    if (!response.ok) {
      throw new Error(`Stream request failed with status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No readable stream');

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const targetBytes = 320000;

    try {
      while (totalBytes < targetBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalBytes += value.length;
      }
    } finally {
      reader.cancel();
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined.buffer;
  } catch {
    throw new Error('Failed to get stream sample');
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isUserActive = searchParams.get('active') === 'true';

    if (!isUserActive) {
      return Response.json({ track: 'Trance 24x7 Stream' });
    }

    const audioBuffer = await getStreamSample();
    const track = await identifyWithShazam(audioBuffer);
    
    return Response.json({ track });
  } catch {
    return Response.json(
      { track: 'Trance 24x7 Stream' },
      { status: 200 }
    );
  }
}
