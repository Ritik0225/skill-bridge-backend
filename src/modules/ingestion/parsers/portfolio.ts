import * as cheerio from "cheerio";
import { badRequest } from "../../../utils/errors.js";
import { assertPublicUrl } from "../../../utils/ssrf.js";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_CHARS = 2_000_000;
const MAX_REDIRECTS = 4;

/**
 * Fetch a user-supplied portfolio URL and return readable text.
 * SSRF-guarded: every hop is re-validated to be a public address, redirects are
 * followed manually (so an attacker can't redirect us to an internal host), and
 * the response is size- and time-capped.
 */
export async function fetchPortfolio(rawUrl: string): Promise<string> {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "SkillBridge/1.0", Accept: "text/html" },
      });
    } catch {
      throw badRequest("Could not reach the portfolio URL (timeout or network error).");
    } finally {
      clearTimeout(timer);
    }

    // Manual redirect handling — re-validate the target before following.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw badRequest("Portfolio URL returned a redirect without a location.");
      current = new URL(location, url).toString();
      continue;
    }

    if (!res.ok) throw badRequest(`Portfolio fetch failed (HTTP ${res.status}).`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      throw badRequest("Portfolio URL did not return an HTML page.");
    }

    const html = (await res.text()).slice(0, MAX_HTML_CHARS);
    const text = htmlToText(html);
    if (text.length < 20) {
      throw badRequest(
        "Couldn't extract readable content (the page may be JavaScript-only). Try a different URL.",
      );
    }
    return text;
  }

  throw badRequest("Too many redirects while fetching the portfolio URL.");
}

/** Strip scripts/styles and collapse whitespace to get the visible text. */
function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}
