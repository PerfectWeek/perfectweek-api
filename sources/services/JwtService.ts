import Jwt from "jsonwebtoken";

export class JwtService {

    private readonly privateKey: string;

    constructor(privateKey: string) {
        this.privateKey = privateKey;
    }

    public readonly tokenize = (data: any): string => {
        return Jwt.sign({ data: data }, this.privateKey);
    }

    public readonly decode = (token: string): any => {
        const { data: data } = <any> Jwt.verify(token, this.privateKey);
        return data;
    }
}

export function decodeUserToken(jwtService: JwtService, token: string): number | undefined {
    try {
        const { id: userId }: { id: number } = jwtService.decode(token);
        return userId;
    } catch (_) {
        return undefined;
    }
}
