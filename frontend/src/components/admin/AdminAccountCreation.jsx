import React, { useState } from 'react';
import axios from 'axios';
import apiConfig from '../../config/api';

const initialUser = { firstName: '', lastName: '', email: '', password: '', phoneNumber: '', departmentId: '' };

const AdminAccountCreation = () => {
  const [role, setRole] = useState('HR');
  const [form, setForm] = useState({ ...initialUser });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const payload = { ...form, role };
      
      const response = await axios.post(`${apiConfig.adminService}/users`, payload);
      
      if (response.status === 200 || response.status === 201) {
        setMessage({ type: 'success', text: `${role} account created successfully!` });
        setForm({ ...initialUser });
        
        // Auto-refresh the page after 2 seconds to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || `Could not create ${role} account.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Accounts</h2>

      {message && (
        <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Role</span>
            <select value={role} onChange={(e)=>setRole(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded">
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Department ID (optional)</span>
            <input name="departmentId" value={form.departmentId} onChange={onChange} className="mt-1 w-full px-3 py-2 border rounded" placeholder="e.g. 1" />
          </label>
        </div>

        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">First Name</span>
            <input name="firstName" value={form.firstName} onChange={onChange} required className="mt-1 w-full px-3 py-2 border rounded" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Last Name</span>
            <input name="lastName" value={form.lastName} onChange={onChange} required className="mt-1 w-full px-3 py-2 border rounded" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input type="email" name="email" value={form.email} onChange={onChange} required className="mt-1 w-full px-3 py-2 border rounded" />
          </label>
          {role === 'EMPLOYEE' ? (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 italic">Note: Password will be auto-generated for employees and sent via email.</p>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input type="password" name="password" value={form.password} onChange={onChange} required className="mt-1 w-full px-3 py-2 border rounded" />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Phone Number</span>
            <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} className="mt-1 w-full px-3 py-2 border rounded" />
          </label>

          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-ih-primary text-white rounded hover:bg-indigo-700">
              {loading ? 'Creating...' : `Create ${role}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAccountCreation;







