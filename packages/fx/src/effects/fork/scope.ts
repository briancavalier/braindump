
export class Scope {
  private _disposed = false;
  private readonly disposables = new Set<Disposable>();

  add(disposable: Disposable) {
    if (this._disposed) disposable[Symbol.dispose]()
    else this.disposables.add(disposable)
  }

  remove(disposable: Disposable) {
    this.disposables.delete(disposable)
  }

  get disposed() { return this._disposed }

  [Symbol.dispose]() {
    if (this._disposed) return
    this._disposed = true
    for (const d of this.disposables) d[Symbol.dispose]()
  }
}
