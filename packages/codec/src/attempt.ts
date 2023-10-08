import { ok, thrown } from './result'

export const attempt = <A, B>(f: (a: A) => B) =>
  (a: A) => {
    try {
      return ok(f(a))
    } catch(e) {
      return thrown(a, e)
    }
  }
