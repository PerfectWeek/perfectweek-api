export class Normalization {
    /**
     * Apply a min-max normalization on `value`, based on `min` and `max`.
     */
    public static readonly minMax = (value: number, min: number, max: number): number => {
        return (value - min) / (max - min);
    }

    /**
     * Apply a softmax normalization on the given `values`
     */
    public static readonly softmax = (values: number[]): number[] => {
        const expSum = values.map(Math.exp).reduce((agg, v) => agg + v);
        return values.map(v => Math.exp(v) / expSum);
    }
}
