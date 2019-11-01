export function envOrThrow(key: string, defaultValue?: string): string {
    const val = process.env[key];

    if (!val) {
        if (!defaultValue) {
            throw new Error(`Missing environment variable "${key}"`);
        }
        return defaultValue;
    }

    return val;
}
