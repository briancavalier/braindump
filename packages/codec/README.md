## Goals

Overall goals, and goals compared to https://github.com/briancavalier/decode

1. [Adhoc schemas](https://github.com/briancavalier/braindump/tree/main/packages/schema#adhoc-schemas) for describing literals, records, and tuples, and by extension, simple discriminated unions.
1. Bidirectional refinement, mapping, and partial mapping.
  - `Codec a b`, essentially a pair of invariant types `(a, b)`, much like a pair of functions `(a -> b, b -> a)`
1. Enable additional interpretations by further embracing initial encoding (i.e. AST-based).
  - Encoding
  - Test/fake value generation
1. Retain compositional API
  - Adhoc schemas are natually compositional using existing language features
  - Codec is compositional: composing `Codec a b` and `Codec b c` yields `Codec a c`
1. Minimize `unknown` input types where possible
  - Always using `unknown` enables mistakes
    - function composition
1. Detailed runtime errors
  - Retain runtime-renderable error AST
1. Simpler types when inspecting/hovering over schemas and codecs
  - Simpler types for primitive schemas (not function types)
  - Do not retain complete _type-level_ error AST.  It hasn't been useful in practice and clutters IDE UIs and compiler output
