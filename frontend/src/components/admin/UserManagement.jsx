import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const ADMIN_SERVICE_URL = 'http://localhost:8081/api';

const rowVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', createdBy: 1 });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get the admin's organizationId from localStorage (where authHelpers stores it)
      const user = JSON.parse(localStorage.getItem('interacthub_user') || sessionStorage.getItem('interacthub_session_user') || '{}');
      const organizationId = user.organizationId;
      
      console.log('DEBUG: User from storage:', user);
      console.log('DEBUG: OrganizationId:', organizationId);
      
      // Add organizationId as query parameter to filter users
      const url = organizationId 
        ? `${ADMIN_SERVICE_URL}/admin/users/all?organizationId=${organizationId}`
        : `${ADMIN_SERVICE_URL}/admin/users/all`;
      
      console.log('DEBUG: Fetching URL:', url);
      
      const response = await axios.get(url);
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data.users && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setMessage({ type: 'error', text: 'Failed to load user data.' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Get the admin's organizationId from localStorage (where authHelpers stores it)
      const user = JSON.parse(localStorage.getItem('interacthub_user') || sessionStorage.getItem('interacthub_session_user') || '{}');
      const organizationId = user.organizationId;
      
      console.log('DEBUG: Creating user with organizationId:', organizationId);
      
      // Add organizationId to the new user
      const userToCreate = {
        ...newUser,
        organizationId: organizationId ? parseInt(organizationId) : null
      };
      
      await axios.post(`${ADMIN_SERVICE_URL}/admin/users`, userToCreate);
      setMessage({ type: 'success', text: `User ${newUser.email} created! Onboarding email sent (mocked).` });
      setIsModalOpen(false);
      fetchUsers(); 
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create user.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete user ID ${id}?`)) return;
    try {
      await axios.delete(`${ADMIN_SERVICE_URL}/admin/users/${id}`);
      setMessage({ type: 'success', text: `User ID ${id} deleted.` });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user.' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="text-center p-10 text-ih-primary">Loading User Data...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">User & Account Management</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-ih-primary text-white rounded-lg hover:bg-indigo-700 transition transform hover:scale-[1.05]"
        >
          + Create New User
        </button>
      </div>

      {message && (
        <motion.div 
          className={`p-3 rounded-lg font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {message.text}
        </motion.div>
      )}

      {/* User Table with Staggered Animation */}
      <div className="bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 p-6 rounded-xl shadow-lg overflow-x-auto border border-indigo-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-200 to-blue-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <motion.tbody 
            className="divide-y divide-gray-200"
            variants={{
              animate: { transition: { staggerChildren: 0.05 } }
            }}
            initial="initial"
            animate="animate"
          >
            {users.map((user, index) => (
              <motion.tr key={user.id} variants={rowVariants} transition={{ delay: index * 0.05 }} className="bg-gradient-to-r from-indigo-100/60 to-blue-100/60 hover:from-indigo-200/70 hover:to-blue-200/70 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'HR' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900 transition"
                  >
                    Delete
                  </button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white p-8 rounded-xl w-full max-w-lg shadow-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input type="text" name="firstName" placeholder="First Name" onChange={handleInputChange} required className="w-full p-2 border rounded-lg" />
              <input type="text" name="lastName" placeholder="Last Name" onChange={handleInputChange} required className="w-full p-2 border rounded-lg" />
              <input type="email" name="email" placeholder="Email (Unique)" onChange={handleInputChange} required className="w-full p-2 border rounded-lg" />
              <input type="password" name="password" placeholder="Temporary Password" onChange={handleInputChange} required className="w-full p-2 border rounded-lg" />
              <select name="role" onChange={handleInputChange} required className="w-full p-2 border rounded-lg bg-white">
                <option value="EMPLOYEE">Employee (Default)</option>
                <option value="MANAGER">Manager</option>
                <option value="HR">HR</option>
              </select>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-ih-primary text-white rounded-lg hover:bg-indigo-700">Create & Send Onboarding</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default UserManagement;