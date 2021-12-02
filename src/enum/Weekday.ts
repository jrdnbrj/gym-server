import { registerEnumType } from "type-graphql";

export enum Weekday {
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday",
    Sunday = "Sunday",
}

registerEnumType(Weekday, {
    name: "Weekday",
});
