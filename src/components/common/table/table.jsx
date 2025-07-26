import { DataGrid } from '@mui/x-data-grid';
import Input from '../input/input';
import { useTheme } from '@mui/material';
import CustomIcons from '../icons/CustomIcons';
import { useMemo } from 'react';

const paginationModel = { page: 0, pageSize: 10 };

export default function DataTable({
    checkboxSelection = false,
    showSearch = false,
    showButtons = false,
    buttonText = "",
    buttonAction = () => { },
    rows,
    columns,
    getRowId,
    height,
    permissions,
    buttons,
    footerRowData // This prop holds the total row data
}) {
    const theme = useTheme();

    // Prepare rows for DataGrid: Append the footerRowData if it exists
    const dataGridRows = useMemo(() => {
        if (footerRowData) {
            return [...rows, footerRowData];
        }
        return rows;
    }, [rows, footerRowData]);

    // Apply specific styles to the total row
    const getRowClassName = (params) => {
        if (params.row.isTotalRow) {
            return 'MuiDataGrid-footer-row';
        }
        return '';
    };

    // Modify columns to handle rendering for the total row
    const dataGridColumns = useMemo(() => {
        return columns.map(col => {
            if (col.field === 'employeeName' && col.headerName !== '#') { // Target 'Employee Name' column specifically for the label
                return {
                    ...col,
                    renderCell: (params) => {
                        if (params.row.isTotalRow) {
                            return (
                                <span style={{ fontWeight: 'bold' }}>
                                    {params.row.employeeName} {/* Will be "Overall Total" or "Department Total" */}
                                </span>
                            );
                        }
                        // Render original cell for other rows
                        return col.renderCell ? col.renderCell(params) : params.value;
                    },
                    // Optional: disable sorting for the total row label column
                    sortable: !col.sortable, // Set to false if it was sortable, true if it wasn't
                };
            }
            // Apply custom rendering for numeric columns in the total row
            if (['basicSalary', 'otAmount', 'totalPfAmount', 'ptAmount', 'totalEarnings', 'otherDeductions', 'totalDeductions', 'netSalary'].includes(col.field)) {
                return {
                    ...col,
                    renderCell: (params) => {
                        if (params.row.isTotalRow) {
                            // Only show value for totalEarnings, totalDeductions, netSalary
                            if (['otherDeductions', 'totalEarnings', 'totalDeductions', 'netSalary'].includes(col.field)) {
                                return <span>₹{params.value?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>;
                            } else {
                                // For other financial columns in the total row, just show '₹' or leave empty
                                return <span></span>; // Or return null/'' for an empty cell
                            }
                        }
                        // For non-total rows, use the original renderCell logic
                        return col.renderCell ? col.renderCell(params) : params.value;
                    },
                    sortable: !col.sortable, // Disable sorting for these columns on total row
                };
            }
            return col;
        });
    }, [columns]);

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
                                    </>
                                )
                            }
                        </div>
                    </div>
                )
            }

            <DataGrid
                rows={dataGridRows}
                columns={dataGridColumns} // Use the modified columns
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                getRowId={getRowId}
                checkboxSelection={checkboxSelection}
                getRowClassName={getRowClassName}
                sx={{
                    maxHeight: height || 550,
                    color: theme.palette.primary.text.main,
                    overflow: 'auto',
                    '& .MuiDataGrid-columnHeaders': {
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        backgroundColor: theme.palette.primary.background,
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
                    '& .MuiDataGrid-footer-row': {
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.grey[100],
                        borderTop: `2px solid ${theme.palette.grey[300]}`,
                        // Ensure all cells in the total row are styled consistently
                        '& .MuiDataGrid-cell': {
                            // You might want to adjust padding or text alignment here for visual balance
                        },
                        // Target specific cells if you need fine-grained control for alignment
                        '& .MuiDataGrid-cell[data-field="totalEarnings"], & .MuiDataGrid-cell[data-field="totalDeductions"], & .MuiDataGrid-cell[data-field="netSalary"]': {
                            textAlign: 'right',
                        },
                        '& .MuiDataGrid-cell[data-field="employeeName"]': {
                            // Align the "Overall Total" text to the left
                            textAlign: 'left',
                            paddingLeft: '16px' // Adjust as needed
                        },
                        '& .MuiDataGrid-cell[data-field="rowId"]': {
                            // Keep 'total' aligned left
                            textAlign: 'left',
                            paddingLeft: '16px' // Adjust as needed
                        },
                    },
                }}
            />
        </>
    );
}


// import { DataGrid } from '@mui/x-data-grid';
// import Input from '../input/input';
// import { useTheme } from '@mui/material';
// import CustomIcons from '../icons/CustomIcons';

// const paginationModel = { page: 0, pageSize: 10 };

// export default function DataTable({ checkboxSelection = false, showSearch = false, showButtons = false, buttonText = "", buttonAction = () => { }, rows, columns, getRowId, height, permissions, buttons }) {
//     const theme = useTheme();
//     return (
//         <>
//             {
//                 (showSearch || showButtons) && (
//                     <div className="border border-1 py-4 px-5 rounded-lg rounded-b-none grid md:grid-cols-2">
//                         <div className="w-full md:w-60 mb-3 md:mb-0 md:max-w-xs">
//                             {
//                                 showSearch && (
//                                     <Input name="search" label="Search" endIcon={<CustomIcons iconName={'fa-solid fa-magnifying-glass'} css='mr-3' />} />
//                                 )
//                             }
//                         </div>

//                         <div className="w-full flex justify-end md:justify-end items-center gap-3">
//                             {
//                                 showButtons && (
//                                     <>
//                                         {buttons()}
//                                     </>
//                                 )
//                             }
//                         </div>
//                     </div>
//                 )
//             }

//             <DataGrid
//                 rows={rows}
//                 columns={columns}
//                 initialState={{ pagination: { paginationModel } }}
//                 pageSizeOptions={[10, 25, 50]}
//                 disableRowSelectionOnClick
//                 hideFooterSelectedRowCount
//                 // disableColumnSorting
//                 getRowId={getRowId}
//                 // hideFooter
//                 // loading={loading}
//                 checkboxSelection={checkboxSelection}
//                 sx={{
//                     maxHeight: height || "full",
//                     color: theme.palette.primary.text.main,
//                     overflow: 'auto',
//                     '& .MuiDataGrid-columnHeaders': {
//                         position: 'sticky',
//                         top: 0,
//                         zIndex: 2,
//                         backgroundColor: theme.palette.primary.background,
//                         // marginY:2,
//                     },
//                     '& .MuiDataGrid-footerContainer': {
//                         position: 'sticky',
//                         bottom: 0,
//                         zIndex: 2,
//                         backgroundColor: theme.palette.background.paper,
//                     },
//                     '& .MuiDataGrid-container--top [role="row"], .MuiDataGrid-container--bottom [role="row"]': {
//                         backgroundColor: theme.palette.background.default,
//                     },
//                     '& .MuiDataGrid-row:hover': {
//                         backgroundColor: theme.palette.background.default,
//                     },
//                 }}
//             />

//         </>
//     );
// }