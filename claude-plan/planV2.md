# planV2: 벤치마크 확장 — 박싱 오버헤드 & 대규모 데이터 검증

## 배경 및 목적

planV1(100~100,000개) 결과에서 `stream<Integer>`가 10,000개에서도 `for` 루프보다 느린 현상이 관찰됨.
원인 가설: **파이프라인 객체 생성 비용 + Integer 박싱/언박싱 오버헤드**가 Lazy evaluation 이점을 상쇄.
이를 검증하기 위해 `IntStream`(primitive `int[]` 기반)을 추가하고, 데이터 크기를 1M~10M으로 확장.

---

## planV1 대비 변경 사항

| 항목 | planV1 | planV2 |
|------|--------|--------|
| 데이터 크기 | 100 / 1K / 10K / 100K | 1M / 5M / 10M |
| 측정 방식 수 | 3 (for / stream / parallel) | 4 (for / stream / IntStream / parallel) |
| 측정 라운드 | 10회 | 5회 (데이터 커서 5회도 충분) |
| 워밍업 크기 | 10,000개 | 100,000개 (확장에 맞게 상향) |
| 추가 출력 | 없음 | ForkJoinPool 코어 수 |

---

## 추가된 구현

### IntStream 데이터 생성
```java
private static int[] generateIntData(int size, long seed) {
    Random random = new Random(seed);
    int[] arr = new int[size];
    for (int i = 0; i < size; i++) arr[i] = random.nextInt();
    return arr;
}
```

### IntStream 정렬
```java
private static void intStreamSort(int[] arr) {
    int[] copy = Arrays.copyOf(arr, arr.length);
    Arrays.sort(copy);  // primitive 배열 → 박싱 없음
}
```

### 코어 수 출력
```java
int cores = ForkJoinPool.commonPool().getParallelism();
```

---

## 실행 환경

- Java 21 (HotSpot JVM, -server -Xms2g -Xmx2g)
- ForkJoinPool parallelism: **11** (물리 코어 - 1)
- MacBook Pro (Apple Silicon)

---

## 결과 요약

| 크기 | for (ms) | stream\<Integer\> (ms) | IntStream\<int\> (ms) | parallelStream (ms) |
|------|----------|----------------------|----------------------|---------------------|
| 1,000,000 | 125.7 | 150.7 | **41.1** | 84.8 |
| 5,000,000 | 820.2 | 1,094.6 | **243.8** | 303.4 |
| 10,000,000 | 1,954.6 | 2,818.9 | **612.6** | 831.5 |

### IntStream 대비 배속

| 크기 | for | stream\<Integer\> | IntStream | parallelStream |
|------|-----|------------------|-----------|----------------|
| 1M | 3.06× | 3.67× | 1.00× | 2.06× |
| 5M | 3.36× | 4.49× | 1.00× | 1.24× |
| 10M | 3.19× | 4.60× | 1.00× | 1.36× |

---

## 주요 발견

1. **박싱 오버헤드가 병렬화 이점을 초과한다.**
   - 10M 기준: `IntStream` 613ms vs `parallelStream`(11코어) 832ms
   - 단일 스레드 primitive 연산이 11코어 병렬 박싱 연산보다 **1.36배 빠름**

2. **`stream<Integer>`는 `IntStream` 대비 4.6배 느리다.**
   - 순수 박싱/언박싱 오버헤드 + 파이프라인 materialization 비용의 합산

3. **`parallelStream`의 실질 배속은 for 대비 약 2.35배.**
   - 이론적 최대치(11코어)보다 낮은 이유: 박싱 오버헤드 + 병렬 merge 비용

4. **결론: 성능이 중요한 숫자 연산에서는 `IntStream`/`int[]` 사용이 핵심.**

---

## 결과 파일

- `result/planV2-result.html`
