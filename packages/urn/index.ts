/**
 * RFC8141 Uniform Resource Name
 * @see https://www.rfc-editor.org/rfc/rfc8141
 */
export interface URN<NID, NSS, R, Q, F> {
  /** Namespace identifier */
  readonly nid: NID
  /** Namespace-specific part */
  readonly nss: NSS
  /** r-component */
  readonly r: R
  /** q-component */
  readonly q: Q
  /** f-component */
  readonly f: F
}

/**
 * Attempt to parse a string to a URN
 * Note that {@link parse} and {@link unparse} are inverses for valid URN strings.
 * @returns URN when `s` represents a valid URN, undefined otherwise
 */
export const parse = <S extends string>(s: S): ParseURN<S> => {
  const m = rfc8141.exec(s)
  if (!m) return undefined as ParseURN<S>

  const [, nid, nss, , r, , q, , f] = m
  return { nid, nss, r, q, f } as ParseURN<S>
}

// From: https://github.com/mtiller/urns
// Many thanks!
export const rfc8141 =
  /^urn:([a-z0-9][a-z0-9-]{1,31}):((?:[-a-z0-9()+,.:=@;$_!*'&~/]|%[0-9a-f]{2})+)(?:(\?\+)((?:(?!\?=)(?:[-a-z0-9()+,.:=@;$_!*'&~/?]|%[0-9a-f]{2}))*))?(?:(\?=)((?:(?!#).)*))?(?:(#)((?:[-a-z0-9()+,.:=@;$_!*'&~/?]|%[0-9a-f]{2})*))?$/i

export type URNScheme = 'urn' | 'URN' | 'Urn' | 'uRn' | 'urN' | 'URn' | 'UrN' | 'uRN'

// prettier-ignore
export type ParseURN<S extends string> =
  S extends `${URNScheme}:${infer NID}:${infer NSS}?+${infer R}?=${infer Q}#${infer F}` ? URN<NID, NSS, R, Q, F>
  : S extends `${URNScheme}:${infer NID}:${infer NSS}?+${infer R}?=${infer Q}` ? URN<NID, NSS, R, Q, undefined>
  : S extends `${URNScheme}:${infer NID}:${infer NSS}?+${infer R}#${infer F}` ? URN<NID, NSS, R, undefined, F>
  : S extends `${URNScheme}:${infer NID}:${infer NSS}?=${infer Q}#${infer F}` ? URN<NID, NSS, undefined, Q, F>
  : S extends `${URNScheme}:${infer NID}:${infer NSS}?+${infer R}` ? URN<NID, NSS, R, undefined, undefined>
  : S extends `${URNScheme}:${infer NID}:${infer NSS}?=${infer Q}` ? URN<NID, NSS, undefined, Q, undefined>
  : S extends `${URNScheme}:${infer NID}:${infer NSS}#${infer F}` ? URN<NID, NSS, undefined, undefined, F>
  : S extends `${URNScheme}:${infer NID}:${infer NSS}` ? URN<NID, NSS, undefined, undefined, undefined>
  : URN<string, string, string | undefined, string | undefined, string | undefined> | undefined

// prettier-ignore
/**
 * Unparse a URN to a valid string representation.
 * Note that {@link parse} and {@link unparse} are inverses for valid URN strings.
 * @returns valid string representation of the provided URN
 */
export const unparse = <U extends URN<string, string, string | undefined, string | undefined, string | undefined>>({ nid, nss, r, q, f }: U): UnparseURN<U> =>
  `urn:${nid}:${nss}${r ? `?+${r}` : ''}${q ? `?=${q}` : ''}${f ? `#${f}` : ''}` as UnparseURN<U>

// prettier-ignore
export type UnparseURN<U extends URN<string, string, string | undefined, string | undefined, string | undefined>> =
  U extends URN<infer NID extends string, infer NSS extends string, infer R extends string, infer Q extends string, infer F extends string> ? `urn:${NID}:${NSS}?+${R}?=${Q}#${F}`
  : U extends URN<infer NID extends string, infer NSS extends string, infer R extends string, infer Q extends string, undefined> ? `urn:${NID}:${NSS}?+${R}?=${Q}`
  : U extends URN<infer NID extends string, infer NSS extends string, infer R extends string, undefined, infer F extends string> ? `urn:${NID}:${NSS}?+${R}#${F}`
  : U extends URN<infer NID extends string, infer NSS extends string, undefined, infer Q extends string, infer F extends string> ? `urn:${NID}:${NSS}?=${Q}#${F}`
  : U extends URN<infer NID extends string, infer NSS extends string, infer R extends string, undefined, undefined> ? `urn:${NID}:${NSS}?+${R}`
  : U extends URN<infer NID extends string, infer NSS extends string, undefined, infer Q extends string, undefined> ? `urn:${NID}:${NSS}?=${Q}`
  : U extends URN<infer NID extends string, infer NSS extends string, undefined, undefined, infer F extends string> ? `urn:${NID}:${NSS}#${F}`
  : U extends URN<infer NID extends string, infer NSS extends string, undefined, undefined, undefined> ? `urn:${NID}:${NSS}`
  : `urn:${string}`

/**
 * URN equivalence
 * @returns true if and only if `u1` and `u2` are equivalent
 * using the procedure defined by {@link https://www.rfc-editor.org/rfc/rfc8141#section-3.1}
 * If they are equivalent, refines the NID and NSS of u1 to that of u2
 */
export const equivalent = <
  U1 extends URN<string, string, unknown, unknown, unknown>,
  U2 extends { nid: string; nss: string },
>(
  u1: U1,
  u2: U2,
): u1 is U1 & { nid: U2['nid']; nss: U2['nss'] } =>
  u1.nid.toLowerCase() === u2.nid.toLowerCase() &&
  normalizePercentCase(u1.nss) === normalizePercentCase(u2.nss)

const normalizePercentCase = (s: string): string =>
  s.replace(/%([a-f0-9]){2}/gi, (m) => m.toLowerCase())
