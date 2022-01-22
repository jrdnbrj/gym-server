import { Weekday } from "../enum/Weekday";

const intAsWeekday = (dayInt: number): Weekday => {
    switch (dayInt) {
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
        case 7:
            return Weekday.Sunday;
        default:
            throw new Error("Invalid int for Weekday.");
    }
};

export default intAsWeekday;
