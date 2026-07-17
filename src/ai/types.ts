export interface AIGenerateInput {
  /** System instruction (authoritative — never built from untrusted user data). */
  system: string;
  /** User payload (may contain untrusted ingested text — treated as data, not instructions). */
  user: string;
}

/**
 * A pluggable AI backend. Implementations wrap a single provider's SDK and
 * return the model's raw text response (expected to be JSON).
 */
export interface AIProvider {
  readonly name: string;
  /** True when the provider has the credentials it needs (e.g. an API key). */
  isConfigured(): boolean;
  /** Ask the model for a JSON response. May throw on transport / quota errors. */
  generateJSON(input: AIGenerateInput): Promise<string>;
}
