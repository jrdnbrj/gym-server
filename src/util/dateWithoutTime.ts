/**Returns a new Date object with its hours, minutes and seconds set to 0.
 *
 * Doesn't modify the given `date`.
 */
const dateWithoutTime = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);

    return newDate;
};

export default dateWithoutTime;
