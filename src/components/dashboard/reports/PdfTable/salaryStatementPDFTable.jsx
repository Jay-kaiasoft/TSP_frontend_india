import dayjs from "dayjs";

const SalaryStatementPDFTable = ({
    data,
    companyInfo,
    filter,
    selectedYear,
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
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.basicSalary?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.otAmount?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.totalPfAmount?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.ptAmount?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.totalEarnings?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.otherDeductions?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm py-3 align-middle">₹{emp.totalDeductions?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm py-3 font-semibold align-middle">
                                    ₹{emp.netSalary?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                </td>
                            </tr>
                        ))}

                        {/* ✅ TOTAL ROW */}
                        <tr className="font-bold">
                            <td colSpan={7} className="text-left border border-black py-2 px-2 text-sm">Total:</td>
                            <td className="border border-black text-center text-sm py-2 px-2">₹{totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                            <td className="border border-black text-center text-sm py-2 px-2">₹{otherDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                            <td className="border border-black text-center text-sm py-2 px-2">₹{totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                            <td className="border border-black text-center text-sm py-2 px-2">₹{netSalary.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
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
                        <p className="text-sm font-medium text-gray-700 my-1">Period: {filter?.title}-{selectedYear}</p>
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