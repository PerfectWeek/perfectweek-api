export class TimeSlot {
    public startTime: Date;
    public endTime: Date;
    public score: number;

    constructor(
        startTime: Date,
        endTime: Date,
        score: number,
    ) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.score = score;
    }
}
