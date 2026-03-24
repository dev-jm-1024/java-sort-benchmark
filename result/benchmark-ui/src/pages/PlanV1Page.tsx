import { useMemo } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import {
  RAW,
  computeAvgs,
  pickWinner,
  WINNER_LABEL,
  SUMMARY_REMARKS,
  type AvgRow,
  type Winner,
} from '../data/benchmark'

const COLORS = {
  for: { bg: 'rgba(96,165,250,0.75)', border: '#60a5fa' },
  stream: { bg: 'rgba(167,139,250,0.75)', border: '#a78bfa' },
  parallel: { bg: 'rgba(52,211,153,0.75)', border: '#34d399' },
} as const

function gridOpts(unit = ''): ChartOptions<'bar'> {
  return {
    plugins: {
      legend: {
        labels: { color: '#94a3b8', boxWidth: 14, padding: 16 },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(2)} μs`,
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
      labels: { color: '#94a3b8', boxWidth: 14, padding: 16 },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      borderWidth: 1,
      callbacks: {
        label: (ctx) =>
          ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(2)} μs`,
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
          return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
        },
      },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
}

function Cell({
  row,
  kind,
  value,
}: {
  row: AvgRow
  kind: Winner
  value: number
}) {
  const w = pickWinner(row)
  const isBest = w === kind
  const cls =
    kind === 'for' ? 'col-for' : kind === 'stream' ? 'col-st' : 'col-par'
  return (
    <td className={`${cls}${isBest ? ' best' : ''}`}>
      {value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {isBest ? <span className="winner-badge">최저</span> : null}
    </td>
  )
}

export default function PlanV1Page() {
  const avgs = useMemo(() => computeAvgs(), [])
  const chartSmallData = useMemo(
    () => ({
      labels: ['100개', '1,000개'],
      datasets: [
        {
          label: 'for 루프',
          data: [avgs[0].forUs, avgs[1].forUs],
          backgroundColor: COLORS.for.bg,
          borderColor: COLORS.for.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'stream',
          data: [avgs[0].stream, avgs[1].stream],
          backgroundColor: COLORS.stream.bg,
          borderColor: COLORS.stream.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'parallelStream',
          data: [avgs[0].parallel, avgs[1].parallel],
          backgroundColor: COLORS.parallel.bg,
          borderColor: COLORS.parallel.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    }),
    [avgs],
  )

  const chartLargeData = useMemo(
    () => ({
      labels: ['10,000개', '100,000개'],
      datasets: [
        {
          label: 'for 루프',
          data: [avgs[2].forUs, avgs[3].forUs],
          backgroundColor: COLORS.for.bg,
          borderColor: COLORS.for.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'stream',
          data: [avgs[2].stream, avgs[3].stream],
          backgroundColor: COLORS.stream.bg,
          borderColor: COLORS.stream.border,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: 'parallelStream',
          data: [avgs[2].parallel, avgs[3].parallel],
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
      labels: ['100', '1,000', '10,000', '100,000'],
      datasets: [
        {
          label: 'for 루프',
          data: avgs.map((a) => a.forUs),
          borderColor: COLORS.for.border,
          backgroundColor: 'rgba(96,165,250,0.12)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'stream',
          data: avgs.map((a) => a.stream),
          borderColor: COLORS.stream.border,
          backgroundColor: 'rgba(167,139,250,0.12)',
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
          backgroundColor: 'rgba(52,211,153,0.12)',
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
        <p className="hero-eyebrow">Plan V1 · Benchmark report</p>
        <h1 className="title">
          <span className="title-gradient">Java 정렬 벤치마크</span>
        </h1>
        <p className="subtitle">
          for 루프 vs stream vs parallelStream — 데이터 크기별 성능 비교
        </p>
      </header>

      <div className="meta">
        <div className="badge">
          실행 환경 <strong>Java 21 (HotSpot JVM)</strong>
        </div>
        <div className="badge">
          JVM 옵션 <strong>-server -Xms2g -Xmx2g</strong>
        </div>
        <div className="badge">
          워밍업 <strong>10,000개 × 5회</strong>
        </div>
        <div className="badge">
          측정 <strong>각 크기 × 10회 평균</strong>
        </div>
        <div className="badge">
          총 실행 횟수 <strong>18회</strong>
        </div>
        <div className="badge">
          단위 <strong>마이크로초 (μs)</strong>
        </div>
      </div>

      <p className="section-title">주요 관찰</p>
      <div className="insights">
        <div className="insight">
          <div className="insight-label">소규모 (100개) 최고 성능</div>
          <div className="insight-value blue">for 루프</div>
          <div className="insight-desc">
            ~8.4 μs — parallelStream 대비 <strong>22배</strong> 빠름
          </div>
        </div>
        <div className="insight">
          <div className="insight-label">대규모 (100,000개) 최고 성능</div>
          <div className="insight-value green">parallelStream</div>
          <div className="insight-desc">
            ~5,222 μs — for 루프 대비 <strong>약 2배</strong> 빠름
          </div>
        </div>
        <div className="insight">
          <div className="insight-label">역전 구간</div>
          <div className="insight-value purple">10,000개</div>
          <div className="insight-desc">
            parallelStream이 stream을 추월하기 시작
          </div>
        </div>
      </div>

      <p className="section-title">크기별 평균 실행 시간 (18회 평균)</p>
      <div className="chart-grid">
        <div className="card">
          <div className="card-title">소규모 — 100 / 1,000개 (μs)</div>
          <div className="chart-wrap">
            <Bar data={chartSmallData} options={gridOpts('μs')} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">대규모 — 10,000 / 100,000개 (μs)</div>
          <div className="chart-wrap">
            <Bar data={chartLargeData} options={gridOpts('μs')} />
          </div>
        </div>
      </div>

      <div className="chart-grid full">
        <div className="card">
          <div className="card-title">전체 크기별 추세 — 로그 스케일 (μs)</div>
          <div className="chart-wrap tall">
            <Line data={chartTrendData} options={trendOpts} />
          </div>
        </div>
      </div>

      <p className="section-title">평균값 요약표 (18회 평균, μs)</p>
      <div className="table-wrap">
        <table className="summary">
          <thead>
            <tr>
              <th>데이터 크기</th>
              <th className="col-for">for 루프</th>
              <th className="col-st">stream</th>
              <th className="col-par">parallelStream</th>
              <th>최저</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {avgs.map((row) => {
              const w = pickWinner(row)
              return (
                <tr key={row.size}>
                  <td>{row.size.toLocaleString()}</td>
                  <Cell row={row} kind="for" value={row.forUs} />
                  <Cell row={row} kind="stream" value={row.stream} />
                  <Cell row={row} kind="parallel" value={row.parallel} />
                  <td>{WINNER_LABEL[w]}</td>
                  <td style={{ color: '#94a3b8', textAlign: 'left' }}>
                    {SUMMARY_REMARKS[row.size]}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <details className="raw-block">
        <summary className="raw-summary">
          <span>원시 데이터 (18회 전체 실행 결과)</span>
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
                <th>for 루프 (μs)</th>
                <th>stream (μs)</th>
                <th>parallelStream (μs)</th>
              </tr>
            </thead>
            <tbody>
              {RAW.map((r) => (
                <tr key={`${r[0]}-${r[1]}`}>
                  <td>#{r[0]}</td>
                  <td>{r[1].toLocaleString()}</td>
                  <td>{r[2].toFixed(2)}</td>
                  <td>{r[3].toFixed(2)}</td>
                  <td>{r[4].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <footer className="footer">
        Java 정렬 벤치마크 · planV1 · 워밍업 포함 · 재현 seed: 42+i
      </footer>
    </div>
  )
}
