'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const TodoList = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Design a nice theme', time: '2 mins', completed: false },
    { id: 2, title: 'Make the theme responsive', time: '4 hours', completed: true },
    { id: 3, title: 'Let theme shine like a star', time: '1 day', completed: false },
    { id: 4, title: 'Let theme shine like a star', time: '3 days', completed: false },
    { id: 5, title: 'Check your messages and notifications', time: '1 week', completed: false },
    { id: 6, title: 'Let theme shine like a star', time: '1 month', completed: false }
  ]);
  const [newTask, setNewTask] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      const newTaskItem = {
        id: Date.now(),
        title: newTask.trim(),
        time: 'Just now',
        completed: false
      };
      setTasks([newTaskItem, ...tasks]);
      setNewTask('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentTasks = tasks.slice(startIndex, endIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">To Do List</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            &lt;&lt;
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} {totalPages > 1 && `/ ${totalPages}`}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            &gt;&gt;
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4">
        <AnimatePresence>
          {currentTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center space-x-3 py-2 group"
            >
              <Bars3Icon className="w-4 h-4 text-gray-400 cursor-move group-hover:text-gray-600" />
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </span>
                <span className="text-xs text-gray-500 ml-2">({task.time})</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Task */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add new task..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={addTask}
              disabled={!newTask.trim()}
              size="sm"
              className="px-3"
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TodoList; 