import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectGroups, setProjectGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'MEDIUM',
    dueDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const managerId = authHelpers.getUserId();
      if (!managerId) return;

      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': managerId.toString()
      };

      const [projectsResponse, groupsResponse, employeesResponse] = await Promise.allSettled([
        axios.get(`${apiConfig.managerService}/projects/my/${managerId}`, { headers: authHeaders }),
        axios.get(`${apiConfig.managerService}/project-groups/${managerId}`, { headers: authHeaders }),
        axios.get(`${apiConfig.managerService}/employees/${managerId}`, { headers: authHeaders })
      ]);

      const projectsData = projectsResponse.status === 'fulfilled' ? projectsResponse.value.data : [];
      const groupsData = groupsResponse.status === 'fulfilled' ? groupsResponse.value.data : [];
      const employeesData = employeesResponse.status === 'fulfilled' ? employeesResponse.value.data : [];

      setProjects(projectsData);
      setProjectGroups(groupsData);
      setEmployees(employeesData);

      // Initialize with empty tasks - will be populated when tasks are created
      setTasks([]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      if (!selectedGroup) return;

      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': authHelpers.getUserId().toString()
      };

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assigneeId: parseInt(newTask.assigneeId),
        priority: newTask.priority,
        dueDate: newTask.dueDate || null
      };

      const response = await axios.post(
        `${apiConfig.managerService}/projects/${selectedProject.id}/groups/${selectedGroup.id}/tasks`,
        taskData,
        { headers: authHeaders }
      );
      
      // Add the new task to the local state
      setTasks([...tasks, response.data]);
      
      setNewTask({
        title: '',
        description: '',
        assigneeId: '',
        priority: 'MEDIUM',
        dueDate: ''
      });
      setShowCreateTask(false);
      setSelectedProject(null);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      // Mock API call - replace with actual endpoint when available
      console.log('Updating task status:', taskId, newStatus);
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getProjectGroups = (projectId) => {
    return projectGroups.filter(group => group.projectId === projectId);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  const getProjectName = (projectGroupId) => {
    const group = projectGroups.find(g => g.id === projectGroupId);
    if (!group) return 'Unknown Project';
    const project = projects.find(p => p.id === group.projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ih-primary text-xl">Loading Tasks...</div>
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
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
        <button
          onClick={() => setShowCreateTask(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Task
        </button>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="text-2xl">🔄</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'DONE').length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked</p>
              <p className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.status === 'BLOCKED').length}
              </p>
            </div>
            <div className="text-2xl">🚫</div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">All Tasks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              className="p-6 hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-800">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👤 {getEmployeeName(task.assigneeId)}</span>
                    <span>📁 {getProjectName(task.projectGroupId)}</span>
                    <span>📅 Due: {task.dueDate}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.status !== 'DONE' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'DONE')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                    >
                      Mark Done
                    </button>
                  )}
                  {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {task.status !== 'BLOCKED' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'BLOCKED')}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                    >
                      Block
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === parseInt(e.target.value));
                    setSelectedProject(project);
                    setSelectedGroup(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Group</label>
                  <select
                    value={selectedGroup?.id || ''}
                    onChange={(e) => {
                      const group = getProjectGroups(selectedProject.id).find(g => g.id === parseInt(e.target.value));
                      setSelectedGroup(group);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a group</option>
                    {getProjectGroups(selectedProject.id).map(group => (
                      <option key={group.id} value={group.id}>{group.groupName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newTask.assigneeId}
                  onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createTask}
                disabled={!selectedGroup || !newTask.title || !newTask.assigneeId}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  !selectedGroup || !newTask.title || !newTask.assigneeId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Create Task
              </button>
              <button
                onClick={() => {
                  setShowCreateTask(false);
                  setNewTask({
                    title: '',
                    description: '',
                    assigneeId: '',
                    priority: 'MEDIUM',
                    dueDate: ''
                  });
                  setSelectedProject(null);
                  setSelectedGroup(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default TaskManagement;
