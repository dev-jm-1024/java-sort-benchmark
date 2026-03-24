import { useMemo } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import {
  RAW_V2,
  computeAvgsV2,
  pickWinnerV2,
  WINNER_LABEL_V2,
  SUMMARY_REMARKS_V2,
  type V2AvgRow,
  type V2Winner,
} from '../data/planV2'

const COLORS = {
  for: { bg: 'rgba(96,165,250,0.72)', border: '#60a5fa' },
  streamInt: { bg: 'rgba(167,139,250,0.72)', border: '#a78bfa' },
  intStream: { bg: 'rgba(251,191,36,0.75)', border: '#fbbf24' },
  parallel: { bg: 'rgba(52,211,153,0.72)', border: '#34d399' },
} as const

function gridOpts(unit = ''): ChartOptions<'bar'> {
  return {
    plugins: {
      legend: {
        labels: { color: '#94a3b8', boxWidth: 12, padding: 12, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString(undefined, { maximumFractionDigits: 2 })} μs`,
        },
      },
    },
    scales: {
      x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
      y: {
        grid: { color: '#1e293b' },
        ticks: {
          color: '#64748b',
          callback: (v) =>
            typeof v === 'number'
              ? v.toLocaleString() + (unit ? ` ${unit}` : '')
              : String(v),
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  }
}

const trendOpts: ChartOptions<'line'> = {
  plugins: {
    legend: {
      labels: { color: '#94a3b8', boxWidth: 12, padding: 12, font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      borderWidth: 1,
      callbacks: {
        label: (ctx) =>
          ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString(undefined, { maximumFractionDigits: 2 })} μs`,
      },
    },
  },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
    y: {
      type: 'logarithmic',
      grid: { color: '#1e293b' },
      ticks: {
        color: '#64748b',
        callback: (v) => {
          if (typeof v !== 'number') return String(v)
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
          if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
          return String(v)
        },
      },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
}

function CellV2({
  row,
  kind,
  value,
}: {
  row: V2AvgRow
  kind: V2Winner
  value: number
}) {
  const w = pickWinnerV2(row)
  const isBest = w === kind
  const cls =
    kind === 'for'
      ? 'col-for'
      : kind === 'streamInteger'
        ? 'col-st'
        : kind === 'intStream'
          ? 'col-int'
          : 'col-par'
  return (
    <td className={`${cls}${isBest ? ' best' : ''}`}>
      {value.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
      {isBest ? <span className="winner-badge">최저</span> : null}
    </td>
  )
}

export default function PlanV2Page() {
  const avgs = useMemo(() => computeAvgsV2(), [])

  const insights = useMemo(() => {
    const [a1m, a5m, a10m] = avgs
    const w1 = pickWinnerV2(a1m)
    const parVsInt5 = a5m.parallel / a5m.intStream
    const parVsInt10 = a10m.parallel / a10m.intStream
    const streamSlowest =
      a1m.streamInteger > a1m.forUs &&
      a5m.streamInteger > a5m.forUs &&
      a10m.streamInteger > a10m.forUs
    return {
      w1,
      a1m,
      a5m,
      a10m,
      parVsInt5,
      parVsInt10,
      streamSlowest,
    }
  }, [avgs])

  const chartBarData = useMemo(
    () => ({
      labels: ['1,000,000', '5,000,000', '10,000,000'],
      datasets: [
        {
          label: 'for 루프',
          data: avgs.map((a) => a.forUs),
          backgroundColor: COLORS.for.bg,
          borderColor: COLORS.for.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'stream<Integer>',
          data: avgs.map((a) => a.streamInteger),
          backgroundColor: COLORS.streamInt.bg,
          borderColor: COLORS.streamInt.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'IntStream (int)',
          data: avgs.map((a) => a.intStream),
          backgroundColor: COLORS.intStream.bg,
          borderColor: COLORS.intStream.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'parallelStream',
          data: avgs.map((a) => a.parallel),
          backgroundColor: COLORS.parallel.bg,
          borderColor: COLORS.parallel.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    }),
    [avgs],
  )

  const chartTrendData = useMemo(
    () => ({
      labels: ['1M', '5M', '10M'],
      datasets: [
        {
          label: 'for 루프',
          data: avgs.map((a) => a.forUs),
          borderColor: COLORS.for.border,
          backgroundColor: 'rgba(96,165,250,0.1)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'stream<Integer>',
          data: avgs.map((a) => a.streamInteger),
          borderColor: COLORS.streamInt.border,
          backgroundColor: 'rgba(167,139,250,0.1)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'IntStream (int)',
          data: avgs.map((a) => a.intStream),
          borderColor: COLORS.intStream.border,
          backgroundColor: 'rgba(251,191,36,0.08)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'parallelStream',
          data: avgs.map((a) => a.parallel),
          borderColor: COLORS.parallel.border,
          backgroundColor: 'rgba(52,211,153,0.1)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [avgs],
  )

  return (
    <div className="shell">
      <header className="hero">
        <p className="hero-eyebrow">Plan V2 · 대규모 · Benchmark report</p>
        <h1 className="title">
          <span className="title-gradient">Java 정렬 벤치마크 V2</span>
        </h1>
        <p className="subtitle">
          for vs <code className="inline-code">stream&lt;Integer&gt;</code> vs{' '}
          <code className="inline-code">IntStream</code> vs parallelStream — 백만 단위
          크기
        </p>
      </header>

      <div className="meta">
        <div className="badge">
          실행 환경 <strong>Java 21 (HotSpot JVM)</strong>
        </div>
        <div className="badge">
          JVM <strong>-server -Xms2g -Xmx2g</strong>
        </div>
        <div className="badge">
          ForkJoinPool <strong>parallelism 11</strong> (물리 코어 − 1)
        </div>
        <div className="badge">
          워밍업 <strong>100,000개 × 5회</strong>
        </div>
        <div className="badge">
          실측 <strong>각 크기 × 5회 평균</strong> · 전체 <strong>5회 반복</strong>
        </div>
        <div className="badge">
          단위 <strong>μs</strong> (표·차트 동일)
        </div>
      </div>

      <p className="section-title">주요 관찰</p>
      <div className="insights">
        <div className="insight">
          <div className="insight-label">1,000,000개 — 최저 시간</div>
          <div
            className={`insight-value ${
              insights.w1 === 'intStream'
                ? 'amber'
                : insights.w1 === 'parallel'
                  ? 'green'
                  : insights.w1 === 'streamInteger'
                    ? 'purple'
                    : 'blue'
            }`}
          >
            {WINNER_LABEL_V2[insights.w1]}
          </div>
          <div className="insight-desc">
            {insights.w1 === 'intStream' ? (
              <>
                IntStream 약{' '}
                <strong>
                  {insights.a1m.intStream.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </strong>
                μs — 백만 단위에서도 기본형 IntStream이 가장 안정적으로 빠른 편
              </>
            ) : (
              <>
                최단: <strong>{WINNER_LABEL_V2[insights.w1]}</strong> — 1M 구간에서
                측정된 최소 μs 기준
              </>
            )}
          </div>
        </div>
        <div className="insight">
          <div className="insight-label">5M / 10M 구간</div>
          <div className="insight-value green">
            {insights.parVsInt10 < 1 ? 'parallelStream' : 'IntStream'}
          </div>
          <div className="insight-desc">
            10M에서 parallel 대비 IntStream 비율{' '}
            <strong>{insights.parVsInt10.toFixed(2)}×</strong>
            {insights.parVsInt10 < 1
              ? ' — 병렬이 더 빠름'
              : ' — 순차 int가 더 빠름'}
            {' · '}
            5M 비율 <strong>{insights.parVsInt5.toFixed(2)}×</strong>
          </div>
        </div>
        <div className="insight">
          <div className="insight-label">stream&lt;Integer&gt;</div>
          <div className="insight-value purple">박싱 오버헤드</div>
          <div className="insight-desc">
            {insights.streamSlowest
              ? '세 크기 모두 for 루프보다 느림 — 박싱·iterator 비용'
              : '대체로 for·IntStream보다 높은 μs — 가장 느린 축에 가깝게 분포'}
          </div>
        </div>
      </div>

      <p className="section-title">크기별 평균 (5회 × 각 3크기, μs)</p>
      <div className="chart-grid full">
        <div className="card">
          <div className="card-title">그룹 막대 — 1M / 5M / 10M</div>
          <div className="chart-wrap tall">
            <Bar data={chartBarData} options={gridOpts('μs')} />
          </div>
        </div>
      </div>

      <div className="chart-grid full">
        <div className="card">
          <div className="card-title">추세 — 로그 스케일 (μs)</div>
          <div className="chart-wrap tall">
            <Line data={chartTrendData} options={trendOpts} />
          </div>
        </div>
      </div>

      <p className="section-title">평균 요약 (5회 전체 평균, μs)</p>
      <div className="table-wrap">
        <table className="summary">
          <thead>
            <tr>
              <th>크기</th>
              <th className="col-for">for 루프</th>
              <th className="col-st">stream&lt;Integer&gt;</th>
              <th className="col-int">IntStream (int)</th>
              <th className="col-par">parallelStream</th>
              <th>최저</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {avgs.map((row) => {
              const w = pickWinnerV2(row)
              return (
                <tr key={row.size}>
                  <td>{row.size.toLocaleString()}</td>
                  <CellV2 row={row} kind="for" value={row.forUs} />
                  <CellV2
                    row={row}
                    kind="streamInteger"
                    value={row.streamInteger}
                  />
                  <CellV2 row={row} kind="intStream" value={row.intStream} />
                  <CellV2 row={row} kind="parallel" value={row.parallel} />
                  <td>{WINNER_LABEL_V2[w]}</td>
                  <td style={{ color: '#94a3b8', textAlign: 'left' }}>
                    {SUMMARY_REMARKS_V2[row.size]}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="section-title">ms 환산 (동일 평균값 ÷ 1000)</p>
      <div className="table-wrap">
        <table className="summary summary-compact">
          <thead>
            <tr>
              <th>크기</th>
              <th>for</th>
              <th>stream&lt;Integer&gt;</th>
              <th>IntStream</th>
              <th>parallel</th>
            </tr>
          </thead>
          <tbody>
            {avgs.map((row) => (
              <tr key={`ms-${row.size}`}>
                <td>{row.size.toLocaleString()}</td>
                <td className="col-for">
                  {(row.forUs / 1000).toFixed(1)} ms
                </td>
                <td className="col-st">
                  {(row.streamInteger / 1000).toFixed(1)} ms
                </td>
                <td className="col-int">
                  {(row.intStream / 1000).toFixed(1)} ms
                </td>
                <td className="col-par">
                  {(row.parallel / 1000).toFixed(1)} ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="section-title">IntStream 대비 상대 시간 (×, 낮을수록 느림)</p>
      <div className="table-wrap">
        <table className="summary summary-compact">
          <thead>
            <tr>
              <th>크기</th>
              <th>for</th>
              <th>stream&lt;Integer&gt;</th>
              <th>IntStream</th>
              <th>parallel</th>
            </tr>
          </thead>
          <tbody>
            {avgs.map((row) => {
              const b = row.intStream
              return (
                <tr key={`ratio-${row.size}`}>
                  <td>{row.size.toLocaleString()}</td>
                  <td className="col-for">{(row.forUs / b).toFixed(2)}×</td>
                  <td className="col-st">
                    {(row.streamInteger / b).toFixed(2)}×
                  </td>
                  <td className="col-int">1.00×</td>
                  <td className="col-par">{(row.parallel / b).toFixed(2)}×</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <details className="raw-block">
        <summary className="raw-summary">
          <span>원시 데이터 (5회 × 3크기 = 15행)</span>
          <span className="raw-chevron" aria-hidden>
            ▶
          </span>
        </summary>
        <div className="raw-table-wrap">
          <table className="raw-table">
            <thead>
              <tr>
                <th>실행#</th>
                <th>크기</th>
                <th>for (μs)</th>
                <th>stream&lt;Integer&gt;</th>
                <th>IntStream</th>
                <th>parallel</th>
              </tr>
            </thead>
            <tbody>
              {RAW_V2.map((r) => (
                <tr key={`${r[0]}-${r[1]}`}>
                  <td>#{r[0]}</td>
                  <td>{r[1].toLocaleString()}</td>
                  <td>{r[2].toFixed(1)}</td>
                  <td>{r[3].toFixed(1)}</td>
                  <td>{r[4].toFixed(1)}</td>
                  <td>{r[5].toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <footer className="footer">
        Java 정렬 벤치마크 V2 · planV2 · BenchmarkTest 출력 기준 5회 집계
      </footer>
    </div>
  )
}
