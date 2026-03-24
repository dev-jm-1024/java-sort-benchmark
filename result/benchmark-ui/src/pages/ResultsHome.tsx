import { Link } from 'react-router-dom'

export default function ResultsHome() {
  return (
    <div className="shell home-shell">
      <header className="hero hero--center">
        <p className="hero-eyebrow">Performance study</p>
        <h1 className="title">
          <span className="title-gradient">벤치마크 최종 결과</span>
        </h1>
        <p className="subtitle home-lead">
          Java 정렬 실험(plan V1 / V2) 요약을 한 곳에서 확인합니다. 차트·표·원시
          실행값까지 포함되어 있습니다.
        </p>
      </header>

      <div className="home-grid">
        <Link className="home-card" to="/plan-v1">
          <span className="home-card-tag">소~중규모</span>
          <h2 className="home-card-title">Plan V1</h2>
          <p className="home-card-desc">
            100 ~ 100,000개 · for / stream / parallelStream · 18회 실행 평균
          </p>
          <span className="home-card-cta">상세 보기 →</span>
        </Link>
        <Link className="home-card" to="/plan-v2">
          <span className="home-card-tag">대규모</span>
          <h2 className="home-card-title">Plan V2</h2>
          <p className="home-card-desc">
            1M ~ 10M · for / stream&lt;Integer&gt; / IntStream / parallelStream ·
            5회 반복 평균
          </p>
          <span className="home-card-cta">상세 보기 →</span>
        </Link>
      </div>

      <section className="home-hint">
        <p>
          로컬 미리보기:{' '}
          <code className="inline-code">cd benchmark-ui && npm run dev</code>
        </p>
      </section>
    </div>
  )
}
