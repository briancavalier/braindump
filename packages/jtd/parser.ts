export interface Parser<Unparsed, Parsed, E> {
  readonly parse: (input: Unparsed) => Result<Parsed, E>
  readonly unparse: <P extends Parsed>(x: P) => Unparsed
}

export type Result<A, E> =
  | Readonly<{ ok: true, value: A }>
  | Readonly<{ ok: false, error: E }>
