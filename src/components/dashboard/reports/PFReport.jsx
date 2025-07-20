import { useEffect, useState } from "react";
import { Tabs } from "../../common/tabs/tabs";
import { getEmployeePFReport } from "../../../service/companyEmployee/companyEmployeeService";
import DataTable from "../../common/table/table";
import Select from "../../common/select/select";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Button from "../../common/buttons/button";
import CustomIcons from "../../common/icons/CustomIcons";
import { getCompanyDetails } from "../../../service/companyDetails/companyDetailsService";
import PFPDFTable from "./PdfTable/PFPDFTable";

const filterOptions = [
    { id: 1, title: 'Last 1 Month', value: 1 },
    { id: 2, title: 'Last 3 Months', value: 3 },
    { id: 3, title: 'Last 6 Months', value: 6 },
    { id: 4, title: 'Last 1 Year', value: 12 }
];

const PFReport = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const [employees, setEmployees] = useState([]);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [showPdfContent, setShowPdfContent] = useState(false);
    const [companyInfo, setCompanyInfo] = useState()
    const [filter, setFilter] = useState(filterOptions[0]);

    const handleGetAllEmployees = async () => {
        setEmployees([]);

        const res = await getEmployeePFReport(userInfo?.companyId, "PF", filter?.value);
        let data = res.data.result?.map((item, index) => ({
            ...item,
            rowId: index + 1
        })) || [];

        // Handle PF
        const totalPF = data.reduce((sum, emp) => sum + (Number(emp.total_amount) || 0), 0);

        data.push({
            rowId: 'total',
            userName: 'Total',
            total_amount: totalPF,
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

    const columns = [
        {
            field: 'rowId', headerName: '#', headerClassName: 'uppercase', flex: 1, maxWidth: 100,
            renderCell: (params) =>
                params.row.isTotalRow ? null : <span>{params.value}</span>
        },
        {
            field: 'userName', headerName: 'Employee Name', headerClassName: 'uppercase', flex: 1, maxWidth: 300,
            renderCell: (params) => params.row.isTotalRow ? <strong className='font-semibold'>Total</strong> : params.value
        },
        {
            field: 'basic_salary',
            headerName: 'Basic Salary(Monthly)',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => params.row.isTotalRow ? null : <span>₹{params.value?.toLocaleString()}</span>
        },
        {
            field: 'total_basic_salary',
            headerName: 'Total Basic Salary',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 200,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => params.row.isTotalRow ? null : <span>₹{params.value?.toLocaleString()}</span>
        },
        {
            field: 'employee_pf_amount',
            headerName: 'Employee PF',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => params.row.isTotalRow ? null : <span>₹{params.value?.toLocaleString()}</span>
        },
        {
            field: 'employer_pf_amount',
            headerName: 'Employer PF',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => params.row.isTotalRow ? null : <span>₹{params.value?.toLocaleString()}</span>
        },
        {
            field: 'total_amount',
            headerName: 'Total PF',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 150,
            align: "right",
            headerAlign: "right",
            renderCell: (params) =>
                params.row.isTotalRow
                    ? <strong className='font-semibold'>₹{params.value?.toLocaleString()}</strong>
                    : <span>₹{params.value?.toLocaleString()}</span>
        }
    ];    

    const generatePDF = async () => {
        setShowPdfContent(true);
        setLoadingPdf(true);

        setTimeout(async () => {
            const element = document.getElementById("PF-table-container");
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 3, // higher scale = better quality
                useCORS: true,
                logging: true, // for debugging
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
            pdf.save("employee_pf_report.pdf");

            setShowPdfContent(false);
            setLoadingPdf(false);
        }, 500); // allow time to render
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
                    columns={columns}
                    rows={employees}
                    getRowId={getRowId}
                    height={550}
                    showButtons={true}
                    buttons={actionButtons}
                />
            </div>

            {showPdfContent && (
                <div className='absolute top-0 left-0 z-[-1] w-[180vh] opacity-0'>
                    <PFPDFTable data={employees} companyInfo={companyInfo} filter={filter} />
                </div>
            )}           
        </div>
    );
};

export default PFReport;
