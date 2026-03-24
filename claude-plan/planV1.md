# 계획: Java 반복문 vs 스트림 성능 벤치마크 구현

## Context

Java의 `for` 루프 / `stream` / `parallelStream` 세 방식의 정렬 성능을 데이터 크기별로 비교한다.
숫자 절대값보다 **크기 증가에 따른 상대적 추세**를 파악하는 것이 목적이다.
신뢰도 있는 측정을 위해 JVM 워밍업, 매 회차 신규 데이터 생성, 고정 seed 재현성을 설계에 반영한다.

---

## 대상 파일

| 작업 | 경로 |
|------|------|
| 신규 생성 | `src/main/java/com/example/BenchmarkTest.java` |
| 계획 저장 | `claude-plan/planV1.md` (루트 바로 밑 신규 디렉터리) |
| 기존 유지 | `src/main/java/com/example/Main.java` (변경 없음) |

---

## 구현 계획

### 1. BenchmarkTest.java 생성

**패키지:** `com.example`

**클래스 구성:**

```
BenchmarkTest
├── main()                   // 전체 흐름: 워밍업 → 각 크기별 측정 → 출력
├── warmup()                 // 고정 10,000개 × 5회 실행 (결과 버림)
├── measure(int size, ...)   // 10회 실행 후 평균(μs) 반환
├── forLoop(List<Integer>)          // Collections.sort(copy)
├── streamSort(List<Integer>)       // stream().sorted().collect()
└── parallelStreamSort(List<Integer>) // parallelStream().sorted().collect()
```

### 2. 데이터 생성 전략

- 매 회차마다 `new Random(42 + 회차번호)`로 신규 리스트 생성
  - CPU 캐시 편향 방지
  - seed 고정으로 재현성 유지
- 워밍업용 데이터와 실측용 데이터는 별도 생성 (크기 혼용 금지)

### 3. 정렬 구현

```java
// forLoop: 복사본에 Collections.sort
void forLoop(List<Integer> list) {
    List<Integer> copy = new ArrayList<>(list);
    Collections.sort(copy);
}

// streamSort: 스트림 파이프라인
void streamSort(List<Integer> list) {
    list.stream().sorted().collect(Collectors.toList());
}

// parallelStreamSort: 병렬 스트림 파이프라인
void parallelStreamSort(List<Integer> list) {
    list.parallelStream().sorted().collect(Collectors.toList());
}
```

> 원본 보호를 위해 매번 복사본으로 정렬한다.

### 4. 시간 측정

- `System.nanoTime()` 으로 각 정렬 호출 전후 측정
- 나노초 → 마이크로초 변환: `(end - start) / 1_000.0`
- 10회 실행 평균값 사용

### 5. 워밍업 설계

```
warmup():
  고정 10,000개 리스트 × 5회
  → forLoop, streamSort, parallelStreamSort 모두 실행
  → 결과 버림 (JIT 컴파일 유도 목적)
```

### 6. main() 흐름

```
1. warmup() 호출
2. int[] sizes = {100, 1_000, 10_000, 100_000}
3. 각 size에 대해 measure() 3번 호출 (for/stream/parallel)
4. 결과 출력
```

### 7. 출력 형식

```
========================================================================
크기              for 루프 (μs)     stream (μs)       parallelStream (μs)
========================================================================
100               12.30             18.50             210.40
1,000             95.20             110.30            180.60
10,000            1,023.40          1,105.20          620.30
100,000           12,450.10         13,200.80         5,840.20
========================================================================
* 워밍업: 고정 10,000개 × 5회 | 실측: 각 크기 × 10회 평균
* JVM: -server -Xms2g -Xmx2g | Java 21
```

- `String.format`으로 컬럼 정렬 (`%-16s`, `%-18.2f` 등)
- 천 단위 구분자는 `String.format("%,d", size)` 활용

---

## 실행 방법

```bash
# 컴파일
mvn compile

# 실행 (JVM 옵션 포함)
java -server -Xms2g -Xmx2g -cp target/classes com.example.BenchmarkTest
```

---

## 검증 방법

1. 컴파일 오류 없이 빌드 성공 확인
2. 출력 테이블 형식이 명세와 일치하는지 확인
3. `parallelStream`이 소규모(100)에서는 느리고, 대규모(100,000)에서는 빨라지는 추세 확인
4. 동일 seed로 재실행 시 동일한 결과 재현 확인

---

## 변경 이력

| 버전 | 내용 |
|------|------|
| v1 | 최초 작성. JVM 힙 512m → 2g 변경 (GC 간섭 최소화 목적) |
