'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SalesGraph = () => {
  const data = [
    { quarter: '2011 Q1', sales: 5000 },
    { quarter: '2011 Q2', sales: 8000 },
    { quarter: '2011 Q3', sales: 12000 },
    { quarter: '2011 Q4', sales: 15000 },
    { quarter: '2012 Q1', sales: 18000 },
    { quarter: '2012 Q2', sales: 20000 },
    { quarter: '2012 Q3', sales: 22000 },
    { quarter: '2012 Q4', sales: 25000 },
    { quarter: '2013 Q1', sales: 28000 },
    { quarter: '2013 Q2', sales: 30000 }
  ];

  const progressData = [
    { label: 'Mail-Orders', percentage: 20, color: 'bg-blue-500' },
    { label: 'Online', percentage: 50, color: 'bg-green-500' },
    { label: 'In-Store', percentage: 30, color: 'bg-purple-500' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600 to-green-600 rounded-lg shadow-lg text-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-blue-500">
        <h3 className="text-lg font-semibold">Users Activity Graph</h3>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="quarter" 
                stroke="rgba(255,255,255,0.7)"
                fontSize={10}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                fontSize={10}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#ffffff"
                strokeWidth={3}
                dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-3">
          {progressData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-blue-100">{item.label}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-blue-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{item.percentage}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SalesGraph; 