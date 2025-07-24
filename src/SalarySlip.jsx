import React from 'react';

// Utility function to convert numbers to Indian Rupee words
const numberToWords = (num) => {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const c = ['hundred', 'thousand', 'lakh', 'crore'];

  const convertLessThanOneThousand = (n) => {
    let s = '';
    if (n < 20) {
      s = a[n];
    } else {
      s = b[Math.floor(n / 10)] + ' ' + a[n % 10];
    }
    return s;
  };

  if (num === 0) return 'Zero Rupees Only';

  let n = Math.round(num * 100) / 100; // Handle decimals
  let integerPart = Math.floor(n);
  let decimalPart = Math.round((n - integerPart) * 100);

  let output = '';

  // Process crores
  if (integerPart >= 10000000) {
    output += convertLessThanOneThousand(Math.floor(integerPart / 10000000)) + 'crore ';
    integerPart %= 10000000;
  }
  // Process lakhs
  if (integerPart >= 100000) {
    output += convertLessThanOneThousand(Math.floor(integerPart / 100000)) + 'lakh ';
    integerPart %= 100000;
  }
  // Process thousands
  if (integerPart >= 1000) {
    output += convertLessThanOneThousand(Math.floor(integerPart / 1000)) + 'thousand ';
    integerPart %= 1000;
  }
  // Process hundreds
  if (integerPart >= 100) {
    output += convertLessThanOneThousand(Math.floor(integerPart / 100)) + 'hundred ';
    integerPart %= 100;
  }
  // Process remaining
  if (integerPart > 0) {
    output += convertLessThanOneThousand(integerPart);
  }

  output = output.trim();
  output += ' Rupees';

  if (decimalPart > 0) {
    output += ' and ' + convertLessThanOneThousand(decimalPart) + ' Paisa';
  }
  return output + ' Only';
};


const SalarySlip = ({
  employee = {
    name: "Gaurav",
    id: "43521",
    designation: "Associate Editor",
    company: "Zylker Corp",
    address: "Gujarat India",
  },
  payslipDetails = {
    payPeriod: "January 2024",
    payDate: "29/02/2024",
    dateOfJoining: "30/06/2020",
    paidDays: 31,
    lopDays: 0,
  },
  salary = {
    earnings: {
      basic: { current: 43750.00, ytd: 87500.00 },
      hra: { current: 21875.00, ytd: 43750.00 },
      fixedAllowance: { current: 21875.00, ytd: 43750.00 },
    },
    deductions: {
      professionalTax: { current: 200.00, ytd: 400.00 },
    },
  },
}) => {

  // Calculate total earnings and YTD earnings
  const totalCurrentEarnings = Object.values(salary.earnings).reduce((acc, comp) => acc + comp.current, 0);
  const totalYTDEarnings = Object.values(salary.earnings).reduce((acc, comp) => acc + comp.ytd, 0);

  // Calculate total deductions and YTD deductions
  const totalCurrentDeductions = Object.values(salary.deductions).reduce((acc, comp) => acc + comp.current, 0);
  const totalYTDDeductions = Object.values(salary.deductions).reduce((acc, comp) => acc + comp.ytd, 0);

  const netSalary = totalCurrentEarnings - totalCurrentDeductions;

  return (
    <div className="font-inter antialiased bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-10 min-h-screen grid grid-cols-1 place-items-center gap-8">
      <div className="max-w-4xl w-full bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        {/* Top Blue Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-700 to-blue-500"></div>

        {/* Header Section */}
        <div className="p-6 sm:p-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{employee.company}</h1>
            {/* <p className="text-sm text-gray-600">{employee.address}</p> */}
          </div>
          {/* Zoho Logo Placeholder - Using a simple SVG for demonstration
          <div className="flex-shrink-0">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="20" fill="#F0F0F0" />
              <path d="M30 40 L50 20 L70 40 L50 60 L30 40 Z" fill="#FF8C00" />
              <circle cx="50" cy="70" r="15" fill="#4CAF50" />
              <path d="M30 70 L50 90 L70 70 L50 50 L30 70 Z" fill="#2196F3" />
            </svg>
          </div> */}
        </div>

        <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payslip for the month of {payslipDetails.payPeriod}</h2>

          {/* Employee Pay Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">EMPLOYEE PAY SUMMARY</h3>
              <p className="mb-1"><strong className="w-32 inline-block">Employee Name:</strong> {employee.name}, {employee.id}</p>
              <p className="mb-1"><strong className="w-32 inline-block">Designation:</strong> {employee.designation}</p>
              <p className="mb-1"><strong className="w-32 inline-block">Date of Joining:</strong> {payslipDetails.dateOfJoining}</p>
              <p className="mb-1"><strong className="w-32 inline-block">Pay Period:</strong> {payslipDetails.payPeriod}</p>
              <p className="mb-1"><strong className="w-32 inline-block">Pay Date:</strong> {payslipDetails.payDate}</p>
            </div>
            <div className="text-right md:text-left md:pl-8">
              <p className="text-lg font-semibold text-gray-800 mb-2">Employee Net Pay</p>
              <p className="text-3xl font-extrabold text-blue-700 mb-2">₹{netSalary.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Paid Days : {payslipDetails.paidDays} | LOP Days : {payslipDetails.lopDays}</p>
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 sm:p-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">EARNINGS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto border-collapse">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 border-b border-gray-300">Component</th>
                    <th className="p-3 border-b border-gray-300 text-right">Amount</th>
                    <th className="p-3 border-b border-gray-300 text-right">YTD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-100">Basic</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.earnings.basic.current.toFixed(2)}</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.earnings.basic.ytd.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-100">House Rent Allowance</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.earnings.hra.current.toFixed(2)}</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.earnings.hra.ytd.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-100">Fixed Allowance</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.earnings.fixedAllowance.current.toFixed(2)}</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.earnings.fixedAllowance.ytd.toFixed(2)}</td>
                  </tr>
                  <tr className="font-bold bg-blue-50 text-blue-800">
                    <td className="p-3 border-t border-b-2 border-blue-300">Gross Earnings</td>
                    <td className="p-3 border-t border-b-2 border-blue-300 text-right">₹{totalCurrentEarnings.toFixed(2)}</td>
                    <td className="p-3 border-t border-b-2 border-blue-300 text-right">₹{totalYTDEarnings.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deductions Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">DEDUCTIONS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto border-collapse">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 border-b border-gray-300">Component</th>
                    <th className="p-3 border-b border-gray-300 text-right">(-)Amount</th>
                    <th className="p-3 border-b border-gray-300 text-right">YTD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-100">Professional Tax</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.deductions.professionalTax.current.toFixed(2)}</td>
                    <td className="p-3 border-b border-gray-100 text-right">₹{salary.deductions.professionalTax.ytd.toFixed(2)}</td>
                  </tr>
                  <tr className="font-bold bg-red-50 text-red-800">
                    <td className="p-3 border-t border-b-2 border-red-300">Total Deductions</td>
                    <td className="p-3 border-t border-b-2 border-red-300 text-right">₹{totalCurrentDeductions.toFixed(2)}</td>
                    <td className="p-3 border-t border-b-2 border-red-300 text-right">₹{totalYTDDeductions.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Net Pay & Footer */}
        <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <p className="text-lg font-bold text-gray-800">NET PAY (Gross Earnings - Total Deductions)</p>
            <p className="text-xl font-bold text-blue-700">₹{netSalary.toFixed(2)}</p>
          </div>

          <div className="text-center mb-6">
            <p className="text-xl font-bold text-gray-800">Total Net Payable ₹{netSalary.toFixed(2)} <span className="font-normal italic text-gray-600">(Indian Rupee {numberToWords(netSalary)})</span></p>
          </div>

          <div className="border-t border-gray-300 pt-4 text-center text-sm text-gray-500">
            <p>— This document has been automatically generated by Zoho Payroll; therefore, a signature is not required. —</p>
          </div>
        </div>
      </div>    
    </div>
  );
};

export default SalarySlip;


// import React from "react";

// const SalarySlip = () => {
//   // Sample data - replace with actual props or state
//   const employee = {
//     name: "Gaurav",
//     id: "43521",
//     designation: "Associate Editor",
//     joiningDate: "30/06/2020",
//     company: "Zylker Corp",
//     location: "Gujarat, India"
//   };

//   const salary = {
//     month: "December 2023",
//     payDate: "31/01/2024",
//     earnings: {
//       basic: 43750.00,
//       hra: 21875.00,
//       fixedAllowance: 21875.00
//     },
//     deductions: {
//       professionalTax: 200.00
//     }
//   };

//   // Calculations
//   const grossEarnings = salary.earnings.basic + salary.earnings.hra + salary.earnings.fixedAllowance;
//   const totalDeductions = salary.deductions.professionalTax;
//   const netPayable = grossEarnings - totalDeductions;

//   // Number to words function
//   const numberToWords = (num) => {
//     const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
//     const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
//     const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

//     if (num === 0) return 'Zero Rupees';

//     function convertLessThanOneThousand(n) {
//       if (n === 0) return '';
//       if (n < 10) return units[n];
//       if (n < 20) return teens[n - 10];
//       if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
//       return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
//     }

//     let result = '';
//     if (num >= 10000000) {
//       result += convertLessThanOneThousand(Math.floor(num / 10000000)) + ' Crore ';
//       num %= 10000000;
//     }
//     if (num >= 100000) {
//       result += convertLessThanOneThousand(Math.floor(num / 100000)) + ' Lakh ';
//       num %= 100000;
//     }
//     if (num >= 1000) {
//       result += convertLessThanOneThousand(Math.floor(num / 1000)) + ' Thousand ';
//       num %= 1000;
//     }
//     if (num > 0) {
//       result += convertLessThanOneThousand(num);
//     }

//     return result.trim() + ' Only';
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 font-sans">
//       {/* Header */}
//       <div className="text-center mb-6">
//         <h1 className="text-xl font-bold">{employee.company}</h1>
//         <p className="text-sm">{employee.location}</p>
//       </div>

//       {/* Title */}
//       <h2 className="text-lg font-semibold text-center mb-6 border-b-2 border-gray-300 pb-2">
//         Pay slip for the month of {salary.month}
//       </h2>

//       {/* Employee Pay Summary */}
//       <div className="mb-6">
//         <h3 className="font-semibold mb-3">EMPLOYEE PAY SUMMARY</h3>

//         <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
//           <div><span className="font-medium">Employee Name</span> : {employee.name}, {employee.id}</div>
//           <div><span className="font-medium">Designation</span> : {employee.designation}</div>
//           <div><span className="font-medium">Date of Joining</span> : {employee.joiningDate}</div>
//           <div><span className="font-medium">Pay Period</span> : {salary.month}</div>
//           <div><span className="font-medium">Pay Date</span> : {salary.payDate}</div>
//         </div>

//         {/* Earnings & Deductions Table */}
//         <table className="w-full border-collapse mb-6 text-sm">
//           <thead>
//             <tr className="border-b border-t border-gray-300">
//               <th className="text-left py-2 font-semibold">EARNINGS</th>
//               <th className="text-right py-2 font-semibold">AMOUNT</th>
//               <th className="text-right py-2 font-semibold">YTD</th>
//               <th className="text-left py-2 font-semibold">DEDUCTIONS</th>
//               <th className="text-right py-2 font-semibold">AMOUNT</th>
//               <th className="text-right py-2 font-semibold">YTD</th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr className="border-b border-gray-200">
//               <td className="py-2">Basic</td>
//               <td className="text-right">₹{salary.earnings.basic.toFixed(2)}</td>
//               <td className="text-right">₹{salary.earnings.basic.toFixed(2)}</td>
//               <td>Professional Tax</td>
//               <td className="text-right">₹{salary.deductions.professionalTax.toFixed(2)}</td>
//               <td className="text-right">₹{salary.deductions.professionalTax.toFixed(2)}</td>
//             </tr>
//             <tr className="border-b border-gray-200">
//               <td className="py-2">House Rent Allowance</td>
//               <td className="text-right">₹{salary.earnings.hra.toFixed(2)}</td>
//               <td className="text-right">₹{salary.earnings.hra.toFixed(2)}</td>
//               <td></td>
//               <td></td>
//               <td></td>
//             </tr>
//             <tr className="border-b border-gray-200">
//               <td className="py-2">Fixed Allowance</td>
//               <td className="text-right">₹{salary.earnings.fixedAllowance.toFixed(2)}</td>
//               <td className="text-right">₹{salary.earnings.fixedAllowance.toFixed(2)}</td>
//               <td></td>
//               <td></td>
//               <td></td>
//             </tr>
//             <tr className="border-t-2 border-gray-300 font-semibold">
//               <td className="py-2">Gross Earnings</td>
//               <td className="text-right">₹{grossEarnings.toFixed(2)}</td>
//               <td></td>
//               <td className="py-2">Total Deductions</td>
//               <td className="text-right">₹{totalDeductions.toFixed(2)}</td>
//               <td></td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* Net Pay Section */}
//       <div className="mb-6">
//         <h3 className="font-semibold mb-3">NET PAY</h3>

//         <table className="w-full border-collapse mb-4 text-sm">
//           <tbody>
//             <tr className="border-b border-gray-200">
//               <td className="py-2 font-medium">Gross Earnings</td>
//               <td className="text-right">₹{grossEarnings.toFixed(2)}</td>
//             </tr>
//             <tr className="border-b border-gray-200">
//               <td className="py-2 font-medium">Total Deductions</td>
//               <td className="text-right">( ) ₹{totalDeductions.toFixed(2)}</td>
//             </tr>
//             <tr className="border-t-2 border-gray-300 font-semibold">
//               <td className="py-2">Total Net Payable</td>
//               <td className="text-right">₹{netPayable.toFixed(2)}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* Total Net Payable */}
//       <div className="text-center border-t-2 border-b-2 border-gray-300 py-3 mb-6">
//         <p className="font-semibold">
//           Total Net Payable ₹{netPayable.toFixed(2)} (Indian Rupee {numberToWords(netPayable)})
//         </p>
//         <p className="text-sm">Total Net Payable = Gross Earnings - Total Deductions</p>
//       </div>

//       {/* Footer Note */}
//       <div className="text-center text-xs text-gray-500">
//         <p>This document has been automatically generated by Zoho Payroll; therefore, a signature is not required.</p>
//       </div>
//     </div>
//   );
// };

// export default SalarySlip;
