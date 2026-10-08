import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SpotifyTrack = {
  name?: string;
  album?: { name?: string; images?: { url: string }[] };
  artists?: { name: string }[];
  external_urls?: { spotify?: string };
};

function toTrack(data: { item?: SpotifyTrack | null; is_playing?: boolean }) {
  const item = data.item;
  if (!item) return null;
  return {
    title: item.name || "Faixa desconhecida",
    artist: item.artists?.map((artist) => artist.name).join(", ") || "Artista desconhecido",
    album: item.album?.name || "",
    image: item.album?.images?.[0]?.url || null,
    url: item.external_urls?.spotify || "https://open.spotify.com/",
    isPlaying: Boolean(data.is_playing),
  };
}

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ configured: false, track: null }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return NextResponse.json({ configured: true, track: null }, { headers: { "Cache-Control": "no-store" } });
    const { access_token: accessToken } = await tokenResponse.json() as { access_token: string };
    const headers = { Authorization: `Bearer ${accessToken}` };

    const currentResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers, cache: "no-store" });
    if (currentResponse.ok) {
      const current = await currentResponse.json();
      if (current?.is_playing && current?.item) {
        return NextResponse.json({ configured: true, track: toTrack(current) }, { headers: { "Cache-Control": "no-store" } });
      }
    }

    const recentResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", { headers, cache: "no-store" });
    if (recentResponse.ok) {
      const recent = await recentResponse.json() as { items?: { track: SpotifyTrack }[] };
      return NextResponse.json({ configured: true, track: toTrack({ item: recent.items?.[0]?.track, is_playing: false }) }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ configured: true, track: null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ configured: true, track: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
