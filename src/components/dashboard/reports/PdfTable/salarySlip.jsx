import dayjs from "dayjs";

const numberToWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const c = ['hundred', 'thousand', 'lakh', 'crore'];

    const convertLessThanOneThousand = (n) => {
        let s = '';
        if (n < 20) {
            s = a[n];
        } else {
            s = b[Math.floor(n / 10)] + ' ' + a[n % 10];
        }
        return s;
    };

    if (num === 0) return 'Zero Rupees Only';

    let n = Math.round(num * 100) / 100; // Handle decimals
    let integerPart = Math.floor(n);
    let decimalPart = Math.round((n - integerPart) * 100);

    let output = '';

    // Process crores
    if (integerPart >= 10000000) {
        output += convertLessThanOneThousand(Math.floor(integerPart / 10000000)) + 'crore ';
        integerPart %= 10000000;
    }
    // Process lakhs
    if (integerPart >= 100000) {
        output += convertLessThanOneThousand(Math.floor(integerPart / 100000)) + 'lakh ';
        integerPart %= 100000;
    }
    // Process thousands
    if (integerPart >= 1000) {
        output += convertLessThanOneThousand(Math.floor(integerPart / 1000)) + 'thousand ';
        integerPart %= 1000;
    }
    // Process hundreds
    if (integerPart >= 100) {
        output += convertLessThanOneThousand(Math.floor(integerPart / 100)) + 'hundred ';
        integerPart %= 100;
    }
    // Process remaining
    if (integerPart > 0) {
        output += convertLessThanOneThousand(integerPart);
    }

    output = output.trim();
    output += ' Rupees';

    if (decimalPart > 0) {
        output += ' and ' + convertLessThanOneThousand(decimalPart) + ' Paisa';
    }
    return output + ' Only';
};

const getPayslipPeriodText = (filterValue, currentDate = dayjs()) => {
    const endMonth = currentDate.subtract(1, 'month'); // ✅ Exclude current month
    const startMonth = endMonth.subtract(filterValue - 1, 'month');

    const startFormat = startMonth.format("MMMM");
    const endFormat = endMonth.format("MMMM");
    const startYear = startMonth.format("YYYY");
    const endYear = endMonth.format("YYYY");

    if (filterValue === 1 || startFormat === endFormat) {
        return `Salary Slip for the month of ${endFormat} ${endYear}`;
    } else if (startYear === endYear) {
        return `Salary Slip for the month of ${startFormat} to ${endFormat} ${endYear}`;
    } else {
        return `Salary Slip for the month of ${startFormat} ${startYear} to ${endFormat} ${endYear}`;
    }
};

const getPayPeriodText = (monthsBack, currentDate = dayjs()) => {
    if (!monthsBack || monthsBack <= 0) return "";

    const end = currentDate.subtract(1, 'month'); // ✅ Exclude current month
    const start = end.subtract(monthsBack - 1, 'month');

    const endMonth = end.format("MMMM");
    const endYear = end.format("YYYY");
    const startMonth = start.format("MMMM");
    const startYear = start.format("YYYY");

    if (monthsBack === 1) {
        return `${endMonth} ${endYear}`;
    }

    if (startYear === endYear) {
        return `${startMonth} to ${endMonth} ${endYear}`;
    } else {
        return `${startMonth} ${startYear} to ${endMonth} ${endYear}`;
    }
};

const SalarySlip = ({ data, companyInfo, filter }) => {
    return (
        <div className="font-inter antialiased bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-10 min-h-screen grid grid-cols-1 place-items-center gap-8">
            {
                data?.map((employee, index) => (
                    <div key={index} id={`salary-slip-${index}`} className="salary-slip w-full bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                        {/* Top Blue Bar */}
                        <div className="h-2 bg-gradient-to-r from-[#666cff] to-[#9194fb]"></div>

                        {/* Header Section */}
                        <div className="p-6 sm:p-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{companyInfo.companyName}</h1>
                                {/* <p className="text-sm text-gray-600">{companyInfo.state}, {companyInfo.country}</p> */}
                            </div>
                            {/* Zoho Logo Placeholder - Using a simple SVG for demonstration */}
                            {/* <div className="flex-shrink-0">
                        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100" height="100" rx="20" fill="#F0F0F0" />
                            <path d="M30 40 L50 20 L70 40 L50 60 L30 40 Z" fill="#FF8C00" />
                            <circle cx="50" cy="70" r="15" fill="#4CAF50" />
                            <path d="M30 70 L50 90 L70 70 L50 50 L30 70 Z" fill="#2196F3" />
                        </svg>
                    </div> */}
                        </div>

                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4"> {getPayslipPeriodText(filter?.value)}</h2>

                            {/* Employee Pay Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">EMPLOYEE PAY SUMMARY</h3>
                                    <p className="mb-1"><strong className="w-32 inline-block">Employee Name:</strong> {employee.employeeName}</p>
                                    <p className="mb-1"><strong className="w-32 inline-block">Department:</strong> {employee.departmentName}</p>
                                    <p className="mb-1"><strong className="w-32 inline-block">Pay Period:</strong> {getPayPeriodText(filter?.value)}</p>
                                </div>
                                <div className="text-right md:text-left md:pl-8">
                                    <p className="text-lg font-semibold text-gray-800 mb-2">Employee Net Pay</p>
                                    <p className="text-3xl font-extrabold text-[#666cff] mb-2">₹{employee.netSalary?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Earnings Section */}
                        <div className="grid grid-cols-2 gap-3 p-6 sm:p-8">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">EARNINGS</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left table-auto border-collapse">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                                <th className="p-3 border-b border-gray-300">Component</th>
                                                <th className="p-3 border-b border-gray-300 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-gray-50">
                                                <td className="p-3 border-b border-gray-100">Basic Salary</td>
                                                <td className="p-3 border-b border-gray-100 text-right">₹{employee?.basicSalary?.toLocaleString()}</td>
                                            </tr>
                                            <tr className="hover:bg-gray-50">
                                                <td className="p-3 border-b border-gray-100">Over Time</td>
                                                <td className="p-3 border-b border-gray-100 text-right">₹{employee?.otAmount?.toLocaleString()}</td>
                                            </tr>
                                            <tr className="font-bold bg-blue-50 text-[#666cff]">
                                                <td className="p-3 border-t border-b-2 border-blue-300">Gross Earnings</td>
                                                <td className="p-3 border-t border-b-2 border-blue-300 text-right">₹{employee?.totalEarnings?.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">DEDUCTIONS</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left table-auto border-collapse">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                                <th className="p-3 border-b border-gray-300">Component</th>
                                                <th className="p-3 border-b border-gray-300 text-right">(-)Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-gray-50">
                                                <td className="p-3 border-b border-gray-100">Professional Tax</td>
                                                <td className="p-3 border-b border-gray-100 text-right">₹{employee?.ptAmount?.toLocaleString()}</td>
                                            </tr>
                                            <tr className="hover:bg-gray-50">
                                                {/* ({employee?.pfAmount ? `₹${employee?.pfAmount?.toLocaleString() }`: `${employee?.pfPercentage}%`})/Month */}
                                                <td className="p-3 border-b border-gray-100">Provident Fund</td>
                                                <td className="p-3 border-b border-gray-100 text-right">₹{employee?.totalPfAmount?.toLocaleString()}</td>
                                            </tr>
                                            <tr className="font-bold bg-red-50 text-red-800">
                                                <td className="p-3 border-t border-b-2 border-red-300">Total Deductions</td>
                                                <td className="p-3 border-t border-b-2 border-red-300 text-right">₹{employee?.totalDeductions?.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Net Pay & Footer */}
                        <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-lg font-bold text-gray-800">NET PAY (Gross Earnings - Total Deductions)</p>
                                <p className="text-xl font-bold text-[#666cff]">₹{employee.netSalary?.toLocaleString()}</p>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-md font-bold text-gray-800">Total Net Payable ₹{employee.netSalary?.toLocaleString()} <span className="font-normal italic text-gray-600">({numberToWords(employee.netSalary)})</span></p>
                            </div>

                            <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
                                <p>— This document has been automatically generated by {companyInfo?.companyName}; therefore, a signature is not required. —</p>
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default SalarySlip