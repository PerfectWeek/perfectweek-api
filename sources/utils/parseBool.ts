import Yn from "yn";

export function parseBool(value: string): boolean | undefined {
    const bool = Yn(value);
    if (bool === null) {
        return undefined;
    }

    return bool;
}
