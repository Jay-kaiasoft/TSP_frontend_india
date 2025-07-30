import { useEffect, useState, useMemo } from "react";
import { getAllEmployeeListByCompanyId } from "../../../../service/companyEmployee/companyEmployeeService";
import { Controller, set, useForm } from "react-hook-form";
import Select from "../../../common/select/select";
import { getAllDepartment } from "../../../../service/department/departmentService";
import SelectMultiple from "../../../common/select/selectMultiple";
import DataTable from "../../../common/table/table"; // Your custom DataTable
import Button from "../../../common/buttons/button";
import CustomIcons from "../../../common/icons/CustomIcons";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SalaryStatementPDFTable from "../PdfTable/salaryStatementPDFTable";
import { getCompanyDetails } from "../../../../service/companyDetails/companyDetailsService";
import SalarySlip from "../PdfTable/salarySlip";
import { getListOfYears } from "../../../../service/common/commonService";
import { handleSetTitle } from "../../../../redux/commonReducers/commonReducers";
import { connect } from "react-redux";
import { getAllHistory } from "../../../../service/salaryStatementHistory/salaryStatementHistoryService";
import SalaryStatementModel from "../../../models/salaryStatement/SalaryStatementModel";
import Components from "../../../muiComponents/components";
import PermissionWrapper from "../../../common/permissionWrapper/PermissionWrapper";

const filterOptions = [
    { id: 1, title: 'January', value: 1 },
    { id: 2, title: 'February', value: 2 },
    { id: 3, title: 'March', value: 3 },
    { id: 4, title: 'April', value: 4 },
    { id: 5, title: 'May', value: 5 },
    { id: 6, title: 'June', value: 6 },
    { id: 7, title: 'July', value: 7 },
    { id: 8, title: 'August', value: 8 },
    { id: 9, title: 'September', value: 9 },
    { id: 10, title: 'October', value: 10 },
    { id: 11, title: 'November', value: 11 },
    { id: 12, title: 'December', value: 12 }
];

const SalaryReport = ({ handleSetTitle }) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const [years, setYears] = useState([]);

    const [users, setUsers] = useState([]);
    const [department, setDepartment] = useState([]);
    const [row, setRow] = useState([]); // This will hold the raw data from the API
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [loadingSalarySlipPdf, setLoadingSalarySlipPdf] = useState(false);

    const [showPdfContent, setShowPdfContent] = useState(false);
    const [showSalarySlipPdfContent, setSalarySlipPdfContent] = useState(false);

    const [companyInfo, setCompanyInfo] = useState();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [open, setOpen] = useState(false);
    const [salaryStatementId, setSalaryStatementId] = useState(null);

    const {
        control,
        watch,
        setValue,
    } = useForm({
        defaultValues: {
            selectedUserId: [],
            selectedDepartmentId: [],
            selectedMonth: [],
            month: []
        }
    });

    const handleOpenSalaryStatementModel = (id) => {
        setSalaryStatementId(id);
        setOpen(true);
    };

    const handleCloseSalaryStatementModel = () => {
        setSalaryStatementId(null);
        setOpen(false);
    };

    const handleGetStatements = async () => {
        const selectedMonths = filterOptions.filter(option => watch("selectedMonth")?.includes(option.id)).map(option => {
            return "" + option.title + "-" + selectedYear;
        });

        let data = {
            month: selectedMonths || [],
            employeeIds: watch("selectedUserId") || [],
            departmentIds: watch("selectedDepartmentId") || [],
        };
        try {
            if (selectedMonths && selectedYear) {
                const res = await getAllHistory(data);
                if (res?.data?.status === 200) {
                    const newData = res.data.result?.map((item, index) => ({
                        ...item,
                        id: item.id,
                        rowId: index + 1
                    }));
                    setRow(newData || []);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleGetAllUsers = async () => {
        if (userInfo?.companyId) {
            const response = await getAllEmployeeListByCompanyId(userInfo?.companyId);
            const data = response.data.result?.map((row) => {
                return {
                    id: row.employeeId,
                    title: row.userName
                };
            });
            setUsers(data);
        }
    };

    const handleGetAllDepartment = async () => {
        if (userInfo?.companyId) {
            const response = await getAllDepartment(userInfo?.companyId);
            if (response.data.status === 200) {
                const data = response.data?.result?.map((item) => {
                    return {
                        id: item?.id,
                        title: item?.departmentName,
                    };
                });
                setDepartment(data);
            }
        }
    };

    const handleGetCompanyInfo = async () => {
        if (userInfo?.companyId) {
            const response = await getCompanyDetails(userInfo?.companyId);
            setCompanyInfo(response?.data?.result);
        }
    };

    const handleGetAllYears = async () => {
        const years = await getListOfYears();
        setYears(years);
    }

    useEffect(() => {
        handleSetTitle("Salary Report");
        const today = new Date();
        const lastMonth = today.getMonth();
        const defaultFilter = filterOptions.find(option => option.value === (lastMonth === 0 ? 12 : lastMonth));
        setValue("selectedMonth", [defaultFilter?.id]);
        handleGetAllYears();
        handleGetCompanyInfo();
        handleGetAllUsers();
        handleGetAllDepartment();
    }, []);

    useEffect(() => {
        handleGetStatements();
    }, [watch("selectedUserId"), watch("selectedDepartmentId"), watch("selectedMonth"), selectedYear]);

    const groupedDataForDisplay = useMemo(() => {
        if (row.length === 0) return null;

        const allDepartments = {};
        row.forEach(item => {
            const deptName = item.departmentName || 'N/A';
            if (!allDepartments[deptName]) {
                allDepartments[deptName] = [];
            }
            allDepartments[deptName].push(item);
        });

        if (watch("selectedDepartmentId") && watch("selectedDepartmentId").length > 0) {
            const filteredGroups = {};
            watch("selectedDepartmentId").forEach(id => {
                const dept = department.find(d => d.id === id);
                if (dept && allDepartments[dept.title]) {
                    filteredGroups[dept.title] = allDepartments[dept.title];
                }
            });
            return filteredGroups;
        }

        return allDepartments;
    }, [row, watch("selectedDepartmentId"), department]);

    const calculateTotals = (dataToSum) => {
        const totalEarnings = dataToSum.reduce((sum, item) => sum + (item.totalEarnings || 0), 0);
        const otherDeductions = dataToSum.reduce((sum, item) => sum + (item.otherDeductions || 0), 0);
        const totalDeductions = dataToSum.reduce((sum, item) => sum + (item.totalDeductions || 0), 0);
        const netSalary = dataToSum.reduce((sum, item) => sum + (item.netSalary || 0), 0);
        return { totalEarnings, otherDeductions, totalDeductions, netSalary };
    };

    // Calculate totals for each grouped department
    const groupedDepartmentTotals = useMemo(() => {
        if (groupedDataForDisplay) {
            const departmentTotals = {};
            for (const deptName in groupedDataForDisplay) {
                departmentTotals[deptName] = calculateTotals(groupedDataForDisplay[deptName]);
            }
            return departmentTotals;
        }
        return null;
    }, [groupedDataForDisplay]);

    // Calculate overall totals (this is still used for the PDF, but not for display in this component)
    const overallTotals = useMemo(() => calculateTotals(row), [row]);

    // Function to create a special total row object for DataGrid
    const createDataGridTotalRow = (totals, idPrefix) => {
        const uniqueId = `${idPrefix}-total-row`;
        return {
            id: uniqueId, // DataGrid requires an 'id' field
            rowId: 'Total', // This will appear in the '#' column
            employeeName: null, // This will appear in the 'Employee Name' column
            departmentName: '', // Empty for total row
            basicSalary: null,
            otAmount: null,
            totalPfAmount: null,
            ptAmount: null,
            totalEarnings: totals.totalEarnings,
            otherDeductions: totals.otherDeductions || 0, // Ensure this field exists
            totalDeductions: totals.totalDeductions,
            netSalary: totals.netSalary,
            isTotalRow: true, // Custom flag to identify this row for styling in DataGrid
        };
    };

    const columns = [
        // { field: 'rowId', headerName: '#', headerClassName: 'uppercase', flex: 1, maxWidth: 100 },
        { field: 'employeeName', headerName: 'Employee Name', headerClassName: 'uppercase', flex: 1, maxWidth: 180 },
        { field: 'departmentName', headerName: 'Department', headerClassName: 'uppercase', flex: 1, maxWidth: 180 },
        {
            field: 'basicSalary', headerName: 'Basic Salary', headerClassName: 'uppercase', flex: 1, maxWidth: 150,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'otAmount', headerName: 'OT (₹)', headerClassName: 'uppercase', flex: 1, maxWidth: 120,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'totalPfAmount', headerName: 'PF (₹)', headerClassName: 'uppercase', flex: 1, maxWidth: 120,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'ptAmount', headerName: 'PT (₹)', headerClassName: 'uppercase', flex: 1, maxWidth: 120,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'totalEarnings', headerName: 'Total Earnings', headerClassName: 'uppercase', flex: 1, maxWidth: 200,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'otherDeductions', headerName: 'Other Deductions', headerClassName: 'uppercase', flex: 1, maxWidth: 200,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'totalDeductions', headerName: 'Total Deductions', headerClassName: 'uppercase', flex: 1, maxWidth: 200,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'netSalary', headerName: 'Net Salary', headerClassName: 'uppercase', flex: 1, maxWidth: 180,
            align: "right", headerAlign: "right", renderCell: (params) => <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'action',
            headerName: 'action',
            headerClassName: 'uppercase',
            renderCell: (params) => {
                if (!params.row.isTotalRow) {
                    return (
                        <div className='flex items-center gap-2 justify-center h-full'>
                            <PermissionWrapper
                                functionalityName="Company"
                                moduleName="Salary Statement"
                                actionId={2}
                                component={
                                    <div className='bg-blue-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                        <Components.IconButton onClick={() => handleOpenSalaryStatementModel(params.row.id)}>
                                            <CustomIcons iconName={'fa-solid fa-pen-to-square'} css='cursor-pointer text-white h-4 w-4' />
                                        </Components.IconButton>
                                    </div>
                                }
                            />
                        </div>
                    );
                }
            },
        },
    ];

    const getRowIdForDataGrid = (rowItem) => rowItem.id;

    const generatePDF = async () => {
        setShowPdfContent(true);
        setLoadingPdf(true);

        setTimeout(async () => {
            const element = document.getElementById("salary-table-container");
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 1.5, // Reduce scale
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.6); // Use JPEG with compression
            const pdf = new jsPDF({
                orientation: "p",
                unit: "mm",
                format: "a4",
                compress: true, // Enable compression
            });

            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
            pdf.save("employee_salary_statement.pdf");

            setShowPdfContent(false);
            setLoadingPdf(false);
        }, 700);
    };

    const generateSalarySlipPDF = async () => {
        setSalarySlipPdfContent(true);
        setLoadingSalarySlipPdf(true);

        setTimeout(async () => {
            const pdf = new jsPDF("p", "mm", "a4");
            const margin = 10;
            const imgWidth = 210 - 2 * margin;
            let yOffset = margin;

            const salarySlipElements = document.querySelectorAll(".salary-slip");

            for (let i = 0; i < salarySlipElements.length; i++) {
                const element = salarySlipElements[i];

                // Force display in case it's hidden
                element.style.display = "block";

                const canvas = await html2canvas(element, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: "#fff",
                    // width: 794,
                    windowWidth: 794,
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.8);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (i > 0) {
                    pdf.addPage();
                    yOffset = margin;
                }

                pdf.addImage(imgData, "JPEG", margin, yOffset, imgWidth, imgHeight);
            }

            pdf.save("employee_salary_slip.pdf");

            setSalarySlipPdfContent(false);
            setLoadingSalarySlipPdf(false);
        }, 700);
    };

    const actionButtons = () => {
        return (
            <div className='flex justify-start items-center gap-3 w-[28rem]'>
                <Button type={`button`} text={'Download Salary Slip'} isLoading={loadingSalarySlipPdf} onClick={() => generateSalarySlipPDF()} startIcon={<CustomIcons iconName="fa-solid fa-file-pdf" css="h-5 w-5" />} />

                <Button type={`button`} useFor={'error'} text={'Download Statement'} isLoading={loadingPdf} onClick={() => generatePDF()} startIcon={<CustomIcons iconName="fa-solid fa-file-pdf" css="h-5 w-5" />} />
            </div>
        );
    };

    return (
        <>
            <div className='py-2 px-4 lg:p-4 border rounded-lg bg-white'>
                <div className='grid grid-col-12 md:grid-cols-5 gap-3 items-center'>
                    <div>
                        <Select
                            options={years}
                            label={"Select Year"}
                            placeholder="Select Year"
                            value={selectedYear}
                            onChange={(_, newValue) => {
                                setSelectedYear(newValue?.id);
                            }}
                        />
                    </div>

                    <div>
                        <Controller
                            name="selectedMonth"
                            control={control}
                            render={({ field }) => (
                                <SelectMultiple
                                    options={filterOptions}
                                    label={"Select Months"}
                                    placeholder="Select months"
                                    value={field.value || []}
                                    onChange={(newValue) => {
                                        // setValue("selectedMonth", newValue);
                                        field.onChange(newValue);
                                    }}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Controller
                            name="selectedUserId"
                            control={control}
                            render={({ field }) => (
                                <SelectMultiple
                                    options={users}
                                    label={"Select Employees"}
                                    placeholder="Select employees"
                                    value={field.value || []}
                                    onChange={(newValue) => {
                                        field.onChange(newValue);
                                    }}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Controller
                            name="selectedDepartmentId"
                            control={control}
                            render={({ field }) => (
                                <SelectMultiple
                                    options={department}
                                    label={"Select Department"}
                                    placeholder="Select department"
                                    value={field.value || []}
                                    onChange={(newValue) => {
                                        field.onChange(newValue);
                                    }}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="mt-4">
                    {groupedDataForDisplay && Object.keys(groupedDataForDisplay).length > 0 ? (
                        <div>
                            <div className="mb-4 flex justify-end">
                                {actionButtons()}
                            </div>
                            {Object.entries(groupedDataForDisplay).map(([departmentName, employees]) => {
                                // Filter columns: remove 'departmentName' from the grouped tables
                                const departmentTableColumns = columns.filter(col => col.field !== 'departmentName');
                                const departmentTotal = groupedDepartmentTotals[departmentName];

                                return (
                                    <div key={departmentName} className="mb-6 border p-4 rounded-lg shadow-sm">
                                        <h3 className="text-lg font-semibold mb-3 text-gray-700 capitalize">{departmentName.toLocaleLowerCase().endsWith("department") ? departmentName : `${departmentName} department`}</h3>
                                        <DataTable
                                            columns={departmentTableColumns}
                                            rows={employees}
                                            getRowId={getRowIdForDataGrid}
                                            height={employees.length > 0 ? 350 : 150} // Adjust height dynamically
                                            showButtons={false} // No individual buttons for department tables
                                            footerRowData={employees.length > 0 ? createDataGridTotalRow(departmentTotal, departmentName) : null}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            rows={row} // This will be empty
                            getRowId={getRowIdForDataGrid}
                            height={550}
                            showButtons={true}
                            buttons={actionButtons}
                            footerRowData={null} // No total row if no data
                        />
                    )}
                </div>
            </div>
            <SalaryStatementModel open={open} handleClose={handleCloseSalaryStatementModel} id={salaryStatementId} handleGetStatements={handleGetStatements} />
            {
                showPdfContent && (
                    <div className='absolute top-0 left-0 z-[-1] w-[794px] opacity-0'>
                        <SalaryStatementPDFTable
                            // Pass the raw data and let the PDF table handle its own grouping/totals
                            data={groupedDataForDisplay || row}
                            companyInfo={companyInfo}
                            // filter={filter}
                            selectedYear={selectedYear}
                            department={department}
                            selectedDepartmentId={watch("selectedDepartmentId")}
                            isGrouped={!!groupedDataForDisplay} // Indicate if grouping is active for PDF
                            overallTotals={overallTotals}
                            groupedDepartmentTotals={groupedDepartmentTotals}
                        />
                    </div>
                )
            }
            {
                showSalarySlipPdfContent && (
                    <div className='absolute top-0 left-0 z-[-1] w-[794px] opacity-0'>
                        <SalarySlip
                            data={row}
                            selectedYear={selectedYear}
                            companyInfo={companyInfo}
                        // filter={filter}
                        />
                    </div>
                )
            }
        </>
    );
};

const mapDispatchToProps = {
    handleSetTitle
};

export default connect(null, mapDispatchToProps)(SalaryReport);