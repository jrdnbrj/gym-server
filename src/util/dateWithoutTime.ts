import { DateTime } from "luxon";

/**Returns a new Date object with its hours, minutes and seconds set to 0. Also, it removes timezone info, setting it to UTC.
 *
 * Doesn't modify the given `date`.
 */
const dateWithoutTime = (date: DateTime) => {
    return date.set({ hour: 0, minute: 0, millisecond: 0 });
};

export default dateWithoutTime;
