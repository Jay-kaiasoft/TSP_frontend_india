
const PTPDFTable = ({ data, companyInfo, filter }) => {
    const rows = data?.filter(item => !item?.isTotalRow);
    return (
        <div className="overflow-x-auto h-full">
            <div id="PT-table-container" style={{ width: '1000px', border: '2px solid black', padding: '16px' }}>
                <div className='flex justify-start items-center mb-2'>
                    <div className='grow'>
                        <div>
                            <img src={companyInfo?.companyLogo} alt="Logo" className="w-40 h-22 border" />
                        </div>
                    </div>
                    <div>
                        <h1 className='font-bold text-2xl text-end capitalize'>Employee PT Report</h1>
                    </div>
                </div>

                <div className='flex justify-start items-center mb-5'>
                    <div className='grow'>
                        <div>
                            <p className='font-semibold text-lg'>Company: {companyInfo?.companyName}</p>
                        </div>
                    </div>
                    <div>
                        <h1 className='font-semibold text-lg text-center'>From: &nbsp;&nbsp;&nbsp; {filter?.title}</h1>
                    </div>
                </div>

                <table className="min-w-full border-collapse border-2 border-black h-full">
                    <thead>
                        <tr>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">#</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Employee Name</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Gross Salary(Monthly)</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Total Gross Salary</th>
                            <th className="border border-black py-2 px-2 text-center text-sm bg-gray-300 h-5 capitalize">Professional Tax Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows?.map((item, index) => (
                            <tr key={index} className="border border-black">
                                <td className="border border-black text-center text-sm h-10">{index + 1}</td>
                                <td className="border border-black text-center text-sm h-10">{item?.userName}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.gross_salary?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.total_gross_salary?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                                <td className="border border-black text-center text-sm h-10">₹{item?.pt_amount?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>                               
                            </tr>
                        ))}
                        <tr className="border border-black">
                            <td colSpan={4} className="border border-black text-center text-sm h-10">
                                <strong className='font-bold mr-5'>Total</strong>
                            </td>
                            <td className="border border-black text-center text-sm h-10">
                                <strong className='font-bold'>₹{rows?.reduce((acc, item) => acc + (item?.pt_amount || 0), 0)?.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PTPDFTable