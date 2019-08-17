import Bcrypt from "bcrypt";

export class PasswordService {

    private static readonly NB_ROUNDS: number = 10;

    public readonly cipherPassword = async (password: string): Promise<string> => {
        return Bcrypt.hash(password, PasswordService.NB_ROUNDS);
    }

    public readonly validatePassword = async (cipheredPassword: string, password: string): Promise<boolean> => {
        return Bcrypt.compare(password, cipheredPassword);
    }
}
