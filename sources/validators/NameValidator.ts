class NameValidator {

    public readonly validate = (name: string): boolean => {
        return name.trim().length >= 1;
    }
}


export default NameValidator;
