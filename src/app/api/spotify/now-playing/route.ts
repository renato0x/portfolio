export const dynamic = "force-dynamic";
export const revalidate = 0;

type SpotifyTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
};

type SpotifyTrackResponse = {
  is_playing?: boolean;
  item?: {
    name?: string;
    type?: string;
    artists?: Array<{ name?: string }>;
    album?: { images?: Array<{ url?: string }> };
  } | null;
};

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshToken = process.env.SPOTIFY_REFRESH_TOKEN ?? "";

const responseHeaders = {
  "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
};

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
    return Response.json(
      { error: "spotify_not_connected" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let token = await getAccessToken();
  if (!token) {
    return Response.json(
      { error: "spotify_auth_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
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
        return Response.json(
          { error: "spotify_auth_unavailable" },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
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
    return Response.json(
      { error: "spotify_unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (playbackResponse.status === 204) return noContent();
  if (!playbackResponse.ok) {
    return Response.json(
      { error: "spotify_unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  let playback: SpotifyTrackResponse;
  try {
    playback = (await playbackResponse.json()) as SpotifyTrackResponse;
  } catch {
    return noContent();
  }

  const item = playback.item;
  const artists = item?.artists
    ?.map((artist) => artist.name)
    .filter((artist): artist is string => typeof artist === "string");
  const cover = item?.album?.images?.find(
    (image) => typeof image.url === "string" && image.url.startsWith("https://"),
  )?.url;

  if (
    playback.is_playing !== true ||
    item?.type !== "track" ||
    typeof item.name !== "string" ||
    !artists?.length ||
    typeof cover !== "string"
  ) {
    return noContent();
  }

  return Response.json(
    { title: item.name, artist: artists.join(", "), cover },
    { headers: responseHeaders },
  );
}
