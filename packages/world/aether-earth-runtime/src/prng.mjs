export class DeterministicRandom {
  constructor(seed = 0x5eed1234) {
    this.state = (Number(seed) >>> 0) || 1;
  }

  nextUint32() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  next() {
    return this.nextUint32() / 0x100000000;
  }

  int(min, maxInclusive) {
    if (!Number.isInteger(min) || !Number.isInteger(maxInclusive) || maxInclusive < min) {
      throw new RangeError('invalid integer range');
    }
    return min + Math.floor(this.next() * (maxInclusive - min + 1));
  }

  pick(items) {
    if (!Array.isArray(items) || items.length === 0) throw new RangeError('cannot pick from empty collection');
    return items[this.int(0, items.length - 1)];
  }

  chance(probability) {
    return this.next() < Math.max(0, Math.min(1, probability));
  }

  fork(label) {
    let hash = 2166136261 >>> 0;
    for (const char of String(label)) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return new DeterministicRandom((this.state ^ hash) >>> 0);
  }
}
