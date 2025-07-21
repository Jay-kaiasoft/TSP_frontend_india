import { useTheme } from '@mui/material';
import { NavLink } from 'react-router-dom';
import CustomIcons from '../../../../common/icons/CustomIcons';

const OvertimeRules = () => {
    const theme = useTheme();

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
                <div className='grow'>
                    <h2 className='text-lg font-semibold'>Overtime Rules</h2>
                    <p className='text-gray-600'>
                        Automate Oovertime for employees who work beyond their scheduled hours.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default OvertimeRules