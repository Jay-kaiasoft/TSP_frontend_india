import { handleConvertUTCDateToLocalDate, handleFormateUTCDateToLocalDate } from '../../../../service/common/commonService';
import './timeCardPDF.css'

const DetailedPDFTable = ({ companyInfo, data, startDate, endDate }) => {
    const map = new Map();

    data?.forEach(entry => {
        const {
            userId,
            userName,
            firstName,
            lastName,
            timeIn,
            timeOut,
            companyShiftDto,
            createdOn,
            hourlyRate
        } = entry;

        const timeInDate = new Date(timeIn);
        const timeOutDate = new Date(timeOut);
        const workedMs = timeOutDate - timeInDate;
        const workedMinutes = workedMs / (1000 * 60);
        const workedHours = workedMinutes / 60;

        const rate = parseFloat(hourlyRate) || 0;
        const amount = parseFloat((workedHours * rate).toFixed(2));

        // Add record to user's map
        if (!map.has(userId)) {
            map.set(userId, {
                userId,
                userName,
                firstName,
                lastName,
                hourlyRate: rate,
                records: []
            });
        }

        map.get(userId).records.push({
            timeIn,
            timeOut,
            createdOn,
            companyShiftDto,
            hourlyRate: rate,
            // workedMinutes: Math.round(workedMinutes),
            // workedHours: workedHours.toFixed(2),
            amount: amount.toFixed(2),
        });
    });

    const result = Array.from(map.values());

    const formatDuration = (timeIn, timeOut) => {
        if (!timeOut) return;

        const diff = new Date(timeOut) - new Date(timeIn);
        if (diff <= 0) return "0 sec";

        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        let result = [];

        if (days > 0) result.push(`${days} day${days > 1 ? "s" : ""}`);
        if (hours > 0) result.push(`${hours} hr${hours > 1 ? "s" : ""}`);
        if (minutes > 0) result.push(`${minutes} min${minutes > 1 ? "s" : ""}`);

        return result.join(" ");
    };

    const header = () => {
        return (
            <thead>
                <tr>
                    <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5">
                        Day
                    </th>
                    <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5">
                        Time In
                    </th>
                    <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5">
                        Time Out
                    </th>
                    <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5">
                        Regular
                    </th>
                    <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5">
                        OT
                    </th>
                    <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5">
                        Total
                    </th>
                </tr>
            </thead>
        )
    }

    const getTotalDurationInMs = (data) => {
        if (data?.length > 0) {
            return data?.reduce((total, row) => {
                if (row.timeIn && row.timeOut) {
                    const diff = new Date(row.timeOut) - new Date(row.timeIn);
                    if (diff > 0) {
                        return total + diff;
                    }
                }
                return total;
            }, 0);
        } else {
            return 0
        }
    };

    const getTotalOT = (data) => {
        if (data?.length > 0) {
            return data.reduce((total, row) => {
                const timeIn = new Date(handleConvertUTCDateToLocalDate(row?.timeIn));
                const timeOut = new Date(handleConvertUTCDateToLocalDate(row?.timeOut));
                const totalHours = parseFloat(row?.companyShiftDto?.totalHours) || 0;

                const workedMs = timeOut - timeIn;
                const workedHours = workedMs / (1000 * 60 * 60); // Convert ms to hours

                const ot = workedHours > totalHours ? workedHours - totalHours : 0;

                return total + ot;
            }, 0);
        } else {
            return 0;
        }
    };

    // const getTotalRegular = (data) => {
    //     return data?.reduce((total, row) => {
    //         return total + (row?.companyShiftDto?.totalHours ? row?.companyShiftDto?.totalHours : 0);
    //     }, 0) || 0;
    // }

    // const getUserTotalAmount = (records) => records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0).toFixed(2);

    const formatTotalDuration = (totalMs) => {
        const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
        const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

        const result = [];
        if (days > 0) result.push(`${days} day${days > 1 ? "s" : ""}`);
        if (hours > 0) result.push(`${hours} hr${hours > 1 ? "s" : ""}`);
        if (minutes > 0) result.push(`${minutes} min${minutes > 1 ? "s" : ""}`);

        return result.join(" ");
    };

    const formatHoursToHrMin = (hours) => {
        const hrs = Math.floor(hours);
        const mins = Math.floor((hours - hrs) * 60);
        return `${hrs} hr ${mins} min`;
    };

    // return (
    //     <div className="overflow-x-auto h-full">
    //         <div id="table-container" className='p-3'>
    //             <div className='flex justify-start items-center mb-2'>
    //                 <div className='grow'>
    //                     <div>
    //                         <img src={companyInfo?.companyLogo} alt="Logo" className="w-40 h-22 border" />
    //                     </div>
    //                 </div>
    //                 <div>
    //                     <h1 className='font-bold text-2xl text-end'>Detailed</h1>
    //                 </div>
    //             </div>
    //             <div className='flex justify-start items-center mb-5'>
    //                 <div className='grow'>
    //                     <div>
    //                         <p className='font-bold text-2xl py-1'>Company: {companyInfo?.companyName}</p>
    //                     </div>
    //                 </div>
    //                 <div>
    //                     <h1 className='font-semibold text-lg text-center'>From: &nbsp;&nbsp;&nbsp; {startDate} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;To:&nbsp;&nbsp;&nbsp; {endDate}</h1>
    //                 </div>
    //             </div>
    //             {
    //                 result?.map((user, index) => (
    //                     <div>
    //                         <h1 className='font-bold my-3'>Name: {user?.firstName} {user?.lastName}</h1>
    //                         <table key={index} className="min-w-full border-collapse border border-gray-500 h-full">
    //                             {header()}
    //                             <tbody>
    //                                 {
    //                                     user?.records?.map((record, index) => {
    //                                         const timeIn = new Date(handleConvertUTCDateToLocalDate(record?.timeIn));
    //                                         const timeOut = new Date(handleConvertUTCDateToLocalDate(record?.timeOut));
    //                                         const createdOn = handleFormateUTCDateToLocalDate(record?.createdOn);
    //                                         const totalHours = parseFloat(record?.companyShiftDto?.totalHours) || 0;

    //                                         const durationMs = timeOut - timeIn;
    //                                         const workedHours = durationMs / (1000 * 60 * 60);

    //                                         let otHours = 0;
    //                                         let regularHours = workedHours;

    //                                         if (workedHours > totalHours) {
    //                                             otHours = workedHours - totalHours;
    //                                             regularHours = totalHours;
    //                                         }

    //                                         const otWholeHours = Math.floor(otHours);
    //                                         const otMinutes = Math.floor((otHours - otWholeHours) * 60);

    //                                         const formattedOT =
    //                                             otWholeHours > 0 || otMinutes > 0
    //                                                 ? `${otWholeHours > 0 ? `${otWholeHours} hrs` : ''}${otMinutes > 0 ? ` ${otMinutes} min` : ''}`.trim()
    //                                                 : '00:00';

    //                                         // const regWholeHours = Math.floor(regularHours);
    //                                         // const regMinutes = Math.floor((regularHours - regWholeHours) * 60);
    //                                         // const formattedRegular =
    //                                         //     regWholeHours > 0 || regMinutes > 0
    //                                         //         ? `${regWholeHours > 0 ? `${regWholeHours} hrs` : ''}${regMinutes > 0 ? ` ${regMinutes} min` : ''}`.trim()
    //                                         //         : '00:00';

    //                                         return (
    //                                             <tr key={index} className="border border-gray-500">
    //                                                 <td className="border border-gray-500 text-center text-sm h-10 ">
    //                                                     {createdOn}
    //                                                 </td>
    //                                                 <td className="border border-gray-500 text-center text-sm h-10">
    //                                                     {timeIn.toLocaleTimeString([], {
    //                                                         hour: '2-digit',
    //                                                         minute: '2-digit',
    //                                                         hour12: true,
    //                                                     })}
    //                                                 </td>
    //                                                 <td className="border border-gray-500 text-center text-sm h-10">
    //                                                     {timeOut.toLocaleTimeString([], {
    //                                                         hour: '2-digit',
    //                                                         minute: '2-digit',
    //                                                         hour12: true,
    //                                                     })}
    //                                                 </td>
    //                                                 <td className="border border-gray-500 text-center text-sm h-10">
    //                                                     {record?.companyShiftDto?.totalHours} h
    //                                                 </td>
    //                                                 <td className="border border-gray-500 text-center text-sm h-10">
    //                                                     {formattedOT}
    //                                                 </td>
    //                                                 <td className="border border-gray-500 text-center text-sm h-10">
    //                                                     {formatDuration(handleConvertUTCDateToLocalDate(record?.timeIn), handleConvertUTCDateToLocalDate(record?.timeOut))}
    //                                                 </td>
    //                                             </tr>
    //                                         );
    //                                     })
    //                                 }
    //                                 <tr className="border border-gray-500">
    //                                     <td className="border border-gray-500 text-sm h-10 text-end pr-5" colSpan={4}>
    //                                         <strong>Totals:</strong>
    //                                     </td>
    //                                     {/* <td className="border border-gray-500 text-center text-sm h-10">
    //                                         <strong>{getTotalRegular(user?.records)}</strong>
    //                                     </td> */}
    //                                     <td className="border border-gray-500 text-center text-sm h-10">
    //                                         <strong>{formatHoursToHrMin(getTotalOT(user?.records))}</strong>
    //                                     </td>
    //                                     <td className="border border-gray-500 text-center text-sm h-10">
    //                                         <strong>
    //                                             {formatTotalDuration(getTotalDurationInMs(user?.records))}
    //                                         </strong>
    //                                     </td>
    //                                 </tr>
    //                             </tbody>
    //                         </table>
    //                     </div>
    //                 ))
    //             }
    //         </div>
    //     </div>
    // )
    return (
        <div className="overflow-x-auto h-full">
            <div id="table-container" className="p-3">
                {result?.map((user, index) => (
                    <div key={user.userId || index} className="pdf-page bg-white border border-black p-4 rounded-md">

                        {/* ===== HEADER (Like Image) ===== */}
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: Logo box */}
                            <div className="w-24 h-20 border border-black rounded-md overflow-hidden flex items-center justify-center">
                                {companyInfo?.companyLogo ? (
                                    <img
                                        src={companyInfo.companyLogo}
                                        alt="Logo"
                                        className="w-full h-full object-contain"
                                    />
                                ) : null}
                            </div>

                            {/* Middle: Company Info */}
                            <div className="flex-1">
                                <div className="text-xl font-bold text-gray-900">{companyInfo?.companyName}</div>
                                {companyInfo?.email && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-semibold text-gray-700">Email:</span> {companyInfo.email}
                                    </div>
                                )}
                                {companyInfo?.phone && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-semibold text-gray-700">Phone:</span> {companyInfo.phone}
                                    </div>
                                )}
                            </div>

                            {/* Right: Title + Period */}
                            <div className="text-right">
                                <div className="text-2xl font-extrabold tracking-wide text-gray-900 mb-2">
                                    DETAILED REPORT
                                </div>
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">Period:</span> {startDate} To {endDate}
                                </div>
                            </div>
                        </div>

                        {/* Divider line */}
                        <div className="border-t border-black my-4" />

                        {/* ===== USERNAME (Replace IT) ===== */}
                        <div className="text-center font-bold text-lg text-gray-900 mb-3">
                            {user?.firstName} {user?.lastName}
                        </div>

                        {/* ===== TABLE ===== */}
                        <table className="min-w-full border-collapse border border-black pdf-table">
                            {header()}
                            <tbody>
                                {user?.records?.map((record, index) => {
                                    const timeIn = new Date(handleConvertUTCDateToLocalDate(record?.timeIn));
                                    const timeOut = new Date(handleConvertUTCDateToLocalDate(record?.timeOut));
                                    const createdOn = handleFormateUTCDateToLocalDate(record?.createdOn);
                                    const totalHours = parseFloat(record?.companyShiftDto?.totalHours) || 0;

                                    const durationMs = timeOut - timeIn;
                                    const workedHours = durationMs / (1000 * 60 * 60);

                                    let otHours = 0;
                                    if (workedHours > totalHours) otHours = workedHours - totalHours;

                                    const otWholeHours = Math.floor(otHours);
                                    const otMinutes = Math.floor((otHours - otWholeHours) * 60);

                                    const formattedOT =
                                        otWholeHours > 0 || otMinutes > 0
                                            ? `${otWholeHours > 0 ? `${otWholeHours} hrs` : ""}${otMinutes > 0 ? ` ${otMinutes} min` : ""}`.trim()
                                            : "00:00";

                                    return (
                                        <tr key={index} className="border border-black">
                                            <td className="border border-black text-center text-sm h-10">
                                                {createdOn}
                                            </td>
                                            <td className="border border-black text-center text-sm h-10">
                                                {timeIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                            </td>
                                            <td className="border border-black text-center text-sm h-10">
                                                {timeOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                            </td>
                                            <td className="border border-black text-center text-sm h-10">
                                                {record?.companyShiftDto?.totalHours} h
                                            </td>
                                            <td className="border border-black text-center text-sm h-10">
                                                {formattedOT}
                                            </td>
                                            <td className="border border-black text-center text-sm h-10">
                                                {formatDuration(
                                                    handleConvertUTCDateToLocalDate(record?.timeIn),
                                                    handleConvertUTCDateToLocalDate(record?.timeOut)
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Totals */}
                                <tr className="border border-black">
                                    <td className="border border-black text-sm h-10 text-end pr-5" colSpan={4}>
                                        <strong>Total:</strong>
                                    </td>
                                    <td className="border border-black text-center text-sm h-10">
                                        <strong>{formatHoursToHrMin(getTotalOT(user?.records))}</strong>
                                    </td>
                                    <td className="border border-black text-center text-sm h-10">
                                        <strong>{formatTotalDuration(getTotalDurationInMs(user?.records))}</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                ))}
            </div>
        </div>
    );

}

export default DetailedPDFTable