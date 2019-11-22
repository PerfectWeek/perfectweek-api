/**
 * Normalize a string (See: https://stackoverflow.com/questions/990904)
 */
export function normalize(str: string): string {
    return str
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
