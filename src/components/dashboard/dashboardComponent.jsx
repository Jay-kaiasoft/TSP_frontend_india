import React, { useEffect, useState } from 'react'
import { addUserTimeIn, getDashboardData, getUserLastInOut, updateUserTimeIn } from '../../service/userInOut/userInOut';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import AlertDialog from '../common/alertDialog/alertDialog';
import Button from '../common/buttons/button';
import { connect } from 'react-redux';
import { handleSetTimeIn, handleSetTitle } from '../../redux/commonReducers/commonReducers';
import { useTheme } from '@mui/material';
import { handleConvertUTCDateToLocalDate } from '../../service/common/commonService';

const DashboardComponent = ({ handleSetTitle, handleSetTimeIn, timeIn }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme();

  const userInfo = JSON.parse(localStorage.getItem("userInfo"))
  const [dialog, setDialog] = useState({ open: false, title: '', message: '', actionButtonText: '' })
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [data, setData] = useState(null)
  
  const {
    setValue,
  } = useForm({
    defaultValues: {
      id: '',
      timeIn: '',
      timeOut: ''
    },
  });

  const handleOpenDialog = () => {
    setDialog({
      open: true,
      title: "Clock Out",
      message: "Are you sure! Do you want to clock out?",
      actionButtonText: "Yes",
    })
  }

  const handleCloseDialog = () => {
    setDialog({
      open: false,
      title: "",
      message: "",
      actionButtonText: "",
    })
  }

  const handleStart = async () => {
    if (!isRunning) {
      // const date1 = new Date();
        const response = await addUserTimeIn(sessionStorage.getItem("locationId") !== undefined && sessionStorage.getItem("locationId") !== null ? sessionStorage.getItem("locationId") : "");
      if (response.data?.status === 201) {
        setIsRunning(true);
        setValue("id", response.data?.result?.id);
        setTimer(0)
        localStorage.setItem("timeIn", "true")
        handleSetTimeIn(true)
      }
    }
  };

  const handleStop = async () => {
    if (isRunning) {
      setIsRunning(false);
      const response = await updateUserTimeIn(userInfo?.employeeId);
      if (response.data.status === 200) {
        handleCloseDialog()
        setTimer(0);
        setValue("id", null);
        localStorage.removeItem("timeIn")
        handleSetTimeIn(false)
        // handleGetTodayInOutRecords();
        if (location.pathname.endsWith("/dashboard/main")) {
          navigate("/dashboard/main")
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // const handleGetTimeDifference = () => {
  //   if (localStorage.getItem("timeIn")) {
  //     const date1 = new Date();
  //     const date2 = new Date(localStorage.getItem("timeIn"));
  //     const diffInSeconds = Math.round((date1 - date2) / 1000);
  //     setTimer(diffInSeconds);
  //     setIsRunning(true)
  //   }
  // }

  const handleGetDashboardData = async () => {
    if (userInfo?.companyId) {
      const res = await getDashboardData(userInfo?.companyId)
      setData(res.data.result)
    }
  }

  const handleGetUserLastInOut = async () => {
    if (userInfo?.employeeId) {
      const res = await getUserLastInOut(userInfo?.employeeId)
      if (res.data.result) {
        // console.log("Calling.... dahsboard")
        const date1 = new Date();
        // const date2 = new Date(res.data.result?.timeIn);
        // console.log("handleConvertUTCDateToLocalDate(res.data.result?.timeIn) dashboard",handleConvertUTCDateToLocalDate(res.data.result?.timeIn))
        // const date2 = new Date(handleConvertUTCDateToLocalDate(res.data.result?.timeIn));
        // const diffInSeconds = Math.round((date1 - date2) / 1000);
        const date2 = new Date(handleConvertUTCDateToLocalDate(res.data.result?.timeIn));
        const diffInSeconds = Math.max(0, Math.round((date1 - date2) / 1000));
        // const diffInSeconds = Math.round((date1 - date2) / 1000);
        setTimer(diffInSeconds)
        setIsRunning(true)
      } else {
        setTimer(0)
        setIsRunning(false)
        setValue("id", null);
      }
    }
  }

  useEffect(() => {
    handleSetTitle("Dashboard")
    handleGetUserLastInOut()
    handleGetDashboardData()
    // handleGetTodayInOutRecords()
  }, [])

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTimer(prevTime => {
          const updatedTime = prevTime + 1;
          return updatedTime;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    handleGetUserLastInOut()
  }, [timeIn])

  return (
    <div className='px-4 lg:px-0'>
      <div className='border rounded-lg bg-white h-[570px] lg:w-full'>

        <div className='flex justify-end items-center gap-3 my-3'>
          {
            parseInt(localStorage.getItem("timeInAllow")) === 1 && (
              <>
                <div style={{ color: theme.palette.primary.text.main }} className="text-xl font-bold text-end">{formatTime(timer)}</div>
                <div className="flex justify-end gap-4 mr-3">
                  <Button text={isRunning ? "Clock Out" : "Clock In"} useFor={isRunning ? "error" : "success"} onClick={!isRunning ? handleStart : handleOpenDialog} />
                </div>
              </>
            )
          }
        </div>

        <div className='xl:flex justify-center items-center gap-3 xl:gap-7'>
          <div className='grid grid-cols-2 xl:grid-cols-8 gap-3 px-3 xl:px-0'>
            <div style={{ color: theme.palette.primary.text.main }} className='border-2 rounded-md xl:w-96 h-44 xl:col-span-4 flex justify-center items-center'>
              <div className='text-center'>
                <p className='md:text-2xl font-bold'>Today's Punch-In</p>
                <p className='md:text-xl font-bold mt-2'>{data?.countCheckedInUsers || 0}</p>
              </div>
            </div>

            <div style={{ color: theme.palette.primary.text.main }} className='border-2 rounded-md xl:w-96 h-44 xl:col-span-4 flex justify-center items-center'>
              <div className='text-center'>
                <p className='md:text-2xl font-bold'>Total Employees</p>
                <p className='md:text-xl font-bold mt-2'>{data?.companyTotalUserCount || 0}</p>
              </div>
            </div>

            <div style={{ color: theme.palette.primary.text.main }} className='border-2 rounded-md xl:w-96 h-44 xl:col-span-4 flex justify-center items-center'>
              <div className='text-center'>
                <p className='md:text-2xl font-bold'>Active Users Today</p>
                <p className='md:text-xl font-bold mt-2'>{data?.currentInUserCount || 0}</p>
              </div>
            </div>

            <div style={{ color: theme.palette.primary.text.main }} className='border-2 rounded-md xl:w-96 h-44 xl:col-span-4 flex justify-center items-center'>
              <div className='text-center'>
                <p className='md:text-2xl font-bold'>Today's Punch-Out</p>
                <p className='md:text-xl font-bold mt-2'>{data?.countCheckedOutUsers || 0}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
      <AlertDialog open={dialog.open} title={dialog.title} message={dialog.message} actionButtonText={dialog.actionButtonText} handleAction={handleStop} handleClose={handleCloseDialog} />
    </div>
  )
}

const mapStateToProps = (state) => ({
  timeIn: state.common.timeIn,
});

const mapDispatchToProps = {
  handleSetTitle,
  handleSetTimeIn
};

export default connect(mapStateToProps, mapDispatchToProps)(DashboardComponent)
