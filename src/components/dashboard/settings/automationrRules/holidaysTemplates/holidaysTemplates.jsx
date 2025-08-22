import { useTheme } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import CustomIcons from '../../../../common/icons/CustomIcons';
import Button from '../../../../common/buttons/button';
import { useEffect, useState } from 'react';
import Components from '../../../../muiComponents/components';
import DataTable from '../../../../common/table/table';
import AlertDialog from '../../../../common/alertDialog/alertDialog';
import PermissionWrapper from '../../../../common/permissionWrapper/PermissionWrapper';
import { deleteHolidaysTemplate, getAllHolidaysTemplates } from '../../../../../service/holidaysTemplates/holidaysTemplatesService';

const HolidaysTemplates = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const userInfo = JSON.parse(localStorage.getItem("userInfo"))
    const [row, setRow] = useState([]);
    const [id, setId] = useState(null);

    const [dialog, setDialog] = useState({ open: false, title: '', message: '', actionButtonText: '' });
    const [loading, setLoading] = useState(false);

    const handleOpenDeleteHolidaysDialog = (id) => {
        setId(id)
        setDialog({
            open: true,
            title: 'Delete Holidays Template',
            message: 'Are you sure! Do you want to delete this holidays template?',
            actionButtonText: 'Delete'
        })
    }

    const handleCloseDialog = () => {
        setLoading(false)
        setDialog({
            open: false,
            title: '',
            message: '',
            actionButtonText: ''
        })
    }

    const handleDeleteHolidaysTemplate = async () => {
        setLoading(true);
        try {
            const response = await deleteHolidaysTemplate(id);
            if (response?.data?.status === 200) {
                handleCloseDialog();
                handleGetHolidaysTemplates();
            }
        } catch (error) {
            console.error('Error deleting holidays template:', error);
        } finally {
            setLoading(false);
        }
    }

    const columns = [
        {
            field: 'rowId',
            headerName: 'id',
            headerClassName: 'uppercase',
            flex: 1,
            maxWidth: 80
        },
        {
            field: 'name',
            headerName: 'Holidays Template Name',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 100
        },
        {
            field: 'createdByUserName',
            headerName: 'Created By',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 100
        },
        {
            field: 'action',
            headerName: 'action',
            headerClassName: 'uppercase',
            flex: 1,
            minWidth: 80,
            renderCell: (params) => {
                return (
                    <div className='flex items-center gap-2 justify-start h-full'>
                        {/* <div className='bg-blue-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                            <Components.IconButton onClick={() => handleOpen(params.row.id)}>
                                <CustomIcons iconName={'fa-solid fa-pen-to-square'} css='cursor-pointer text-white h-4 w-4' />
                            </Components.IconButton>
                        </div> */}
                        {/* <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Overtime Rules"
                            actionId={2}
                            Component={
                            }
                        /> */}

                        <PermissionWrapper
                            functionalityName="Company"
                            moduleName="Overtime Rules"
                            actionId={3}
                            component={
                                <div className='bg-red-600 h-8 w-8 flex justify-center items-center rounded-full text-white'>
                                    <Components.IconButton onClick={() => handleOpenDeleteHolidaysDialog(params.row.id)}>
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
        return row.id;
    }

    const handleGetHolidaysTemplates = async () => {
        try {
            if (userInfo?.companyId) {
                const response = await getAllHolidaysTemplates(userInfo?.companyId);
                if (response?.data?.status === 200) {
                    setRow(response?.data?.result || []);
                }
            }
        } catch (error) {
            console.error('Error fetching holidays templates:', error);
        }
    }

    useEffect(() => {
        handleGetHolidaysTemplates();
    }, [])

    const actionButtons = () => {
        return (
            <PermissionWrapper
                functionalityName="Company"
                moduleName="Overtime Rules"
                actionId={1}
                component={
                    <div>
                        <Button type={`button`} text={'Create Holidays Template'} onClick={() => navigate('/dashboard/automationrules/holidays-templates/add')} startIcon={<CustomIcons iconName="fa-solid fa-plus" css="h-5 w-5" />} />
                    </div>
                }
            />
        )
    }

    return (
        <div className='px-4 lg:px-0'>
            <div className='mb-4 w-60'>
                <NavLink to={'/dashboard/automationrules'}>
                    <div className='flex justify-start items-center gap-3'>
                        <div style={{ color: theme.palette.primary.main }}>
                            <CustomIcons iconName={'fa-solid fa-arrow-left'} css='cursor-pointer h-4 w-4' />
                        </div>
                        <p className='text-md capitalize'>Back to automation rules</p>
                    </div>
                </NavLink>
            </div>

            <div className='border rounded-lg bg-white w-screen lg:w-full p-4'>
                <div className='grow mb-4'>
                    <h2 className='text-lg font-semibold'>Holidays Templates</h2>
                    <p className='text-gray-600'>
                        Create templates to auto-assign paid leave on public holidays.
                    </p>
                </div>
                <DataTable columns={columns} rows={row} getRowId={getRowId} height={480} showButtons={true} buttons={actionButtons} />
            </div>
            <AlertDialog open={dialog.open} title={dialog.title} message={dialog.message} actionButtonText={dialog.actionButtonText} handleAction={handleDeleteHolidaysTemplate} handleClose={handleCloseDialog} loading={loading} />
        </div>
    )
}

export default HolidaysTemplates