import { formatSchema } from './format'
import { isOptional, isRest, isStructuredSchema, isTemplateLiteral, schema } from './schema'
import { regexFor } from './template-literal'

export const decoded = <const S>(s: S): Record<string, unknown> => ({
  $schema: "http://json-schema.org/draft-07/schema#",
  ...buildSchema(s, false)
})

export const encoded = <const S>(s: S): Record<string, unknown> => ({
  $schema: "http://json-schema.org/draft-07/schema#",
  ...buildSchema(s, true)
})

const buildSchema = <const S>(s: S, encoded: boolean): Record<string, unknown> => {
  if (s === null) return { type: 'null' }

  if (typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return { const: s }

  if (Array.isArray(s))
    return tupleJsonSchema(s, encoded)

  if (isStructuredSchema(s)) {
    const ss = s[schema]
    switch (ss) {
      case 'never':
        throw new Error(`Can't generate JSON Schema for ${formatSchema(s)}`)
      case 'unknown': return {
        oneOf: [
          { type: 'null' },
          { type: 'number' },
          { type: 'string' },
          { type: 'boolean' },
          { type: 'array' },
          { type: 'object', additionalProperties: true },
        ]
      }
      case 'number':
      case 'float':
        return { type: 'number' }
      case 'int': return { type: 'integer' }
      case 'string': return { type: 'string' }
      case 'boolean': return { type: 'boolean' }
      case 'object': return { type: 'object', additionalProperties: true }
      case 'array': return { type: 'array' }
      case 'enum': return { enum: Object.values(s.values) }
      case 'union': return { oneOf: s.schemas.map(s => buildSchema(s, encoded)) }
      case 'record': return {
          type: 'object',
          properties: {},
          patternProperties: isTemplateLiteral(s.keys) ? regexFor(s.keys) : undefined,
          additionalProperties: buildSchema(s.values, encoded),
        }
      case 'array-of': return {
          type: 'array',
          items: buildSchema(s.items, encoded)
        }
      case 'template-literal':
        return {
          type: 'string',
          pattern: regexFor(s)
        }
      case 'lift': return buildSchema(s.schema, encoded)
      case 'pipe': return buildSchema(s.codecs[encoded ? 0 : s.codecs.length - 1], encoded)
      default:
        throw new Error(`Don't know how to generate decoded value for ${formatSchema(s)}`)
    }
  }

  if (s && typeof s === 'object')
    return propertiesJsonSchema(s as Record<string, unknown>, encoded)

  throw new Error(`Don't know how to generate decoded value for ${formatSchema(s)}`)
}

const tupleJsonSchema = <const S>(s: readonly S[], encoded: boolean) => {
  const last = s[s.length - 1]
  return isRest(last) ? {
    type: 'array',
    items: s.slice(0, s.length - 1).map(s => buildSchema(s, encoded)),
    additionalItems: buildSchema(last.items, encoded)
  } : {
    type: 'array',
      items: s.map(s => buildSchema(s, encoded)),
    additionalItems: false
  }
}

function propertiesJsonSchema(s: Record<string, unknown>, encoded: boolean) {
  const properties = {} as { [s: string]: unknown }
  const requiredKeys = []
  for (const k of Object.keys(s)) {
    const sk = s[k]
    if (isOptional(sk)) {
      properties[k] = buildSchema(sk.schema, encoded)
    } else {
      properties[k] = buildSchema(sk, encoded)
      requiredKeys.push(k)
    }
  }

  return {
    type: 'object',
    required: requiredKeys,
    additionalProperties: false,
    properties
  }
}
