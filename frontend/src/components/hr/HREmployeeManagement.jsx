import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const HREmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newEmployee, setNewEmployee] = useState({
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        phoneNumber: '',
        department: ''
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            // Using admin service to get all employees (or HR service when created)
            const response = await axios.get(`${apiConfig.adminService}/users/role/EMPLOYEE`, {
                headers: {
                    'X-User-Name': authHelpers.getUserEmail(),
                    'X-User-Role': 'HR'
                }
            });
            setEmployees(response.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setEmployees([]);
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${apiConfig.adminService}/users`, {
                firstName: newEmployee.firstName,
                lastName: newEmployee.lastName,
                email: newEmployee.email,
                position: newEmployee.position,
                phoneNumber: newEmployee.phoneNumber,
                department: newEmployee.department,
                role: 'EMPLOYEE'
            }, {
                headers: {
                    'X-User-Name': authHelpers.getUserEmail(),
                    'X-User-Role': 'HR'
                }
            });
            
            setShowAddForm(false);
            setNewEmployee({ firstName: '', lastName: '', email: '', position: '', phoneNumber: '', department: '' });
            await fetchEmployees();
            alert('Employee created successfully!');
        } catch (err) {
            console.error('Error adding employee:', err);
            alert('Failed to create employee: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${apiConfig.adminService}/users/${editingEmployee.id}`, {
                firstName: editingEmployee.firstName,
                lastName: editingEmployee.lastName,
                email: editingEmployee.email,
                position: editingEmployee.position,
                phoneNumber: editingEmployee.phoneNumber,
                departmentId: editingEmployee.departmentId,
                isActive: editingEmployee.isActive
            }, {
                headers: {
                    'X-User-Name': authHelpers.getUserEmail(),
                    'X-User-Role': 'HR'
                }
            });
            
            setEditingEmployee(null);
            await fetchEmployees();
            alert('Employee updated successfully!');
        } catch (err) {
            console.error('Error updating employee:', err);
            alert('Failed to update employee: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            return;
        }
        
        try {
            await axios.delete(`${apiConfig.adminService}/users/${employeeId}`, {
                headers: {
                    'X-User-Name': authHelpers.getUserEmail(),
                    'X-User-Role': 'HR'
                }
            });
            
            await fetchEmployees();
            alert('Employee deleted successfully!');
        } catch (err) {
            console.error('Error deleting employee:', err);
            alert('Failed to delete employee: ' + (err.response?.data?.error || err.message));
        }
    };

    const filteredEmployees = employees.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading employees...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Add Employee
                </button>
            </div>

            <div className="flex space-x-2">
                <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Add New Employee</h3>
                    <form onSubmit={handleAddEmployee} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={newEmployee.firstName}
                                onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={newEmployee.lastName}
                                onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Position"
                                value={newEmployee.position}
                                onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={newEmployee.phoneNumber}
                                onChange={(e) => setNewEmployee({...newEmployee, phoneNumber: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Department"
                            value={newEmployee.department}
                            onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                Add Employee
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {editingEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Edit Employee</h3>
                        <form onSubmit={handleUpdateEmployee} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={editingEmployee.firstName || ''}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, firstName: e.target.value})}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={editingEmployee.lastName || ''}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, lastName: e.target.value})}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={editingEmployee.email || ''}
                                onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Position"
                                value={editingEmployee.position || ''}
                                onChange={(e) => setEditingEmployee({...editingEmployee, position: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={editingEmployee.phoneNumber || ''}
                                onChange={(e) => setEditingEmployee({...editingEmployee, phoneNumber: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingEmployee.isActive !== false}
                                    onChange={(e) => setEditingEmployee({...editingEmployee, isActive: e.target.checked})}
                                    className="mr-2"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingEmployee(null)}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEmployees.map((employee) => (
                            <tr key={employee.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {employee.firstName} {employee.lastName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.position || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.phoneNumber || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        employee.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {employee.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => setEditingEmployee({...employee})}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmployee(employee.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredEmployees.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No employees found</div>
                )}
            </div>
        </div>
    );
};

export default HREmployeeManagement;

