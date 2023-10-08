import { formatFail } from './format'
import { Fail, Ok, isOk } from './result'

export const assertOk = <A>(r: Ok<A> | Fail): A => {
  if(isOk(r)) return r.value
  throw new AssertResultError(r)
}

class AssertResultError extends Error {
  constructor(public readonly fail: Fail) {
    super()
  }

  get message(): string {
    return formatFail(this.fail)
  }
}
