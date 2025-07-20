import { fileUploadURL } from "../../config/apiConfig/apiConfig"
import axiosInterceptor from "../axiosInterceptor/axiosInterceptor"

export const indianOrganizationType = [
    {
        id: 1,
        title: "Sole Proprietorship"
    },
    {
        id: 2,
        title: "Partnership"
    },
    {
        id: 3,
        title: "Limited Liability Partnership"
    },
    {
        id: 4,
        title: "Private Limited Companies"
    },
    {
        id: 5,
        title: "Public Limited Companies"
    },
    {
        id: 6,
        title: "One-Person Companies"
    },
    {
        id: 7,
        title: "Section 8 Company"
    },
    {
        id: 8,
        title: "Joint-Venture Company"
    },
    {
        id: 9,
        title: "Non-Government Organization (NGO)"
    },
    { id: 10, title: "Co-operative Society" },
    { id: 11, title: "Trust" },
    { id: 12, title: "Producer Company" },
    { id: 13, title: "Public Sector Undertaking (PSU)" },
    { id: 14, title: "Hindu Undivided Family (HUF)" },
    { id: 15, title: "Non-Banking Financial Company (NBFC)" },

];

export const oganizationType = [
    { id: 1, title: 'Sole Proprietorship' },
    { id: 2, title: 'Partnership' },
    { id: 3, title: 'Limited Liability Company (LLC)' },
    { id: 4, title: 'Professional Limited Liability Company (PLLC)' },
    { id: 5, title: 'S Corporation' },
    { id: 6, title: 'C Corporation' },
    { id: 7, title: 'Nonprofit', },
    { id: 8, title: 'Government Agency' },
    { id: 9, title: 'Educational Institution' },
    { id: 10, title: 'Franchise' },
];

export const uploadFiles = async (data) => {
    try {
        const response = axiosInterceptor().post(`${fileUploadURL}`, data)
        return response

    } catch (error) {
        console.log(error)
    }
}

export const handleConvertUTCDateToLocalDate = (utcDateString) => {
    if (!utcDateString) return null;

    try {
        // Parse the UTC date string
        const [datePart, timePart] = utcDateString.split(', ');
        const [month, day, year] = datePart.split('/');
        const [time, period] = timePart.split(' ');
        const [hours, minutes, seconds] = time.split(':');

        // Convert to 24-hour format
        let hours24 = parseInt(hours, 10);
        if (period === 'PM' && hours24 !== 12) hours24 += 12;
        if (period === 'AM' && hours24 === 12) hours24 = 0;

        // Create a Date object in UTC and convert to local time
        return new Date(Date.UTC(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            hours24,
            parseInt(minutes, 10),
            parseInt(seconds, 10)
        ));
    } catch (error) {
        console.error("Conversion error:", error);
        return null;
    }
};

export function handleFormateUTCDateToLocalDate(utcDateString) {
    const date = new Date(utcDateString);

    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });

    return `${month} ${day}, ${weekday}`;
}

export const fetchAllTimeZones = async () => {
    try {
        // const response = axiosInterceptor().get(`${timeZoneURL}`)
        // const timeZones = response?.data?.result;

        const response = await fetch(`https://timeapi.io/api/timezone/availabletimezones`)
        const timeZones = await response.json();
        const formattedTimeZones = timeZones?.map((zone, index) => {
            const now = new Date();

            const formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: zone,
                timeZoneName: "longOffset",
            });

            const parts = formatter.formatToParts(now);
            let offsetString = parts.find((part) => part.type === "timeZoneName")?.value || "";
            offsetString = offsetString.replace("GMT", "UTC");

            return { id: index + 1, title: `(${offsetString}) ${zone}`, zone: `${zone}` };
        });
        return formattedTimeZones;
        // return response;
    } catch (error) {
        console.error("Error fetching time zones:", error);
        return []; // Return an empty array on failure
    }
}

export const getAllCountryList = async () => {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/all`, {
            method: 'GET',
        })
        const data = await response.json();
        const simplifiedData = data?.map((country, index) => ({
            id: index + 1,
            title: country.name?.common || '',
            flag: country.flags?.png || '',
        }));
        return simplifiedData;
    } catch (error) {
        console.log(error)
    }
}