/** [실행#, 크기, for μs, stream<Integer> μs, IntStream μs, parallelStream μs] — 각 크기당 5회 전체 실행 */
export const RAW_V2: readonly [
  number,
  number,
  number,
  number,
  number,
  number,
][] = [
  [1, 1_000_000, 128891.6, 149933.9, 41825.4, 62894.1],
  [1, 5_000_000, 802279.7, 1014905.1, 241228.6, 361495.7],
  [1, 10_000_000, 1891531.3, 2583816.9, 642092.1, 464231.4],
  [2, 1_000_000, 130052.4, 169265.8, 46594.1, 55668.5],
  [2, 5_000_000, 830113.3, 1067664.6, 274702.5, 141062.3],
  [2, 10_000_000, 1883505.7, 2551020.0, 641474.2, 425774.6],
  [3, 1_000_000, 126385.6, 142607.0, 42090.6, 67655.2],
  [3, 5_000_000, 809038.8, 1034354.2, 246008.3, 152015.2],
  [3, 10_000_000, 1911424.4, 2355347.6, 602416.8, 541331.4],
  [4, 1_000_000, 128752.7, 144473.8, 42691.6, 57459.9],
  [4, 5_000_000, 805304.4, 991662.1, 287144.5, 157770.1],
  [4, 10_000_000, 1835859.5, 2406152.0, 672369.9, 474827.0],
  [5, 1_000_000, 123979.2, 147491.9, 41337.4, 41184.0],
  [5, 5_000_000, 787989.7, 1042583.7, 247011.2, 148094.4],
  [5, 10_000_000, 1844358.9, 2474398.3, 655224.6, 544234.9],
]

export const SIZES_V2 = [1_000_000, 5_000_000, 10_000_000] as const

export type V2AvgRow = {
  size: number
  forUs: number
  streamInteger: number
  intStream: number
  parallel: number
}

export function avgV2(size: number, col: 2 | 3 | 4 | 5): number {
  const rows = RAW_V2.filter((r) => r[1] === size)
  return rows.reduce((s, r) => s + r[col], 0) / rows.length
}

export function computeAvgsV2(): V2AvgRow[] {
  return SIZES_V2.map((size) => ({
    size,
    forUs: avgV2(size, 2),
    streamInteger: avgV2(size, 3),
    intStream: avgV2(size, 4),
    parallel: avgV2(size, 5),
  }))
}

export type V2Winner = 'for' | 'streamInteger' | 'intStream' | 'parallel'

export function pickWinnerV2(row: V2AvgRow): V2Winner {
  const m = Math.min(row.forUs, row.streamInteger, row.intStream, row.parallel)
  if (row.forUs <= m + 1e-6) return 'for'
  if (row.streamInteger <= m + 1e-6) return 'streamInteger'
  if (row.intStream <= m + 1e-6) return 'intStream'
  return 'parallel'
}

export const WINNER_LABEL_V2: Record<V2Winner, string> = {
  for: 'for 루프',
  streamInteger: 'stream<Integer>',
  intStream: 'IntStream (int)',
  parallel: 'parallelStream',
}

export const SUMMARY_REMARKS_V2: Record<number, string> = {
  1_000_000: '소규모 구간 — 기본형 IntStream·최소 박싱',
  5_000_000: '병렬이 순차 int보다 유리해지기 시작',
  10_000_000: '대규모 — ForkJoin 병렬 이점 극대화',
}
