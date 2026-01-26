import dayjs from "dayjs";

export const convertDatesToDayjs = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(convertDatesToDayjs);
    if (typeof obj === "object") {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            if ((key.includes("date") || key.includes("Date")) && value) {
                converted[key] = dayjs(value);
            } else if (typeof value === "object") {
                converted[key] = convertDatesToDayjs(value);
            } else {
                converted[key] = value;
            }
        }
        return converted;
    }
    return obj;
};

export const convertDayjsToStrings = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(convertDayjsToStrings);
    if (dayjs.isDayjs(obj)) return obj.format("YYYY-MM-DD");
    if (typeof obj === "object") {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertDayjsToStrings(value);
        }
        return converted;
    }
    return obj;
};
