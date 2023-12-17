import { formatSchema } from './format'
import { isOptional, isRest, isStructuredSchema, isTemplateLiteral, schema } from './schema'
import { regexFor } from './template-literal'

export const jsonSchema = <const S>(s: S): Record<string, unknown> => ({
  $schema: "http://json-schema.org/draft-07/schema#",
  ...buildSchema(s)
})


const buildSchema = <const S>(s: S): Record<string, unknown> => {
  if (s === null) return { type: 'null' }

  if (typeof s === 'number' || typeof s === 'string' || typeof s === 'boolean')
    return { const: s }

  if (Array.isArray(s)) {
    const last = s[s.length - 1]
    return isRest(last) ? {
        type: 'array',
        items: s.slice(0, s.length - 1).map(buildSchema),
        additionalItems: buildSchema(last.items)
      } : {
      type: 'array',
      items: s.map(buildSchema),
      additionalItems: false
    }
  }

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
      case 'union': return { oneOf: s.schemas.map(jsonSchema) }
      case 'record': return {
          type: 'object',
          properties: {},
          patternProperties: isTemplateLiteral(s.keys) ? regexFor(s.keys) : undefined,
          additionalProperties: buildSchema(s.values),
        }
      case 'array-of': return {
        type: 'array',
        items: buildSchema(s.items)
      }
      case 'template-literal':
        return {
          type: 'string',
          pattern: regexFor(s)
        }
      case 'lift': return buildSchema(s.schema)
      default:
        throw new Error(`Don't know how to generate decoded value for ${formatSchema(s)}`)
    }
  }

  if (s && typeof s === 'object') {
    const a = {} as { [s: string]: unknown }
    const requiredKeys = []
    for (const k of Object.keys(s)) {
      const sk = (s as Record<string, any>)[k]
      if (isOptional(sk)) {
        a[k] = buildSchema(sk.schema)
      } else {
        a[k] = buildSchema(sk)
        requiredKeys.push(k)
      }
    }

    return {
      type: 'object',
      required: requiredKeys,
      properties: a,
      additionalProperties: false
    }
  }

  throw new Error(`Don't know how to generate decoded value for ${formatSchema(s)}`)
}
