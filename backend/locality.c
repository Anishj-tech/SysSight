#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N 8192
#define RUNS 3

int main() {
    double *arr = malloc((size_t)N * N * sizeof(double));

    if (arr == NULL) {
        printf("Memory allocation failed\n");
        return 1;
    }

    // Initialize the array
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            arr[(size_t)i * N + j] = 1.0;
        }
    }

    double row_times[RUNS];
    double col_times[RUNS];
    double total_row = 0.0;
    double total_col = 0.0;

    printf("Array size: %d x %d\n\n", N, N);

    for (int r = 0; r < RUNS; r++) {
        volatile double sum = 0.0;
        clock_t start, end;

        // Row-wise traversal
        start = clock();
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                sum += arr[(size_t)i * N + j];
            }
        }
        end = clock();
        row_times[r] = (double)(end - start) / CLOCKS_PER_SEC;
        total_row += row_times[r];

        // Column-wise traversal
        start = clock();
        for (int j = 0; j < N; j++) {
            for (int i = 0; i < N; i++) {
                sum += arr[(size_t)i * N + j];
            }
        }
        end = clock();
        col_times[r] = (double)(end - start) / CLOCKS_PER_SEC;
        total_col += col_times[r];

        printf("Run %d:\n", r + 1);
        printf("Row-wise time: %.6f seconds\n", row_times[r]);
        printf("Column-wise time: %.6f seconds\n\n", col_times[r]);
    }

    double mean_row = total_row / RUNS;
    double mean_col = total_col / RUNS;
    double ratio = mean_col / mean_row;

    printf("Mean row-wise time: %.6f seconds\n", mean_row);
    printf("Mean column-wise time: %.6f seconds\n", mean_col);
    printf("Column/Row ratio: %.2fx\n", ratio);

    free(arr);

    return 0;
}
