import { fileUploadURL } from "../../config/apiConfig/apiConfig"
import axiosInterceptor from "../axiosInterceptor/axiosInterceptor"

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// get user timezone dynamically
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

export const formatUtcToLocal = (utcTime, format = "hh:mm A") => {
    if (!utcTime) return "";
    return dayjs.utc(utcTime).tz(userTimeZone).format(format);
};

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

export const getListOfYears = () => {
    try {
        const currentYear = new Date().getFullYear();
        const startYear = 2000;

        const years = Array.from(
            { length: currentYear - startYear + 1 },
            (_, index) => startYear + index
        );
        return years.map(year => ({ id: year, title: year.toString() }))?.reverse();
    } catch (error) {
        console.error("Error fetching years:", error);
        return [];
    }
}

export const getStaticRoles = () => {
    return [
        {
            id: 1,
            title: 'Owner',
        },
        {
            id: 2,
            title: 'Admin',
        },
        {
            id: 3,
            title: 'Manager',
        },
    ];
}

export const getStaticRolesWithPermissions = () => {
    return getStaticRoles()?.map((item, index) => {
        return {
            roleName: item.title,
            rolesActions: {
                "functionalities": [
                    {
                        "functionalityId": 1,
                        "functionalityName": "Company",
                        "modules": [
                            {
                                "moduleId": 3,
                                "moduleName": "Manage Company",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 5,
                                "moduleName": "Manage Employees",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 9,
                                "moduleName": "Manage Shifts",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                        ]
                    },
                    {
                        "functionalityId": 3,
                        "functionalityName": "Permission",
                        "modules": [
                            {
                                "moduleId": 2,
                                "moduleName": "Role",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 6,
                                "moduleName": "Department",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 15,
                                "moduleName": "Salary Statement",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            }
                        ]
                    },
                    {
                        "functionalityId": 4,
                        "functionalityName": "Time Card",
                        "modules": [
                            {
                                "moduleId": 8,
                                "moduleName": "Clock-In-Out",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                        ]
                    },
                    {
                        "functionalityId": 6,
                        "functionalityName": "Automation Rules",
                        "modules": [
                            {
                                "moduleId": 16,
                                "moduleName": "Overtime Rules",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 18,
                                "moduleName": "Weekly Holidays",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 19,
                                "moduleName": "Holidays Template",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 20,
                                "moduleName": "Late Entry Rules",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                            {
                                "moduleId": 21,
                                "moduleName": "Early Exit Rules",
                                "moduleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ],
                                "roleAssignedActions": [
                                    1,
                                    2,
                                    3,
                                    4
                                ]
                            },
                        ]
                    },
                ]
            }
        }
    })
}

export const apiToLocalTime = (utcString) => {
    if (!utcString) return null;
    return dayjs.utc(utcString, "MM/DD/YYYY, hh:mm:ss A").tz(userTimeZone);
};

export const localToApiTime = (localTime) => {
    if (!localTime) return null;
    return localTime.utc().toISOString(); // ✅ gives "2025-09-06T05:20:14.000Z"
};

export const formatShiftDisplay = (time) => {
    if (!time) return "";

    const start = dayjs.utc(time.start).tz(userTimeZone).format("hh:mm A");
    const end = dayjs.utc(time.end).tz(userTimeZone).format("hh:mm A");

    if (time.shiftType === "Hourly") {
        return `${time.shiftName} (${time.shiftType} - ${time.hours} hrs)`;
    } else if (time.shiftType === "Time Based") {
        return `${time.shiftName} (${time.shiftType} - ${start} - ${end})`;
    } else {
        return time.shiftName;
    }
};