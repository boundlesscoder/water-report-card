'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../ui/Button';

const SalesChart = () => {
  const [chartType, setChartType] = useState('area');

  const data = [
    { name: 'January', new_users: 20, total_users: 15 },
    { name: 'February', new_users: 35, total_users: 25 },
    { name: 'March', new_users: 45, total_users: 35 },
    { name: 'April', new_users: 30, total_users: 40 },
    { name: 'May', new_users: 60, total_users: 50 },
    { name: 'June', new_users: 70, total_users: 65 },
    { name: 'July', new_users: 90, total_users: 80 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        <div className="flex space-x-2">
          <Button
            variant={chartType === 'area' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setChartType('area')}
          >
            Area
          </Button>
          <Button
            variant={chartType === 'donut' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setChartType('donut')}
          >
            Donut
          </Button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="new_users"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="total_users"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>New Users</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Total Users</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">Total: $350,000</p>
          <p className="text-xs">+12% from last month</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesChart; 