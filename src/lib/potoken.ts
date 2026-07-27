import { Innertube, Platform } from 'youtubei.js';
import { BotGuardClient } from 'bgutils-js/botguard';
import { WebPoMinter } from 'bgutils-js/webpo';
import { buildURL, getHeaders } from 'bgutils-js/utils';
// jsdom is pinned to exactly 27.3.0 in package.json — 27.4.0+ pulls in
// html-encoding-sniffer@6, which requires the ESM-only @exodus/bytes via
// require(), breaking on Vercel's serverless runtime (ERR_REQUIRE_ESM).
import { JSDOM } from 'jsdom';

Platform.shim.eval = async (data: { output: string }) => new Function(data.output)();

// ponytail: sets globals once per warm serverless instance so BotGuard's
// challenge script (which expects a browser) can run. Known ceiling: this
// mutates the shared Node process's globalThis — if other server code in the
// same warm instance starts checking `typeof window` and misbehaves, split
// this into an isolated service instead of sharing the process.
let cached: { innertube: Innertube; minter: WebPoMinter } | null = null;

async function setup() {
  const innertube = await Innertube.create({ generate_session_locally: true });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'https://www.youtube.com/',
    referrer: 'https://www.youtube.com/',
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    location: dom.window.location,
    origin: dom.window.origin,
  });
  if (!Reflect.has(globalThis, 'navigator')) {
    Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator });
  }

  const challengeResponse = await innertube.getAttestationChallenge('ENGAGEMENT_TYPE_UNBOUND');
  if (!challengeResponse.bg_challenge) throw new Error('Tidak bisa mengambil BotGuard challenge');

  const interpreterUrl = challengeResponse.bg_challenge.interpreter_url
    .private_do_not_access_or_else_trusted_resource_url_wrapped_value;
  const interpreterJavascript = await (await fetch(`https:${interpreterUrl}`)).text();
  if (!interpreterJavascript) throw new Error('Tidak bisa memuat VM BotGuard');
  new Function(interpreterJavascript)();

  const botGuardClient = await BotGuardClient.create({
    program: challengeResponse.bg_challenge.program,
    globalName: challengeResponse.bg_challenge.global_name,
    globalObject: globalThis,
  });

  // Fixed public request key used by YouTube's own web client (per bgutils-js docs).
  const requestKey = 'O43z0dpjhgX20SCx4KAo';
  const webPoSignalOutput: any[] = [];
  const botguardResponse = await botGuardClient.snapshot({ webPoSignalOutput });

  const integrityTokenResponse = await fetch(buildURL('GenerateIT', false), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify([requestKey, botguardResponse]),
  });
  const [integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken] =
    await integrityTokenResponse.json();

  const minter = await WebPoMinter.create(
    { integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken },
    webPoSignalOutput
  );

  return { innertube, minter };
}

export async function getAudioUrl(videoId: string): Promise<string> {
  if (!cached) cached = await setup();
  const { innertube, minter } = cached;

  const poToken = await minter.mintAsWebsafeString(videoId);
  const info = await innertube.getBasicInfo(videoId, { client: 'MWEB' });
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  const url = await format.decipher(innertube.session.player);
  return `${url}&pot=${poToken}`;
}
