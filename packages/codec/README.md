## Goals

## Keep/change/improve

1. [Adhoc schemas](https://github.com/briancavalier/braindump/tree/main/packages/schema#adhoc-schemas)
1. Compositional API, i.e. compose codecs rather than transforming them
1. Detailed _runtime_ errors
  - Do not retain complete _type-level_ error AST.  It hasn't been useful in practice and clutters IDE UIs and compiler output
1. Minimize `unknown` input types where possible
  - Always using `unknown` enables mistakes
    - function composition
1. encode/decode, encodeOrThrow/decodeOrThrow, and other encodeWhatever/decodeWhatever style APIs instead of `assert`/`assertOk`
  - `assert`/`assertOk` are useful, but as a public API, they provide 2 ways of doing the same thing.  In practice there are no strong heuristics for which to use, and they get mixed arbitrarily.
    - Only strong heursitic seems to be: when needing partial application of a decoding function that throws, e.g. promise.then(assert(fromSchema(mySchema)))
      - decodeOrThrow improves ergonomics, imho:
        - promise.then(decodeOrThrow(mySchema))
1. Error messages for unions
  - Currently, errors are like:
      expected string, got 123
      | expected null, got 123
      | expected boolean, got 123
  - Observation that "got" distributes over errors, so can be hoisted.  Also, further commutation enables just 1 "expected", too.
      got 123, expected string | null | boolean
  - Implies all errors should be of the form "got X, expected Y" instead of "expected Y, got X"

## Add
1. Simpler types when inspecting/hovering over schemas and codecs
1. Enable additional interpretations by further embracing initial encoding (i.e. AST-based).
  - Encoding
    - Bidirectional refinement, mapping, and partial mapping.
      - `Codec a b`, a pair of invariant types `(a, b)`, essentially like a pair of functions `(a -> b, b -> a)`
  - Test/fake value generation

## Remove
