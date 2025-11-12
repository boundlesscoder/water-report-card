'use client';

import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const InfoBox = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  trend = null,
  onClick 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-lg shadow-lg cursor-pointer ${colorClasses[color]}`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white text-sm font-medium opacity-90">{title}</p>
            <p className="text-white text-3xl font-bold mt-2">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-sm ${trend > 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-white text-xs ml-2">from last month</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className={`w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center text-white text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
          <span>More info</span>
          <ArrowRightIcon className="w-4 h-4 ml-1" />
        </div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="w-full h-full bg-white rounded-full transform translate-x-16 -translate-y-16"></div>
      </div>
    </motion.div>
  );
};

export default InfoBox; 