import { dateWithoutTimezone } from "./dateWithoutTimezone";

/**Returns a new Date object with its hours, minutes and seconds set to 0. Also, it removes timezone info, setting it to UTC.
 *
 * Doesn't modify the given `date`.
 */
const dateWithoutTime = (date: Date) => {
    return dateWithoutTimezone(
        new Date(date.getFullYear(), date.getMonth(), date.getDate())
    );
};

export default dateWithoutTime;
