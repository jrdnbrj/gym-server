/**Returns a new Date object with its hours, minutes and seconds set to 0. Also, it removes timezone info, setting it to UTC.
 *
 * Doesn't modify the given `date`.
 */
const dateWithoutTime = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const newDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    return new Date(newDate.getTime() - offset);
};

export default dateWithoutTime;
