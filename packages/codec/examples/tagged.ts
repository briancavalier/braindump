import { Codec, Decoded, Encoded, isStructuredSchema, lift, string } from '../src'

import { runExample } from './run-example'

type Tag<T extends PropertyKey> = { readonly [K in T]?: never }

const tag1 = <const T extends PropertyKey>() => <S>(s: S): Codec<Encoded<S>, Decoded<S> & Tag<T>> =>
  (isStructuredSchema(s) ? s : lift(s as any)) as any

const tag2 = <const S>(s: S) => <const T extends PropertyKey = never>(): Codec<Encoded<S>, Decoded<S> & Tag<T>> =>
  (isStructuredSchema(s) ? s : lift(s as any)) as any

const userId1 = tag1<'userId'>()(string)

runExample(userId1, 'userId1')

type T1 = Decoded<typeof userId1>

const taggedString = tag2(string)
const userId2 = taggedString<'userId'>()

type T2 = Decoded<typeof userId2>

runExample(userId2, 'userId2')
