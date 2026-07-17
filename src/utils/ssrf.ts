import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { badRequest, forbidden } from "./errors.js";

/**
 * SSRF defense. When we fetch a *user-supplied* URL (the portfolio source), an
 * attacker could point it at internal infrastructure (127.0.0.1, the cloud
 * metadata endpoint 169.254.169.254, private 10.x hosts, ...). These helpers
 * ensure we only ever fetch **public** addresses.
 */

/** True only for globally-routable public unicast addresses (IPv4 or IPv6). */
export function isPublicAddress(ip: string): boolean {
  try {
    let addr = ipaddr.parse(ip);
    // Unwrap IPv4-mapped IPv6 (::ffff:127.0.0.1) so we classify the real v4 address.
    if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
      addr = (addr as ipaddr.IPv6).toIPv4Address();
    }
    // ipaddr.js labels normal public addresses "unicast"; everything else
    // (private, loopback, linkLocal, uniqueLocal, reserved, ...) is unsafe.
    return addr.range() === "unicast";
  } catch {
    return false;
  }
}

/**
 * Validate a URL is safe to fetch: http(s) only, and every resolved IP is public.
 * Returns the parsed URL. Throws a 400 for malformed input, 403 for private targets.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw badRequest("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw badRequest("Only http(s) URLs are allowed");
  }

  const resolved = await lookup(url.hostname, { all: true }).catch(() => []);
  if (resolved.length === 0) {
    throw badRequest("Could not resolve host");
  }
  for (const { address } of resolved) {
    if (!isPublicAddress(address)) {
      throw forbidden("Refusing to fetch a private or internal address");
    }
  }

  return url;
}
