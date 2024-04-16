import { Effect } from '../src/fx'

export class Now extends Effect('Now')<void, number> { }

export const now = new Now().send()
