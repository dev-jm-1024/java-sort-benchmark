# Java 정렬 벤치마크 — for / stream / IntStream / parallelStream

Java에서 정렬 작업을 수행할 때 `for` 루프, `Stream<Integer>`, `IntStream`, `parallelStream` 네 가지 방식의 성능을 데이터 크기별로 비교한다.
숫자 자체보다 **크기에 따른 상대적 추세**와 **박싱 오버헤드의 실체**를 파악하는 것이 목적이다.

---

## 프로젝트 구조

```
performance/
├── src/main/java/com/example/
│   ├── BenchmarkTest.java      # 벤치마크 본체
│   └── Main.java               # (무관)
├── claude-plan/
│   ├── planV1.md               # 1차 테스트 설계
│   └── planV2.md               # 2차 테스트 설계 (확장)
├── result/
│   ├── planV1-result.html      # 1차 결과 (100 ~ 100,000개)
│   └── planV2-result.html      # 2차 결과 (1M ~ 10M개)
└── pom.xml
```

---

## 실행 방법

```bash
# 컴파일
mvn compile

# 실행
java -server -Xms2g -Xmx2g -cp target/classes com.example.BenchmarkTest
```

### JVM 옵션 설명

| 옵션 | 이유 |
|------|------|
| `-server` | 서버용 JIT 컴파일러(C2) 활성화 |
| `-Xms2g -Xmx2g` | 힙 크기 고정 — GC 동적 확장으로 인한 측정 편향 제거. 벤치마크용으로는 2~4GB가 GC 간섭 없이 안정적인 범위 |

---

## 측정 대상

| 방식 | 내부 동작 |
|------|-----------|
| `for` 루프 | `Collections.sort(copy)` — ArrayList 내부 배열에 TimSort 직접 수행 |
| `stream<Integer>` | `list.stream().sorted().collect()` — 파이프라인 객체 생성 후 배열로 materialize, 정렬, 다시 List로 collect |
| `IntStream<int>` | `Arrays.copyOf` 후 `Arrays.sort(copy)` — primitive `int[]` 기반, 박싱 없음 |
| `parallelStream` | `list.parallelStream().sorted().collect()` — ForkJoinPool에서 병렬 merge sort |

---

## 신뢰도 설계

### 워밍업

실측 전에 모든 방식을 일정 횟수 실행해서 JVM이 코드를 JIT 컴파일(기계어)로 변환하게 한다.
워밍업 없이 측정하면 첫 몇 회는 인터프리터 모드로 실행되어 훨씬 느린 값이 나온다.

```
warmup():
  고정 크기 데이터로 모든 방식을 WARMUP_ROUNDS회 실행
  → 결과 버림
```

### 매 회차마다 새 데이터 생성

같은 배열을 반복 사용하면 CPU 캐시에 올라가 뒤로 갈수록 빨라지는 편향이 생긴다.
매 회차마다 `new Random(42 + i)`로 새 데이터를 만들어 이를 방지한다.
seed를 고정(`42 + i`)하므로 동일 조건으로 재현 가능하다.

```java
// 매 회차: seed 고정으로 재현성 유지, 새 객체로 캐시 편향 방지
List<Integer> data = generateBoxedData(size, 42 + i);
int[]      intData = generateIntData(size, 42 + i);
```

### 복사본으로 정렬

원본 리스트를 정렬하면 이후 회차는 이미 정렬된 데이터를 받게 되어 결과가 편향된다.
매 정렬마다 복사본을 만들어 사용한다.

```java
List<Integer> copy = new ArrayList<>(list);   // stream / for 용
int[]         copy = Arrays.copyOf(arr, ...); // intStream 용
```

### 시간 측정

```java
long start = System.nanoTime();
sort(...);
long end = System.nanoTime();
total += (end - start) / 1_000.0; // ns → μs
```

`System.nanoTime()`은 경과 시간 측정 전용으로, `currentTimeMillis()`보다 정밀하다.

---

## 테스트 1 — 소규모 추세 파악 (planV1)

### 조건

| 항목 | 값 |
|------|----|
| 데이터 크기 | 100 / 1,000 / 10,000 / 100,000 |
| 측정 방식 | for / stream\<Integer\> / parallelStream |
| 워밍업 | 10,000개 × 5회 |
| 실측 라운드 | 10회 평균 |
| 단위 | μs (마이크로초) |

### 결과 (18회 반복 실행 평균)

| 크기 | for (μs) | stream\<Integer\> (μs) | parallelStream (μs) | 최저 |
|------|----------|----------------------|---------------------|------|
| 100 | 8.4 | 12.0 | 188.1 | for |
| 1,000 | 89.5 | 99.7 | 250.7 | for |
| 10,000 | 886.5 | 1,210.3 | 965.8 | for |
| 100,000 | 10,224.5 | 10,747.6 | 5,221.6 | parallelStream |

### 핵심 관찰

- **소규모(100~1,000개)**: `parallelStream`이 스레드 분기 오버헤드로 압도적으로 느림
- **10,000개**: `parallelStream`이 `stream`을 역전하기 시작
- **100,000개**: `parallelStream`이 for 대비 약 2배 빠름
- `stream<Integer>`는 10,000개에서도 `for`보다 느림 → 박싱 오버헤드 의심

---

## 테스트 2 — 박싱 오버헤드 검증 & 대규모 확장 (planV2)

### 배경

planV1에서 `stream<Integer>`가 `for`보다 일관되게 느린 원인을 분석:
`stream().sorted()`는 파이프라인 객체 생성 → `Integer[]`로 materialize → TimSort → List로 collect 과정에서
정렬 비교 연산마다 `Integer` 언박싱이 발생한다.
`IntStream`(`int[]` 기반)과 비교해 박싱 오버헤드가 실제로 얼마나 영향을 주는지 검증한다.

### 조건

| 항목 | 값 |
|------|----|
| 데이터 크기 | 1,000,000 / 5,000,000 / 10,000,000 |
| 측정 방식 | for / stream\<Integer\> / **IntStream\<int\>** / parallelStream |
| 워밍업 | 100,000개 × 5회 (크기 확장에 맞게 상향) |
| 실측 라운드 | 5회 평균 (데이터가 커 5회도 충분) |
| 추가 출력 | `ForkJoinPool.commonPool().getParallelism()` (사용 코어 수) |
| 단위 | μs → ms 환산 표기 |

### 실행 환경

- Java 21, HotSpot JVM, Apple Silicon MacBook Pro
- ForkJoinPool parallelism: **11** (물리 코어 - 1)

### 결과

| 크기 | for (ms) | stream\<Integer\> (ms) | IntStream\<int\> (ms) | parallelStream (ms) | 최저 |
|------|----------|----------------------|----------------------|---------------------|------|
| 1,000,000 | 125.7 | 150.7 | **41.1** | 84.8 | IntStream |
| 5,000,000 | 820.2 | 1,094.6 | **243.8** | 303.4 | IntStream |
| 10,000,000 | 1,954.6 | 2,818.9 | **612.6** | 831.5 | IntStream |

### IntStream 대비 배속

| 크기 | for | stream\<Integer\> | IntStream | parallelStream |
|------|-----|------------------|-----------|----------------|
| 1M | 3.06× | 3.67× | **1.00×** | 2.06× |
| 5M | 3.36× | 4.49× | **1.00×** | 1.24× |
| 10M | 3.19× | 4.60× | **1.00×** | 1.36× |

### 핵심 발견

1. **박싱 오버헤드가 병렬화 이점을 초과한다.**
   10M 기준 `IntStream`(단일 스레드) 613ms < `parallelStream`(11코어) 832ms.
   primitive `int[]` 연산이 11코어 병렬 박싱 연산보다 1.36배 빠르다.

2. **`stream<Integer>`는 `IntStream` 대비 4.6배 느리다.**
   박싱/언박싱 + 파이프라인 materialization 비용의 합산.

3. **`parallelStream`의 실질 가속은 for 대비 약 2.35배.**
   이론적 최대(11배)보다 낮은 이유: 박싱 오버헤드 + ForkJoin merge 비용 + 스레드 동기화.

4. **결론: 숫자 연산 성능이 중요하다면 `IntStream` / `int[]` 사용이 핵심.**
   `parallelStream`은 박싱 타입(`Integer`) 기반으로는 잠재력이 반감된다.

---

## 결과 파일

| 파일 | 내용 |
|------|------|
| `result/planV1-result.html` | 1차 테스트 시각화 (100~100,000개) |
| `result/planV2-result.html` | 2차 테스트 원시 로그 (1M~10M개) |
