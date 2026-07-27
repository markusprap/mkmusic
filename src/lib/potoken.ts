import type { Innertube as InnertubeType } from 'youtubei.js';
import type { WebPoMinter as WebPoMinterType } from 'bgutils-js/webpo';

// jsdom is pinned to exactly 27.3.0 in package.json — 27.4.0+ pulls in
// html-encoding-sniffer@6, which requires the ESM-only @exodus/bytes.
//
// All of youtubei.js/bgutils-js/jsdom are dynamically imported (not static
// top-level imports) because Next.js's serverless runtime loads route
// modules via require(), and a static import here would force that same
// require() chain down through these packages' own ESM-only transitive
// dependencies too (e.g. cssstyle -> @asamuzakjp/css-color -> @csstools/
// css-calc, which ships ESM-only). Dynamic import() lets Node resolve each
// package correctly regardless of what format it — or its dependencies —
// ship in.
let cached: { innertube: InnertubeType; minter: WebPoMinterType } | null = null;

async function setup() {
  const { Innertube, Platform } = await import('youtubei.js');
  const { BotGuardClient } = await import('bgutils-js/botguard');
  const { WebPoMinter } = await import('bgutils-js/webpo');
  const { buildURL, getHeaders } = await import('bgutils-js/utils');
  const { JSDOM } = await import('jsdom');

  Platform.shim.eval = async (data: { output: string }) => new Function(data.output)();

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
