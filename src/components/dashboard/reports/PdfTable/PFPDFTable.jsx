
const PFPDFTable = ({ data, companyInfo, filter }) => {
    const rows = data?.filter(item => !item?.isTotalRow);
    return (
        <div className="overflow-x-auto h-full">
            <div id="PF-table-container" style={{ width: '1000px', border: '2px solid black', padding: '16px' }}>
                <div className='flex justify-start items-center mb-2'>
                    <div className='grow'>
                        <div>
                            <img src={companyInfo?.companyLogo} alt="Logo" className="w-40 h-22 border" />
                        </div>
                    </div>
                    <div>
                        <h1 className='font-bold text-2xl text-end capitalize'>Employee PF Report</h1>
                    </div>
                </div>

                <div className='flex justify-start items-center mb-5'>
                    <div className='grow'>
                        <div>
                            <p className='font-bold text-xl'>Company: {companyInfo?.companyName}</p>
                        </div>
                    </div>
                    <div>
                        <h1 className='font-bold text-xl text-center'>From: &nbsp;&nbsp;&nbsp; {filter?.title}</h1>
                    </div>
                </div>

                <table className="min-w-full border-collapse border-2 border-black h-full">
                    <thead>
                        <tr>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">#</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Employee Name</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Basic Salary(Monthly)</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Total Basic Salary</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Employee PF</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Employer PF</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Total PF</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows?.map((item, index) => (
                            <tr key={index} className="border border-black">
                                <td className="border border-black text-center text-sm h-10">{index + 1}</td>
                                <td className="border border-black text-center text-sm h-10">{item?.userName}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.basic_salary?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.total_basic_salary?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.employee_pf_amount?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.employer_pf_amount?.toLocaleString()}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.total_amount?.toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr className="border border-black">
                            <td colSpan={6} className="border border-black text-right text-sm h-10">
                                <strong className='font-bold mr-5'>Total</strong>
                            </td>
                            <td className="border border-black text-center text-sm h-10">
                                <strong className='font-bold'>₹{rows?.reduce((acc, item) => acc + (item?.total_amount || 0), 0)?.toLocaleString()}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PFPDFTable