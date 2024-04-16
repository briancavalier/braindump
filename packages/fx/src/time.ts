import { Effect } from '../src/fx'

export class Now extends Effect('Now')<void> { }

export const now = new Now().request<number>()
