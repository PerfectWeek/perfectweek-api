class DateService {

    // From https://stackoverflow.com/a/43794682/6864469
    public readonly MIN_DATE: Date;
    public readonly MAX_DATE: Date;

    constructor() {
        this.MIN_DATE = new Date(-8640000000000000);
        this.MAX_DATE = new Date(8640000000000000);
    }

    public readonly isValidDate = (date: Date): boolean => {
        return !isNaN(date.getTime());
    };
}


export default DateService;
