import { Codec, Decoded, Encoded, isStructuredSchema, lift, string } from '../src'

import { runExample } from './run-example'

type Tag<T extends PropertyKey> = { readonly [K in T]?: unknown }

const tag1 = <const T extends PropertyKey>() => <S>(s: S): Codec<Encoded<S>, Decoded<S> & Tag<T>> =>
  (isStructuredSchema(s) ? s : lift(s as any)) as any

const tag2 = <const S>(s: S) => <const T extends PropertyKey = never>(): Codec<Encoded<S>, Decoded<S> & Tag<T>> =>
  (isStructuredSchema(s) ? s : lift(s as any)) as any

const tag3 = <const S>(s: S) => <const T extends Tag<PropertyKey> = never>(): Codec<Encoded<S>, Decoded<S> & T> =>
  (isStructuredSchema(s) ? s : lift(s as any)) as any

const tag4 = <const S>(s: S) => <const T extends Record<string, unknown>>(): Codec<Encoded<S>, Decoded<S> & T> =>
  (isStructuredSchema(s) ? s : lift(s as any)) as any

const userId1 = tag1<'userId'>()(string)

runExample(userId1, 'userId1')

type T1 = Decoded<typeof userId1>

const taggedString = tag2(string)
const userId2 = taggedString<'userId'>()

type T2 = Decoded<typeof userId2>

runExample(userId2, 'userId2')

const t3String = tag3(string)
const userId3 = t3String<Tag<'userId3'>>()

type T3 = Decoded<typeof userId3>

runExample(userId3, 'userId3')

const t4String = tag4(string)
const userId4 = t4String<Tag<'userId4'>>()

type T4 = Decoded<typeof userId4>

runExample(userId4, 'userId4')
