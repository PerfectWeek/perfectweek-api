export class PasswordValidator {

    private readonly containsDigitRegex: RegExp;
    private readonly containsLowercaseRegex: RegExp;
    private readonly containsUppercaseRegex: RegExp;
    private readonly containsSymbolRegex: RegExp;

    constructor() {
        this.containsDigitRegex = /[0-9]/;
        this.containsLowercaseRegex = /[a-z]/;
        this.containsUppercaseRegex = /[A-Z]/;
        this.containsSymbolRegex = /[!@#$%^&*(),.?"':;/\\{}|<>\-_+=~`]/;
    }

    public readonly validate = (password: string): boolean => {
        return password.length >= 8
            && this.containsDigitRegex.test(password)
            && this.containsLowercaseRegex.test(password)
            && this.containsUppercaseRegex.test(password)
            && this.containsSymbolRegex.test(password);
    }
}
