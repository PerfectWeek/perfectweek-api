/**
 * Remove leading and trailing whitespaces from a string if defined
 *
 * @param   str     The string to trim
 *
 * @return  The trimed string if a valid argument is given,
 *          undefined otherwise
 */
export function trim(str: string | undefined): string | undefined {
    return str
        ? str.trim()
        : undefined;
}
