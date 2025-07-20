import React, { useEffect, useState } from 'react'
import DataTable from '../../../common/table/table'
import PermissionWrapper from '../../../common/permissionWrapper/PermissionWrapper';
import Components from '../../../muiComponents/components';
import { useNavigate } from 'react-router-dom';
import { deleteEmployee, getAllCompanyEmployee } from '../../../../service/companyEmployee/companyEmployeeService';
import CustomIcons from '../../../common/icons/CustomIcons';
import { connect } from 'react-redux';
import { handleSetTitle, setAlert } from '../../../../redux/commonReducers/commonReducers';
import AlertDialog from '../../../common/alertDialog/alertDialog';
import Button from '../../../common/buttons/button';
import { Tabs } from '../../../common/tabs/tabs';

const tabData = [
    {
        label: 'Employees',
    },
    {
        label: 'Contractors',
    }
]

const ManageEmployees = ({ handleSetTitle, setAlert }) => {
    const navigate = useNavigate()
    const [selectedTab, setSelectedTab] = useState(0);

    const [countryData, setCountryData] = useState([])
    const [employees, setEmployees] = useState([])
    const [contractors, setContractors] = useState([])

    const [dialog, setDialog] = useState({ open: false, title: '', message: '', actionButtonText: '' });

    const [employeeId, setEmployeeId] = useState(null)

    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))

    const handleChangeTab = (value) => {
        setSelectedTab(value);
    }

    const handleCloseDialog = () => {
        setLoading(false)
        setDialog({
            open: false,
            title: '',
            message: '',
            actionButtonText: ''
        })
        setEmployeeId(null)
    }

    const handleOpenDeleteEmployeeDialog = (id) => {
        setEmployeeId(id)
        setDialog({
            open: true,
            title: 'Delete Employee',
            message: 'Are you sure! Do you want to delete this employee?',
            actionButtonText: 'Delete'
        })
    }

    const handleDeleteEmployee = async () => {
        setLoading(true)
        const res = await deleteEmployee(employeeId)
        if (res.data.status !== 200) {
            setLoading(false)
            setAlert({ open: true, message: res?.data?.message, type: "error" })
        } else {
            setLoading(false)
            setEmployeeId(null)
            handleGetAllEmployees()
            handleGetAllContractors()
            handleCloseDialog()
        }
    }

    const habdleAddEmployee = () => {
        navigate(`/dashboard/manageemployees/add/0/${userInfo?.companyId}`)
    }

    const habdleAddContractor = () => {
        navigate(`/dashboard/manageemployees/add/1/${userInfo?.companyId}`)
    }

    const handleGetAllEmployees = async () => {
        if (userInfo?.companyId && selectedTab === 0) {
            const res = await getAllCompanyEmployee(userInfo?.companyId, 0);
            const data = res.data.result?.map((item, index) => {
                return {
                    ...item,
                    rowId: index + 1
                }
            })
            setEmployees(data)
        }
    }

    const handleGetAllContractors = async () => {
        if (userInfo?.companyId && selectedTab === 1) {
            const res = await getAllCompanyEmployee(userInfo?.companyId, 1);
            const data = res.data.result?.map((item, index) => {
                return {
                    ...item,
                    rowId: index + 1
                }
            })
            setContractors(data)
        }
    }

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`;
    };

    const columns = [
        {
            field: 'rowId',
            headerName: 'userName',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            renderCell: (params) => {
                return (
                    <div className='flex justify-start gap-3 items-center my-2'>
                        <Components.Avatar
                            alt={params?.row?.firstName + " " + params?.row?.lastName}
                            src={params?.row?.profileImage}
                            sx={{
                                backgroundColor: params?.row?.profileImage ? "" : "#0093E9",
                                border: "1px solid #cfd0d6",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "bold",
                                width: 33, height: 33
                            }}
                        >
                            {!params?.row?.profileImage && getInitials(params?.row?.firstName, params?.row?.lastName)}
                        </Components.Avatar>

                        <p className='text-sm'>
                            {params?.row?.firstName} {params?.row?.lastName}<br />
                            <span className='text-xs'>
                                {params?.row?.email}
                            </span>
                        </p>
                    </div>
                );
            },
        },
        {
            field: 'gender',
            headerName: 'Gender',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 90
        },
        {
            field: 'country',
            headerName: 'Country',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 90,
            renderCell: (params) => {
                return (
                    <p className='text-sm my-4'>
                        {params?.row?.country || "-"}
                    </p>
                )
            }
        },
         {
            field: 'role',
            headerName: 'Role',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 90,
            renderCell: (params) => {
                return (
                    <p className='text-sm my-4'>
                        {params?.row?.companyEmployeeRolesDto?.roleName || "-"}
                    </p>
                )
            }
        },
        {
            field: 'hourlyRate',
            headerName: 'Hourly Rate',
            headerClassName: 'uppercase',
            flex: 1,
            align: "right",
            headerAlign: "right",
            minWidth: 80,
            valueFormatter: (params) => {
                return `₹${params || 0}`;
            }
        },
        {
            field: 'action',
            headerName: 'Action',
            headerClassName: 'uppercase',
            renderCell: (params) => {
                return (
                    <div className='flex items-center gap-2 justify-center h-full'>
                        <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Manage Employees"
                            actionId={2}
                            component={
                                <div className='bg-blue-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                    <Components.IconButton onClick={() => navigate(`/dashboard/manageemployees/update/0/${params.row?.companyId}/${params.row.employeeId}`)}>
                                        <CustomIcons iconName={'fa-solid fa-pen-to-square'} css='cursor-pointer text-white h-4 w-4' />
                                    </Components.IconButton>
                                </div>
                            }
                        />
                        <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Manage Employees"
                            actionId={3}
                            component={
                                <div className='bg-red-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                    <Components.IconButton onClick={() => handleOpenDeleteEmployeeDialog(params.row.employeeId)}>
                                        <CustomIcons iconName={'fa-solid fa-trash'} css='cursor-pointer text-white h-4 w-4' />
                                    </Components.IconButton>
                                </div>
                            }
                        />

                    </div>
                );
            },
        },
    ];

    const contractorColumns = [
        {
            field: 'rowId',
            headerName: 'userName',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 300,
            renderCell: (params) => {
                return (
                    <div className='flex justify-start gap-3 items-center my-2'>
                        <Components.Avatar
                            alt={params?.row?.firstName + " " + params?.row?.lastName}
                            src={params?.row?.profileImage}
                            sx={{
                                backgroundColor: params?.row?.profileImage ? "" : "#0093E9",
                                border: "1px solid #cfd0d6",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "bold",
                                width: 33, height: 33
                            }}
                        >
                            {!params?.row?.profileImage && getInitials(params?.row?.firstName, params?.row?.lastName)}
                        </Components.Avatar>

                        <p className='text-sm'>
                            {params?.row?.firstName} {params?.row?.lastName}<br />
                            <span className='text-xs'>
                                {params?.row?.email}
                            </span>
                        </p>
                    </div>
                );
            },
        },
        {
            field: 'gender',
            headerName: 'Gender',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 90
        },
        {
            field: 'country',
            headerName: 'Country',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 90,
            renderCell: (params) => {
                return (
                    <p className='text-sm my-4'>
                        {params?.row?.country || "-"}
                    </p>
                )
            }
        },
        {
            field: 'role',
            headerName: 'Role',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 90,
            renderCell: (params) => {
                return (
                    <p className='text-sm my-4'>
                        {params?.row?.companyEmployeeRolesDto?.roleName || "-"}
                    </p>
                )
            }
        },
        {
            field: 'hourlyRate',
            headerName: 'Hourly Rate',
            headerClassName: 'uppercase',
            flex: 1,
            align: "right",
            headerAlign: "right",
            minWidth: 80,
            valueFormatter: (params) => {
                return `$${params || 0}`;
            }
        },
        {
            field: 'action',
            headerName: 'Action',
            headerClassName: 'uppercase',
            renderCell: (params) => {
                return (
                    <div className='flex items-center gap-2 justify-center h-full'>
                        <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Manage Employees"
                            actionId={2}
                            component={
                                <div className='bg-blue-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                    <Components.IconButton onClick={() => navigate(`/dashboard/manageemployees/update/1/${params.row?.companyId}/${params.row.employeeId}`)}>
                                        <CustomIcons iconName={'fa-solid fa-pen-to-square'} css='cursor-pointer text-white h-4 w-4' />
                                    </Components.IconButton>
                                </div>
                            }
                        />
                        <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Manage Employees"
                            actionId={3}
                            component={
                                <div className='bg-red-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                    <Components.IconButton onClick={() => handleOpenDeleteEmployeeDialog(params.row.employeeId)}>
                                        <CustomIcons iconName={'fa-solid fa-trash'} css='cursor-pointer text-white h-4 w-4' />
                                    </Components.IconButton>
                                </div>
                            }
                        />

                    </div>
                );
            },
        },
    ];

    const getRowId = (row) => {
        return row.rowId;
    }

    const employeeActionButtons = () => {
        return (
            <PermissionWrapper
                functionalityName="Company"
                moduleName="Manage Employees"
                actionId={1}
                component={
                    <div>
                        <Button type={`button`} text={'Add Employee'} onClick={() => habdleAddEmployee()} startIcon={<CustomIcons iconName="fa-solid fa-plus" css="h-5 w-5" />} />
                    </div>
                }
            />
        )
    }

    const contractorActionButtons = () => {
        return (
            <PermissionWrapper
                functionalityName="Company"
                moduleName="Manage Employees"
                actionId={1}
                component={
                    <div>
                        <Button type={`button`} text={'Add Contractor'} onClick={() => habdleAddContractor()} startIcon={<CustomIcons iconName="fa-solid fa-plus" css="h-5 w-5" />} />
                    </div>
                }
            />
        )
    }

    useEffect(() => {
        handleSetTitle("Manage Employees")
        handleGetAllEmployees()
        handleGetAllContractors()
    }, [selectedTab])

    return (
        <div className='px-3 lg:px-0'>           
            <div className='mb-4'>
                <Tabs tabsData={tabData} selectedTab={selectedTab} handleChange={handleChangeTab} type={'underline'} />
            </div>

            {
                selectedTab === 0 && (
                    <div className='border rounded-lg bg-white lg:w-full'>
                        <DataTable columns={columns} rows={employees} getRowId={getRowId} height={420} showSearch={false} showButtons={true} buttons={employeeActionButtons}/>
                    </div>
                )
            }

            {
                selectedTab === 1 && (
                    <div className='border rounded-lg bg-white lg:w-full'>
                        <DataTable columns={contractorColumns} rows={contractors} getRowId={getRowId} height={350} checkboxSelection={true} showButtons={true} buttons={contractorActionButtons} />
                    </div>
                )
            }
            <AlertDialog open={dialog.open} title={dialog.title} message={dialog.message} actionButtonText={dialog.actionButtonText} handleAction={handleDeleteEmployee} handleClose={handleCloseDialog} loading={loading} />           
        </div>
    )
}

const mapDispatchToProps = {
    setAlert,
    handleSetTitle
};

export default connect(null, mapDispatchToProps)(ManageEmployees)