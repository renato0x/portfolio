import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const clientId =
  process.env.SPOTIFY_CLIENT_ID ?? "e3ad677a16e34d838cd3275200d03557";
const callbackPort = 8888;
const redirectUri = `http://127.0.0.1:${callbackPort}/callback`;
const scopes = "user-read-currently-playing user-read-recently-played";
const verifier = randomBytes(64).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");
const state = randomBytes(24).toString("hex");
const authorizationUrl = new URL("https://accounts.spotify.com/authorize");

authorizationUrl.search = new URLSearchParams({
  response_type: "code",
  client_id: clientId,
  scope: scopes,
  redirect_uri: redirectUri,
  state,
  code_challenge_method: "S256",
  code_challenge: challenge,
}).toString();

function runVercel(args, input) {
  const command = process.platform === "win32" ? "vercel.cmd" : "vercel";
  const result = spawnSync(command, args, {
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || "Vercel CLI failed");
  }
  return result.stdout;
}

function updateLocalEnvironment(refreshToken) {
  const envPath = resolve(process.cwd(), ".env.local");
  let lines = [];
  try {
    lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  } catch {
    // Create the ignored local environment file on first connection.
  }

  const values = {
    SPOTIFY_CLIENT_ID: clientId,
    SPOTIFY_REFRESH_TOKEN: refreshToken,
  };
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    const index = lines.findIndex((existing) => existing.startsWith(`${name}=`));
    if (index >= 0) lines[index] = line;
    else lines.push(line);
  }
  writeFileSync(envPath, `${lines.filter(Boolean).join("\n")}\n`, { mode: 0o600 });
}

async function exchangeCode(code) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    }),
  });

  const payload = await response.json();
  if (!response.ok || typeof payload.refresh_token !== "string") {
    throw new Error(`Spotify token exchange failed (${response.status})`);
  }
  return payload.refresh_token;
}

function htmlPage(message) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Spotify connection</title><body style="margin:0;background:#080808;color:#eee;font:16px system-ui;display:grid;min-height:100vh;place-items:center"><p>${message}</p></body></html>`;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", redirectUri);
  if (url.pathname !== "/callback") {
    response.writeHead(404).end();
    return;
  }

  if (url.searchParams.get("state") !== state) {
    response.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    response.end(htmlPage("Authorization state did not match. Close this tab and retry."));
    server.close();
    process.exitCode = 1;
    return;
  }

  const code = url.searchParams.get("code");
  if (!code || url.searchParams.has("error")) {
    response.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    response.end(htmlPage("Spotify authorization was cancelled. You can close this tab."));
    server.close();
    process.exitCode = 1;
    return;
  }

  try {
    const refreshToken = await exchangeCode(code);
    updateLocalEnvironment(refreshToken);
    runVercel(
      ["env", "add", "SPOTIFY_CLIENT_ID", "production", "--value", clientId, "--force", "--yes"],
      undefined,
    );
    runVercel(
      ["env", "add", "SPOTIFY_REFRESH_TOKEN", "production", "--sensitive", "--force", "--yes"],
      `${refreshToken}\n`,
    );

    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    response.end(htmlPage("Spotify connected. Production credentials are saved; you can close this tab."));
    console.log("Spotify authorization succeeded. Production variables were saved securely.");
    console.log(runVercel(["deploy", "--prod", "--yes"], undefined));
  } catch (error) {
    response.writeHead(500, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    response.end(htmlPage("Spotify connection could not be completed. Check the terminal for details."));
    console.error(error instanceof Error ? error.message : "Spotify setup failed");
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.on("error", (error) => {
  console.error(`Could not start the local callback listener: ${error.message}`);
  process.exitCode = 1;
});

server.listen(callbackPort, "127.0.0.1", () => {
  console.log(`Listening for Spotify's secure callback at ${redirectUri}`);
  console.log("Open this URL to authorize the portfolio account:");
  console.log(authorizationUrl.toString());
});
