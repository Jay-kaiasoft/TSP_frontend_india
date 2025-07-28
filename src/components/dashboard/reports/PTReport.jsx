import { useEffect, useState } from "react";
import { getEmployeePFReport } from "../../../service/companyEmployee/companyEmployeeService";
import DataTable from "../../common/table/table";
import Select from "../../common/select/select";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Button from "../../common/buttons/button";
import CustomIcons from "../../common/icons/CustomIcons";
import { getCompanyDetails } from "../../../service/companyDetails/companyDetailsService";
import PTPDFTable from "./PdfTable/PTPDFTable";

const filterOptions = [
    { id: 1, title: 'Last 1 Month', value: 1 },
    { id: 2, title: 'Last 3 Months', value: 3 },
    { id: 3, title: 'Last 6 Months', value: 6 },
    { id: 4, title: 'Last 1 Year', value: 12 }
];

const PTReport = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const [employees, setEmployees] = useState([]);
    const [filter, setFilter] = useState(filterOptions[0]);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [showPdfContent, setShowPdfContent] = useState(false);
    const [companyInfo, setCompanyInfo] = useState()


    const handleGetAllEmployees = async () => {
        setEmployees([]);

        const res = await getEmployeePFReport(userInfo?.companyId, "PT", filter?.value);
        let data = res.data.result?.map((item, index) => ({
            ...item,
            rowId: index + 1
        })) || [];

        const totalPT = data.reduce((sum, emp) => sum + (Number(emp.total_amount) || 0), 0);

        data.push({
            rowId: 'total',
            userName: 'Total',
            total_amount: totalPT,
            isTotalRow: true
        });

        setEmployees(data);
    };

    const handleGetCompanyInfo = async () => {
        if (userInfo?.companyId) {
            const response = await getCompanyDetails(userInfo?.companyId)
            setCompanyInfo(response?.data?.result)
        }
    }

    useEffect(() => {
        handleGetCompanyInfo();
    }, []);

    useEffect(() => {
        handleGetAllEmployees();
    }, [filter]);

    const columnsPT = [
        {
            field: 'rowId', headerName: '#', headerClassName: 'uppercase', flex: 1, maxWidth: 100,
            renderCell: (params) =>
                params.row.isTotalRow ? null : <span>{params.value}</span>
        },
        {
            field: 'userName',
            headerName: 'Employee Name',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            renderCell: (params) =>
                params.row.isTotalRow
                    ? <strong className='font-semibold'>Total</strong>
                    : params.value
        },
        {
            field: 'gross_salary',
            headerName: 'Gross Salary(Monthly)',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 250,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => params.row.isTotalRow ? null : <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'total_gross_salary',
            headerName: 'Total Gross Salary',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => params.row.isTotalRow ? null : <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        },
        {
            field: 'totalDays',
            headerName: 'Total Days',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            align: "right",
            headerAlign: "right",
        },
        {
            field: 'daysWorked',
            headerName: 'Working Days',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            align: "right",
            headerAlign: "right",
        },
        {
            field: 'total_amount',
            headerName: 'Total pt Amount',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            align: "right",
            headerAlign: "right",
            renderCell: (params) =>
                params.row.isTotalRow
                    ? <strong className='font-semibold'>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</strong>
                    : <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
        }
    ];


    const generatePDF = async () => {
        setShowPdfContent(true);
        setLoadingPdf(true);
 
        setTimeout(async () => {
            const pdf = new jsPDF("p", "mm", "a4");
            const margin = 10;
            const imgWidth = 210 - 2 * margin;
            let yOffset = margin;

            const salarySlipElements = document.querySelectorAll("#PT-table-container");

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

            pdf.save("employee_pt_report.pdf");

            setShowPdfContent(false);
            setLoadingPdf(false);
        }, 700);
    };

    const getRowId = (row) => row.rowId ?? row.id;

    const actionButtons = () => {
        return (
            <div className='flex justify-start items-center gap-3 w-38'>
                <Button type={`button`} useFor={'error'} text={'Download PDF'} isLoading={loadingPdf} onClick={() => generatePDF()} startIcon={<CustomIcons iconName="fa-solid fa-file-pdf" css="h-5 w-5" />} />
            </div>
        )
    }

    return (
        <div className='px-3 lg:px-0'>
            <div className="my-3 w-60">
                <Select
                    options={filterOptions}
                    label={"Filter by Duration"}
                    placeholder="Select Duration"
                    value={filter?.id}
                    onChange={(_, newValue) => {
                        setFilter(newValue?.value ? newValue : filterOptions[0]);
                    }}
                />
            </div>

            <div className='border rounded-lg bg-white lg:w-full'>
                <DataTable
                    columns={columnsPT}
                    rows={employees}
                    getRowId={getRowId}
                    height={550}
                    showButtons={true}
                    buttons={actionButtons}
                />
            </div>
            {
                showPdfContent && (
                    <div className='absolute top-0 left-0 z-[-1] w-[180vh] opacity-0'>
                        <PTPDFTable data={employees} companyInfo={companyInfo} filter={filter} />
                    </div>
                )
            }
        </div>
    );
};

export default PTReport;
