export interface SearchNode {
  index: number
  cost: number
  steps: number
  order: number
  parent: SearchNode | undefined
}

export type HeapMode = 'steps-first' | 'cost-first'

export class MinHeap {
  private readonly values: SearchNode[] = []

  constructor(private readonly mode: HeapMode = 'steps-first') {}

  push(value: SearchNode): void {
    this.values.push(value)
    let index = this.values.length - 1
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (!this.isBefore(this.values[index], this.values[parent])) break
      ;[this.values[index], this.values[parent]] = [
        this.values[parent],
        this.values[index],
      ]
      index = parent
    }
  }

  pop(): SearchNode | undefined {
    const first = this.values[0]
    const last = this.values.pop()
    if (this.values.length === 0) return first
    if (!last) return first
    this.values[0] = last
    let index = 0
    while (true) {
      const left = index * 2 + 1
      const right = left + 1
      let next = index
      if (
        left < this.values.length &&
        this.isBefore(this.values[left], this.values[next])
      )
        next = left
      if (
        right < this.values.length &&
        this.isBefore(this.values[right], this.values[next])
      )
        next = right
      if (next === index) break
      ;[this.values[index], this.values[next]] = [
        this.values[next],
        this.values[index],
      ]
      index = next
    }
    return first
  }

  private isBefore(a: SearchNode, b: SearchNode): boolean {
    if (this.mode === 'cost-first') {
      if (a.cost !== b.cost) return a.cost < b.cost
      if (a.steps !== b.steps) return a.steps < b.steps
      return a.order < b.order
    }
    if (a.steps !== b.steps) return a.steps < b.steps
    if (a.cost !== b.cost) return a.cost < b.cost
    return a.order < b.order
  }
}
