class EmailValidator {

    private readonly emailRegex: RegExp;

    constructor() {
        this.emailRegex = /^\w+(?:\.\w+)*@\w+(?:\.\w+)+$/;
    }

    public readonly validate = (email: string): boolean => {
        return this.emailRegex.test(email);
    }
}


export default EmailValidator;
