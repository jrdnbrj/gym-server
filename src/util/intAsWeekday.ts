import { Weekday } from "../enum/Weekday";

const intAsWeekday = (dayInt: number): Weekday => {
    switch (dayInt) {
        case 0:
            return Weekday.Sunday;
        case 1:
            return Weekday.Monday;
        case 2:
            return Weekday.Tuesday;
        case 3:
            return Weekday.Wednesday;
        case 4:
            return Weekday.Thursday;
        case 5:
            return Weekday.Friday;
        case 6:
            return Weekday.Saturday;
        default:
            throw new Error("Invalid int for Weekday.");
    }
};

export default intAsWeekday;
