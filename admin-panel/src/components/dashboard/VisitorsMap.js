'use client';

import { motion } from 'framer-motion';
import { UsersIcon, GlobeAltIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const VisitorsMap = () => {
  const stats = [
    { label: 'Visitors', value: '1,234', icon: UsersIcon, color: 'blue' },
    { label: 'Online', value: '567', icon: GlobeAltIcon, color: 'green' },
    { label: 'Last 5 minutes', value: '89', icon: ChartBarIcon, color: 'purple' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-600 rounded-lg shadow-lg text-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-blue-500">
        <h3 className="text-lg font-semibold">Visitors</h3>
      </div>

      {/* Map Placeholder */}
      <div className="p-4">
        <div className="bg-blue-700 rounded-lg h-48 flex items-center justify-center mb-4">
          <div className="text-center">
            <GlobeAltIcon className="w-16 h-16 mx-auto mb-2 text-blue-300" />
            <p className="text-blue-200 text-sm">United States Map</p>
            <p className="text-blue-300 text-xs">Interactive map showing visitor locations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-blue-200">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default VisitorsMap; 