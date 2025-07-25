import dayjs from "dayjs";

const getPayslipPeriodText = (filterValue, currentDate = dayjs()) => {
    const endMonth = currentDate.subtract(1, 'month'); // ✅ Exclude current month
    const startMonth = endMonth.subtract(filterValue - 1, 'month');

    const startFormat = startMonth.format("MMMM");
    const endFormat = endMonth.format("MMMM");
    const startYear = startMonth.format("YYYY");
    const endYear = endMonth.format("YYYY");

    if (filterValue === 1 || startFormat === endFormat) {
        return `${endFormat} ${endYear}`;
    } else if (startYear === endYear) {
        return `${startFormat} to ${endFormat} ${endYear}`;
    } else {
        return `Payslip for the month of ${startFormat} ${startYear} to ${endFormat} ${endYear}`;
    }
};

const SalaryStatementPDFTable = ({
    data,
    companyInfo,
    filter,
    department,
    selectedDepartmentId,
    isGrouped = false,
}) => {
    const newDepartment = department?.map((dept) => {
        if (selectedDepartmentId?.includes(dept?.id)) {
            return dept?.title;
        }
        return null;
    }).filter(Boolean);

    // Helper to render a salary table for a list of employees
    const renderSalaryTable = (employees, departmentTitle = null) => {
        const totalEarnings = employees.reduce((sum, emp) => sum + (emp.totalEarnings || 0), 0);
        const otherDeductions = employees.reduce((sum, emp) => sum + (emp.otherDeductions || 0), 0);
        const totalDeductions = employees.reduce((sum, emp) => sum + (emp.totalDeductions || 0), 0);
        const netSalary = employees.reduce((sum, emp) => sum + (emp.netSalary || 0), 0);

        return (
            <div key={departmentTitle}>
                {departmentTitle && (
                    <h2 className="text-lg font-bold text-gray-800 my-5 text-center">
                        {departmentTitle} Department
                    </h2>
                )}
                <table className="min-w-full border-collapse border-2 border-black h-full">
                    <thead>
                        <tr>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">#</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">Name</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">Department</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">Basic Salary</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">OT (₹)</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">PF (₹)</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">PT (₹)</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">Total Earnings</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">Other Deductions</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">Total Deductions</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 capitalize align-middle">Net Salary</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, index) => (
                            <tr key={index} className="border border-black">
                                <td className="border border-black text-center text-sm py-3 align-middle">{index + 1}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">{emp.employeeName}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">{emp.departmentName}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.basicSalary?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.otAmount?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.totalPfAmount?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.ptAmount?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.totalEarnings?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.otherDeductions?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.totalDeductions?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm py-3 font-semibold text-green-700 align-middle">
                                    ₹{emp.netSalary?.toLocaleString()}
                                </td>
                            </tr>
                        ))}

                        {/* ✅ TOTAL ROW */}
                        <tr className="font-bold">
                            <td colSpan={7} className="text-left border border-black py-2 px-2 text-sm">Total:</td>
                            <td className="border border-black text-center text-sm py-2 px-2">₹{totalEarnings.toLocaleString()}</td>
                            <td className="border border-black text-center text-sm py-2 px-2">₹{otherDeductions.toLocaleString()}</td>
                            <td className="border border-black text-center text-sm py-2 px-2">₹{totalDeductions.toLocaleString()}</td>
                            <td className="border border-black text-center text-sm py-2 px-2 text-green-700">₹{netSalary.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };


    return (
        <div className="overflow-x-auto h-full">
            <div id="salary-table-container" style={{ width: '1000px', border: '2px solid black', padding: '16px' }}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-500 pb-4">
                    <div className="flex items-center space-x-4">
                        <img
                            src={companyInfo?.companyLogo}
                            alt="Company Logo"
                            className="w-24 h-24 object-contain border p-1 bg-white"
                        />
                        <div>
                            <h2 className="text-xl font-bold">{companyInfo?.companyName}</h2>
                            {companyInfo?.email && <p className="text-sm my-1">{companyInfo?.email}</p>}
                            {companyInfo?.phone && <p className="text-sm">{companyInfo?.phone}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold uppercase">Salary Statement</h1>
                        <p className="text-sm font-medium text-gray-700 my-1">Period: {getPayslipPeriodText(filter?.value)}</p>
                        {newDepartment.length > 0 && (
                            <p className="text-sm font-medium text-gray-700">
                                Department: {newDepartment.join(', ')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Content */}
                {isGrouped
                    ? Object.entries(data).map(([dept, employees]) =>
                        renderSalaryTable(employees, dept)
                    )
                    : renderSalaryTable(data)}
            </div>
        </div>
    );
};

export default SalaryStatementPDFTable;


// const SalaryStatementPDFTable = ({ data, companyInfo, filter, department, selectedDepartmentId }) => {
//     const newDepartment = department?.map((dept) => {
//         if (selectedDepartmentId?.includes(dept?.id)) {
//             return dept?.title;
//         }
//         return null;
//     }).filter(Boolean);

//     return (
//         <div className="overflow-x-auto h-full">
//             <div id="salary-table-container" style={{ width: '1000px', border: '2px solid black', padding: '16px' }}>
//                 <div className="flex items-center justify-between border-b border-gray-500 pb-4 mb-4">
//                     <div className="flex items-center space-x-4">
//                         <img
//                             src={companyInfo?.companyLogo}
//                             alt="Company Logo"
//                             className="w-24 h-24 object-contain border p-1 bg-white"
//                         />
//                         <div>
//                             <h2 className="text-xl font-bold">{companyInfo?.companyName}</h2>
//                             {companyInfo?.email && <p className="text-sm my-1">{companyInfo?.email}</p>}
//                             {companyInfo?.phone && <p className="text-sm">{companyInfo?.phone}</p>}
//                         </div>
//                     </div>
//                     <div className="text-right">
//                         <h1 className="text-2xl font-bold uppercase">Salary Statement</h1>
//                         <p className="text-sm font-medium text-gray-700 my-1">Period: {filter?.title}</p>
//                         {Array.isArray(newDepartment) && newDepartment.length > 0 && (
//                             <p className="text-sm font-medium text-gray-700">
//                                 Department: {newDepartment.join(', ')}
//                             </p>
//                         )}
//                     </div>

//                 </div>

//                 <table className="min-w-full border-collapse border-2 border-black h-full">
//                     <thead>
//                         <tr>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">#</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Name</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Department</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Basic (₹)</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">OT (₹)</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">PF (₹)</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">PT (₹)</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Total Earnings (₹)</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Total Deductions (₹)</th>
//                             <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Net Salary (₹)</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {data.map((emp, index) => {
//                             return (
//                                 <tr key={index} className="border border-black">
//                                     <td className="border border-black text-center text-sm py-3">{index + 1}</td>
//                                     <td className="border border-black text-center text-sm py-3">{emp.employeeName}</td>
//                                     <td className="border border-black text-center text-sm py-3">{emp.departmentName}</td>
//                                     <td className="border border-black text-center text-sm py-3">₹{emp.basicSalary?.toLocaleString()}</td>
//                                     <td className="border border-black text-center text-sm py-3">₹{emp.otAmount?.toLocaleString()}</td>
//                                     <td className="border border-black text-center text-sm py-3">₹{emp.pfAmount?.toLocaleString()}</td>
//                                     <td className="border border-black text-center text-sm py-3">₹{emp.ptAmount?.toLocaleString()}</td>
//                                     <td className="border border-black text-center text-sm py-3">₹{emp.totalEarnings?.toLocaleString()}</td>
//                                     <td className="border border-black text-center text-sm py-3">₹{emp.totalDeductions?.toLocaleString()}</td>
//                                     <td className="border border-black text-center text-sm py-3">
//                                         ₹{emp.netSalary?.toLocaleString()}
//                                     </td>
//                                 </tr>
//                             );
//                         })}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     )
// }

// export default SalaryStatementPDFTable