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
            className="space-y-6" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
                    <p className="text-sm text-gray-500 mt-1">System activity and user actions tracking</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-700">
                        Total: <span className="font-bold text-gray-900">{totalElements}</span>
                    </p>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">User</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Endpoint</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {auditLogs.map((log, index) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {log.username || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={getRoleColor(log.role)}>
                                            {log.role ? log.role.replace('ROLE_', '') : '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                            {log.action || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-xs">
                                        {log.endpoint || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                                            log.method === 'POST' ? 'bg-green-100 text-green-800' :
                                            log.method === 'PUT' ? 'bg-blue-100 text-blue-800' :
                                            log.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                            log.method === 'GET' ? 'bg-gray-100 text-gray-800' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {log.method || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatTimestamp(log.timestamp)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-xs">
                                        {log.ipAddress || '—'}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium text-gray-900">{currentPage * pageSize + 1}</span> to{' '}
                            <span className="font-medium text-gray-900">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
                            <span className="font-medium text-gray-900">{totalElements}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                                    if (pageNum >= totalPages) return null;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                                pageNum === currentPage
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {auditLogs.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500 font-medium">No audit logs found</p>
                    <p className="text-sm text-gray-400 mt-1">Logs will appear here as users interact with the system</p>
                </div>
            )}
        </motion.div>
    );
};

export default AuditLogs;