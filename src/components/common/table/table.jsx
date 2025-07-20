import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Input from '../input/input';
import Button from '../buttons/button';
import { useTheme } from '@mui/material';
import PermissionWrapper from '../permissionWrapper/PermissionWrapper';
import CustomIcons from '../icons/CustomIcons';

const paginationModel = { page: 0, pageSize: 10 };

export default function DataTable({ checkboxSelection = false, showSearch = false, showButtons = false, buttonText = "", buttonAction = () => { }, rows, columns, getRowId, height, permissions, buttons }) {
    const theme = useTheme();
    return (
        <>
            {
                (showSearch || showButtons) && (
                    <div className="border border-1 py-4 px-5 rounded-lg rounded-b-none grid md:grid-cols-2">
                        <div className="w-full md:w-60 mb-3 md:mb-0 md:max-w-xs">
                            {
                                showSearch && (
                                    <Input name="search" label="Search" endIcon={<CustomIcons iconName={'fa-solid fa-magnifying-glass'} css='mr-3' />} />
                                )
                            }
                        </div>

                        <div className="w-full flex justify-end md:justify-end items-center gap-3">
                            {
                                showButtons && (
                                    <>
                                        {buttons()}
                                        {/* <div>
                                            <PermissionWrapper
                                                functionalityName={permissions?.functionalityName}
                                                moduleName={permissions?.moduleName}
                                                actionId={permissions?.actionId}
                                                component={
                                                    <Button type="button" text={"+ " + buttonText} variant="contained" color="primary" onClick={() => buttonAction()} />
                                                }
                                            />                                    
                                        </div> */}
                                    </>
                                )
                            }
                        </div>
                    </div>
                )
            }

            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                // disableColumnSorting
                getRowId={getRowId}
                // hideFooter
                loading={rows?.length > 0 ? false : true}
                checkboxSelection={checkboxSelection}
                sx={{
                    maxHeight: height || "full",
                    color: theme.palette.primary.text.main,
                    overflow: 'auto',
                    '& .MuiDataGrid-columnHeaders': {
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        backgroundColor: theme.palette.primary.background,
                        // marginY:2,   
                    },
                    '& .MuiDataGrid-footerContainer': {
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 2,
                        backgroundColor: theme.palette.background.paper,
                    },
                    '& .MuiDataGrid-container--top [role="row"], .MuiDataGrid-container--bottom [role="row"]': {
                        backgroundColor: theme.palette.background.default,
                    },
                    '& .MuiDataGrid-row:hover': {
                        backgroundColor: theme.palette.background.default,
                    },
                }}
            />

        </>
    );
}