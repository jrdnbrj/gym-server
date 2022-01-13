/**Returns a new Date object with its timezone info removed, setting it to UTC.
 *
 * Doesn't modify the given `date`.
 */
export const dateWithoutTimezone = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset);
};
