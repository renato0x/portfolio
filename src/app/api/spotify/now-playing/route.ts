import { head, put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const storedTrackPath = "portfolio/spotify-last-track.json";

type SpotifyTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
};

type SpotifyTrackResponse = {
  is_playing?: boolean;
  item?: SpotifyItem | null;
};

type SpotifyItem = {
  name?: string;
  type?: string;
  artists?: Array<{ name?: string }>;
  album?: { images?: Array<{ url?: string }> };
};

type SpotifyRecentlyPlayedResponse = {
  items?: Array<{ track?: SpotifyItem | null }>;
};

type StoredTrack = {
  title: string;
  artist: string;
  cover: string;
};

type LanyardResponse = {
  data?: {
    listening_to_spotify?: boolean;
    spotify?: {
      song?: string;
      artist?: string;
      album_art_url?: string;
    } | null;
  };
};

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshToken = process.env.SPOTIFY_REFRESH_TOKEN ?? "";

const responseHeaders = {
  "Cache-Control": "public, s-maxage=5, must-revalidate",
};

async function getDiscordFallback() {
  try {
    const response = await fetch(
      "https://api.lanyard.rest/v1/users/726487228187934723",
      { cache: "no-store", signal: AbortSignal.timeout(2500) },
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as LanyardResponse;
    const presence = payload.data;
    const spotify = presence?.spotify;
    if (
      presence?.listening_to_spotify !== true ||
      typeof spotify?.song !== "string" ||
      typeof spotify.artist !== "string" ||
      typeof spotify.album_art_url !== "string" ||
      !spotify.album_art_url.startsWith("https://")
    ) {
      return null;
    }

    return {
      title: spotify.song,
      artist: spotify.artist,
      cover: spotify.album_art_url,
      source: "discord",
    };
  } catch {
    return null;
  }
}

function isStoredTrack(value: unknown): value is StoredTrack {
  if (typeof value !== "object" || value === null) return false;
  const track = value as Record<string, unknown>;
  return (
    typeof track.title === "string" &&
    typeof track.artist === "string" &&
    typeof track.cover === "string" &&
    track.cover.startsWith("https://")
  );
}

function blobIsConfigured() {
  return typeof process.env.BLOB_READ_WRITE_TOKEN === "string" && process.env.BLOB_READ_WRITE_TOKEN.length > 0;
}

async function getStoredTrack() {
  if (!blobIsConfigured()) return null;

  try {
    const blob = await head(storedTrackPath);
    const response = await fetch(blob.url, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    return isStoredTrack(payload) ? payload : null;
  } catch {
    return null;
  }
}

async function saveTrack(track: StoredTrack) {
  if (!blobIsConfigured()) return;

  try {
    await put(storedTrackPath, JSON.stringify(track), {
      access: "public",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json; charset=utf-8",
    });
  } catch {
    // A storage outage must not hide the live Spotify result.
  }
}

async function storedOrNoContent() {
  const storedTrack = await getStoredTrack();
  if (storedTrack) {
    return Response.json({ ...storedTrack, source: "stored" }, { headers: responseHeaders });
  }
  return noContent();
}

async function fallbackOrNoContent() {
  const discordTrack = await getDiscordFallback();
  if (discordTrack) return Response.json(discordTrack, { headers: responseHeaders });
  return storedOrNoContent();
}

function trackPayload(item: SpotifyItem | null | undefined, source: "spotify" | "recent") {
  const artists = item?.artists
    ?.map((artist) => artist.name)
    .filter((artist): artist is string => typeof artist === "string");
  const cover = item?.album?.images?.find(
    (image) => typeof image.url === "string" && image.url.startsWith("https://"),
  )?.url;

  if (item?.type !== "track" || typeof item.name !== "string" || !artists?.length || typeof cover !== "string") {
    return null;
  }

  return { title: item.name, artist: artists.join(", "), cover, source };
}

async function recentOrFallback(token: string) {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.ok) {
      const payload = (await response.json()) as SpotifyRecentlyPlayedResponse;
      const recentTrack = trackPayload(payload.items?.[0]?.track, "recent");
      if (recentTrack) {
        await saveTrack(recentTrack);
        return Response.json(recentTrack, { headers: responseHeaders });
      }
    }
  } catch {
    // Try Discord presence if Spotify's recent history is unavailable.
  }

  const discordTrack = await getDiscordFallback();
  if (discordTrack) return Response.json(discordTrack, { headers: responseHeaders });

  return storedOrNoContent();
}

async function getAccessToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && accessToken && Date.now() < accessTokenExpiresAt - 60_000) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId || !refreshToken) return null;

  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) return null;

    const tokenData = (await tokenResponse.json()) as SpotifyTokenResponse;
    if (typeof tokenData.access_token !== "string") return null;

    accessToken = tokenData.access_token;
    accessTokenExpiresAt = Date.now() + (tokenData.expires_in ?? 3600) * 1000;
    if (typeof tokenData.refresh_token === "string") {
      refreshToken = tokenData.refresh_token;
    }

    return accessToken;
  } catch {
    return null;
  }
}

function noContent() {
  return new Response(null, { status: 204, headers: responseHeaders });
}

export async function GET() {
  if (!process.env.SPOTIFY_CLIENT_ID || !refreshToken) {
    return fallbackOrNoContent();
  }

  let token = await getAccessToken();
  if (!token) {
    return fallbackOrNoContent();
  }

  let playbackResponse: Response;
  try {
    playbackResponse = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (playbackResponse.status === 401) {
      accessToken = null;
      token = (await getAccessToken(true)) ?? "";
      if (!token) {
        return fallbackOrNoContent();
      }
      playbackResponse = await fetch(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
    }
  } catch {
    return fallbackOrNoContent();
  }

  if (playbackResponse.status === 204) return recentOrFallback(token);
  if (!playbackResponse.ok) return fallbackOrNoContent();

  let playback: SpotifyTrackResponse;
  try {
    playback = (await playbackResponse.json()) as SpotifyTrackResponse;
  } catch {
    return recentOrFallback(token);
  }

  if (playback.is_playing === true) {
    const currentTrack = trackPayload(playback.item, "spotify");
    if (currentTrack) {
      await saveTrack(currentTrack);
      return Response.json(currentTrack, { headers: responseHeaders });
    }
  }

  return recentOrFallback(token);
}
