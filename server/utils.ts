export function requireEnv(key: string) {
    const value = process.env[key];
    if (value === undefined) throw new Error(`Env variable "${key}" not set`);
    return value;
}
