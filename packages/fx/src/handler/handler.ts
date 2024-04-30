// eslint-disable-next-line import/no-cycle
import { Fx, FxIterable } from '../fx'

import { Effects, Handler, Instance } from './internal/handler'
import { empty } from './internal/state'
import { Resume, Step } from './step'

export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    return: (r: R1 | R2, s: S) => R
    finally: (s: S) => FxIterable<FE, void>
  }): FxIterable<SE | Exclude<E1, Instance<E>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Effects, const FE, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
    return: (r: R1 | R2) => R
    finally: () => FxIterable<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R>
export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    finally: (s: S) => Fx<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const SE, const S, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    return: (r: R1 | R2, s: S) => R
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R>
export function control<const E1, const R1, const E extends Effects, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
    return: (r: R1 | R2) => R
  }): Fx<Exclude<E1, Instance<E>> | E2, R>
export function control<const E1, const R1, const SE, const E extends Effects, const S, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const FE, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
    finally: () => Fx<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const A, const E2, const R2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Step<A, R2, void>>
  }): Fx<Exclude<E1, Instance<E>> | E2, R1 | R2>
export function control<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially?: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Step<A, R2, S>>
    return?: (r: R1 | R2, s: S) => R
    finally?: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R2 | R> {
    return new Handler(f, handler, empty(), false)
  }

export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    return: (r: R1, s: S) => R
    finally: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Effects, const FE, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
    return: (r: R1) => R
    finally: () => FxIterable<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R>
export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    finally: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const SE, const S, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    return: (r: R1, s: S) => R
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R>
export function handle<const E1, const R1, const E extends Effects, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
    return: (r: R1) => R
  }): Fx<Exclude<E1, Instance<E>> | E2, R>
export function handle<const E1, const R1, const SE, const E extends Effects, const S, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2, R1>
export function handle<const E1, const R1, const E extends Effects, const FE, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
    finally: () => FxIterable<FE, void>
  }): Fx<Exclude<E1, Instance<E>> | E2 | FE, R1>
export function handle<const E1, const R1, const E extends Effects, const A, const E2>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    handle: (e: Instance<E>) => FxIterable<E2, Resume<A>>
  }): Fx<Exclude<E1, Instance<E>> | E2, R1>
export function handle<const E1, const R1, const E extends Effects, const SE, const FE, const S, const A, const E2, const R>(
  f: FxIterable<E1, R1>,
  handler: {
    effects: E,
    initially?: FxIterable<SE, S>,
    handle: (e: Instance<E>, s: S) => FxIterable<E2, Resume<A, S>>
    return?: (r: R1, s: S) => R
    finally?: (s: S) => FxIterable<FE, void>
  }): Fx<SE | Exclude<E1, Instance<E>> | E2 | FE, R1 | R> {
    return new Handler(f, handler, empty(), true)
  }
