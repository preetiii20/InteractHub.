// import React, { useEffect, useState } from 'react';
// import { motion } from 'framer-motion';
// import apiClient from '../../services/apiClient';

// const AuditLogs = () => {
//   const [auditLogs, setAuditLogs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalElements, setTotalElements] = useState(0);
//   const [pageSize] = useState(20);

//   useEffect(() => {
//     fetchAuditLogs();
//   }, [currentPage]);

//   const fetchAuditLogs = async () => {
//     try {
//       const response = await apiClient.get('/admin/audit/logs', {
//         params: {
//           page: currentPage,
//           size: pageSize
//         }
//       });
      
//       const data = response.data;
//       setAuditLogs(data.auditLogs || []);
//       setTotalPages(data.totalPages || 0);
//       setTotalElements(data.totalElements || 0);
//     } catch (error) {
//       console.error("Failed to fetch audit logs:", error);
//       setAuditLogs([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatTimestamp = (timestamp) => {
//     if (!timestamp) return 'N/A';
//     return new Date(timestamp).toLocaleString();
//   };

//   const getActionColor = (action) => {
//     if (action.includes('CREATE') || action.includes('LOGIN')) return 'text-green-600';
//     if (action.includes('UPDATE') || action.includes('MODIFY')) return 'text-blue-600';
//     if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-600';
//     if (action.includes('ACCESS') || action.includes('VIEW')) return 'text-indigo-600';
//     return 'text-gray-600';
//   };

//   const getRoleColor = (role) => {
//     switch (role) {
//       case 'ROLE_ADMIN': return 'text-red-600 font-bold';
//       case 'ROLE_MANAGER': return 'text-blue-600 font-semibold';
//       case 'ROLE_HR': return 'text-green-600 font-semibold';
//       case 'ROLE_EMPLOYEE': return 'text-gray-600';
//       default: return 'text-gray-500';
//     }
//   };

//   const handlePageChange = (newPage) => {
//     if (newPage >= 0 && newPage < totalPages) {
//       setCurrentPage(newPage);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-indigo-600">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//           <p>Loading Audit Logs...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <motion.div 
//       className="space-y-6" 
//       initial={{ opacity: 0 }} 
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="flex justify-between items-center">
//         <h1 className="text-4xl font-extrabold text-gray-800">Audit Logs</h1>
//         <div className="text-sm text-gray-500">
//           Total: {totalElements} logs
//         </div>
//       </div>

//       {/* Audit Logs Table */}
//       <div className="bg-white rounded-xl shadow-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   User
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Role
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Action
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Endpoint
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Method
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Timestamp
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   IP Address
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {auditLogs.map((log, index) => (
//                 <motion.tr
//                   key={log.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="hover:bg-gray-50"
//                 >
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     {log.username || 'N/A'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <span className={getRoleColor(log.role)}>
//                       {log.role ? log.role.replace('ROLE_', '') : 'N/A'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <span className={getActionColor(log.action)}>
//                       {log.action || 'N/A'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {log.endpoint || 'N/A'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//                       {log.method || 'N/A'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {formatTimestamp(log.timestamp)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {log.ipAddress || 'N/A'}
//                   </td>
//                 </motion.tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
//             <div className="flex-1 flex justify-between sm:hidden">
//               <button
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 disabled={currentPage === 0}
//                 className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Previous
//               </button>
//               <button
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 disabled={currentPage >= totalPages - 1}
//                 className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Next
//               </button>
//             </div>
//             <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//               <div>
//                 <p className="text-sm text-gray-700">
//                   Showing{' '}
//                   <span className="font-medium">{currentPage * pageSize + 1}</span>
//                   {' '}to{' '}
//                   <span className="font-medium">
//                     {Math.min((currentPage + 1) * pageSize, totalElements)}
//                   </span>
//                   {' '}of{' '}
//                   <span className="font-medium">{totalElements}</span>
//                   {' '}results
//                 </p>
//               </div>
//               <div>
//                 <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
//                   <button
//                     onClick={() => handlePageChange(currentPage - 1)}
//                     disabled={currentPage === 0}
//                     className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Previous
//                   </button>
                  
//                   {/* Page numbers */}
//                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                     const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
//                     if (pageNum >= totalPages) return null;
                    
//                     return (
//                       <button
//                         key={pageNum}
//                         onClick={() => handlePageChange(pageNum)}
//                         className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
//                           pageNum === currentPage
//                             ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
//                             : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
//                         }`}
//                       >
//                         {pageNum + 1}
//                       </button>
//                     );
//                   })}
                  
//                   <button
//                     onClick={() => handlePageChange(currentPage + 1)}
//                     disabled={currentPage >= totalPages - 1}
//                     className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Next
//                   </button>
//                 </nav>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {auditLogs.length === 0 && !loading && (
//         <div className="text-center py-12">
//           <div className="text-gray-400 text-6xl mb-4">📋</div>
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
//           <p className="text-gray-500">Audit logs will appear here as users interact with the system.</p>
//         </div>
//       )}
//     </motion.div>
//   );
// };

// export default AuditLogs;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../services/apiClient';

// --- Helper Component for professional pagination buttons ---
const PaginationButton = ({ onClick, disabled, text, isActive, isMobile, isLast = false }) => {
    const baseClasses = "relative inline-flex items-center px-4 py-2 border text-sm font-medium transition duration-150 ease-in-out";
    
    // Teal Accent Classes
    const activeClasses = "z-10 bg-teal-500 border-teal-500 text-white hover:bg-teal-600"; // Primary accent
    const defaultClasses = "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"; 
    const disabledClasses = "opacity-50 cursor-not-allowed";

    let combinedClasses = isActive ? activeClasses : defaultClasses;

    if (disabled) {
        combinedClasses += ` ${disabledClasses}`;
    }

    if (!isMobile) {
        if (text === "Previous") {
            combinedClasses += " rounded-l-md";
        } else if (text === "Next" || isLast) {
            combinedClasses += " rounded-r-md";
        }
    }
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${combinedClasses} ${isMobile ? 'ml-3 w-1/2 justify-center' : ''}`}
        >
            {text}
        </button>
    );
};

// --- Main Audit Logs Component ---
const AuditLogs = () => {
    // --- FUNCTIONALITY: UNCHANGED ---
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(20);

    useEffect(() => {
        fetchAuditLogs();
    }, [currentPage]);

    const fetchAuditLogs = async () => {
        try {
            const response = await apiClient.get('/admin/audit/logs', {
                params: {
                    page: currentPage,
                    size: pageSize
                }
            });
            
            const data = response.data;
            setAuditLogs(data.auditLogs || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            setAuditLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleString();
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- UI LOGIC (Color functions adjusted for light theme with Teal accent) ---
    const getActionColor = (action) => {
        if (action.includes('CREATE') || action.includes('LOGIN')) return 'text-green-800 bg-green-100 border-green-300';
        if (action.includes('UPDATE') || action.includes('MODIFY')) return 'text-blue-800 bg-blue-100 border-blue-300';
        if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-800 bg-red-100 border-red-300';
        if (action.includes('ACCESS') || action.includes('VIEW')) return 'text-teal-800 bg-teal-100 border-teal-300';
        return 'text-gray-700 bg-gray-100 border-gray-300';
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'ROLE_ADMIN': return 'text-red-700 font-bold';
            case 'ROLE_MANAGER': return 'text-blue-700 font-semibold';
            case 'ROLE_HR': return 'text-green-700 font-semibold';
            case 'ROLE_EMPLOYEE': return 'text-gray-600';
            default: return 'text-gray-500';
        }
    };
    // -----------------------------------------------------------------------

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-teal-600">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-xl font-light">Loading System Logs...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            className="p-8 bg-gray-100 min-h-screen text-gray-900" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-full mx-auto">
                {/* --- Main Dashboard Card Container --- */}
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                    
                    {/* --- Teal Accent Header Bar (Perfectly matching the desired style) --- */}
                    <div className="flex justify-between items-center bg-slate-700 text-white p-4"> {/* Reduced padding for a tighter bar */}
                        <h1 className="text-xl font-extrabold tracking-wide px-2"> {/* Added left padding for text alignment */}
                            <i className="fas fa-history mr-3"></i> SYSTEM AUDIT LOGS
                        </h1>
                        <div className="text-sm font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-500 mr-2"> {/* Added right margin for spacing */}
                            Total Entries: {totalElements}
                        </div>
                    </div>

                    {/* --- Content Area within the Card --- */}
                    <div className="p-6">
                        
                        {/* --- Audit Logs Table --- */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white sticky top-0 z-10"> {/* Changed to white BG for cleaner look */}
                                    <tr>
                                        {/* Increased font color and weight for better contrast on white background */}
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-700 uppercase tracking-widest">USER</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-700 uppercase tracking-widest">ROLE</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-700 uppercase tracking-widest">ACTION</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-700 uppercase tracking-widest">ENDPOINT</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-700 uppercase tracking-widest">METHOD</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-700 uppercase tracking-widest">TIMESTAMP</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-700 uppercase tracking-widest">IP ADDRESS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200"> 
                                    {auditLogs.map((log, index) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03, duration: 0.3 }}
                                            className="hover:bg-teal-50 transition duration-150 ease-in-out" 
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {log.username || <span className="text-gray-400 italic">System</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={getRoleColor(log.role)}>
                                                    {log.role ? log.role.replace('ROLE_', '') : <span className="text-gray-400 italic">—</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                                                    {log.action || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                {log.endpoint || <span className="text-gray-400 italic">—</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold ${
                                                    log.method === 'POST' ? 'bg-green-100 text-green-700' :
                                                    log.method === 'PUT' ? 'bg-blue-100 text-blue-700' :
                                                    log.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-200 text-gray-700'
                                                }`}>
                                                    {log.method || <span className="text-gray-500">—</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatTimestamp(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                {log.ipAddress || <span className="text-gray-400 italic">Local</span>}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- Pagination --- */}
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-6 sm:px-6">
                                
                                {/* Mobile Pagination */}
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <PaginationButton 
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        text="Previous"
                                        isMobile={true}
                                    />
                                    <PaginationButton
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                        text="Next"
                                        isMobile={true}
                                    />
                                </div>
                                
                                {/* Desktop Pagination */}
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing{' '}
                                            <span className="font-medium text-gray-900">{currentPage * pageSize + 1}</span>
                                            {' '}to{' '}
                                            <span className="font-medium text-gray-900">
                                                {Math.min((currentPage + 1) * pageSize, totalElements)}
                                            </span>
                                            {' '}of{' '}
                                            <span className="font-medium text-gray-900">{totalElements}</span>
                                            {' '}entries
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <PaginationButton 
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 0}
                                                text="Previous"
                                            />
                                            
                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                                                if (pageNum >= totalPages) return null;
                                                
                                                return (
                                                    <PaginationButton
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        isActive={pageNum === currentPage}
                                                        text={pageNum + 1}
                                                    />
                                                );
                                            })}
                                            
                                            <PaginationButton
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage >= totalPages - 1}
                                                text="Next"
                                                isLast={true}
                                            />
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Enhanced Zero State/Empty Data Placeholder --- */}
                {auditLogs.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white mt-8 rounded-xl shadow-lg border border-gray-200">
                        <div className="text-teal-500 text-7xl mb-6 opacity-80">
                            <i className="fas fa-search-location"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2 tracking-wider">
                            AWAITING SYSTEM ACTIVITY
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            There are currently no audit logs recorded. Logs will be automatically displayed here upon user interactions.
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AuditLogs;