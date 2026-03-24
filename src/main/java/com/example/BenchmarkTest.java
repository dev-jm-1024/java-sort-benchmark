package com.example;

import java.util.*;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.Collectors;

public class BenchmarkTest {

    private static final int WARMUP_SIZE   = 100_000;
    private static final int WARMUP_ROUNDS = 5;
    private static final int MEASURE_ROUNDS = 5;
    private static final int[] SIZES = {1_000_000, 5_000_000, 10_000_000};

    public static void main(String[] args) {
        int cores = ForkJoinPool.commonPool().getParallelism();
        System.out.println("사용 코어 수 (ForkJoinPool parallelism): " + cores);
        System.out.println("워밍업 중...");
        warmup();
        System.out.println("워밍업 완료. 측정 시작.\n");

        double[] forResults      = new double[SIZES.length];
        double[] streamResults   = new double[SIZES.length];
        double[] intStreamResults= new double[SIZES.length];
        double[] parallelResults = new double[SIZES.length];

        for (int i = 0; i < SIZES.length; i++) {
            int size = SIZES[i];
            System.out.printf("측정 중: %,d개%n", size);
            forResults[i]       = measure(size, "for");
            streamResults[i]    = measure(size, "stream");
            intStreamResults[i] = measure(size, "intStream");
            parallelResults[i]  = measure(size, "parallel");
        }

        printResults(forResults, streamResults, intStreamResults, parallelResults, cores);
    }

    private static void warmup() {
        for (int i = 0; i < WARMUP_ROUNDS; i++) {
            List<Integer> data    = generateBoxedData(WARMUP_SIZE, 42 + i);
            int[]         intData = generateIntData(WARMUP_SIZE, 42 + i);
            forLoop(data);
            streamSort(data);
            intStreamSort(intData);
            parallelStreamSort(data);
        }
    }

    private static double measure(int size, String method) {
        double total = 0;
        for (int i = 0; i < MEASURE_ROUNDS; i++) {
            long start, end;
            if (method.equals("intStream")) {
                int[] data = generateIntData(size, 42 + i);
                start = System.nanoTime();
                intStreamSort(data);
                end = System.nanoTime();
            } else {
                List<Integer> data = generateBoxedData(size, 42 + i);
                start = System.nanoTime();
                switch (method) {
                    case "for"      -> forLoop(data);
                    case "stream"   -> streamSort(data);
                    case "parallel" -> parallelStreamSort(data);
                }
                end = System.nanoTime();
            }
            total += (end - start) / 1_000.0;
        }
        return total / MEASURE_ROUNDS;
    }

    private static List<Integer> generateBoxedData(int size, long seed) {
        Random random = new Random(seed);
        List<Integer> list = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            list.add(random.nextInt());
        }
        return list;
    }

    private static int[] generateIntData(int size, long seed) {
        Random random = new Random(seed);
        int[] arr = new int[size];
        for (int i = 0; i < size; i++) {
            arr[i] = random.nextInt();
        }
        return arr;
    }

    private static void forLoop(List<Integer> list) {
        List<Integer> copy = new ArrayList<>(list);
        Collections.sort(copy);
    }

    private static void streamSort(List<Integer> list) {
        list.stream().sorted().collect(Collectors.toList());
    }

    private static void intStreamSort(int[] arr) {
        int[] copy = Arrays.copyOf(arr, arr.length);
        Arrays.sort(copy);
    }

    private static void parallelStreamSort(List<Integer> list) {
        list.parallelStream().sorted().collect(Collectors.toList());
    }

    private static void printResults(double[] forRes, double[] streamRes,
                                     double[] intStreamRes, double[] parallelRes,
                                     int cores) {
        String line = "=".repeat(90);
        System.out.println("\n" + line);
        System.out.printf("%-14s  %-16s  %-16s  %-20s  %-16s%n",
                "크기", "for 루프 (μs)", "stream<Integer>", "intStream<int> (μs)", "parallelStream");
        System.out.println(line);
        for (int i = 0; i < SIZES.length; i++) {
            System.out.printf("%-14s  %-16.1f  %-16.1f  %-20.1f  %-16.1f%n",
                    String.format("%,d", SIZES[i]),
                    forRes[i],
                    streamRes[i],
                    intStreamRes[i],
                    parallelRes[i]);
        }
        System.out.println(line);
        System.out.printf("* 워밍업: %,d개 × %d회 | 실측: 각 크기 × %d회 평균%n",
                WARMUP_SIZE, WARMUP_ROUNDS, MEASURE_ROUNDS);
        System.out.println("* JVM: -server -Xms2g -Xmx2g | Java 21");
        System.out.println("* ForkJoinPool parallelism: " + cores + " (물리 코어 - 1)");
    }
}
