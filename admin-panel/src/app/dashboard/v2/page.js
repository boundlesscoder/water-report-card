"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  WalletIcon,
  HeartIcon,
  UserGroupIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../components/layout/DashboardLayout';

export default function AnalyticsDashboard() {
  const metricCards = [
    {
      title: 'Page Views',
      value: '234k',
      change: '43.2',
      trend: 'down',
      icon: DocumentTextIcon,
      color: 'text-red-500'
    },
    {
      title: 'Time On Site',
      value: '12m 3s',
      change: '19.8',
      trend: 'up',
      icon: ClockIcon,
      color: 'text-green-500'
    },
    {
      title: 'Bounce Rate',
      value: '52.12%',
      change: '19.8 vs 36,144',
      trend: 'up',
      icon: ChartBarIcon,
      color: 'text-green-500'
    },
    {
      title: 'Revenue Status',
      value: '$2,206.62',
      change: '43.2 vs $5,699',
      trend: 'down',
      icon: WalletIcon,
      color: 'text-red-500'
    },
    {
      title: 'Impressions',
      value: '168',
      change: '0.8%',
      trend: 'up',
      icon: HeartIcon,
      color: 'text-green-500'
    },
    {
      title: 'Total Followers',
      value: '3456k',
      change: '0.8%',
      trend: 'up',
      icon: UserGroupIcon,
      color: 'text-green-500'
    }
  ];

  const countries = [
    { name: 'Arizona', flag: '🇺🇸', views: 6425 },
    { name: 'Phoenix', flag: '🇨🇳', views: 5582 },
    { name: 'Scottsdale', flag: '🇩🇪', views: 4587 },
    { name: 'Tucson', flag: '🇷🇺', views: 2520 },
    { name: 'Flagstaff', flag: '🇮🇳', views: 6429 }
  ];

  const trafficData = [
    { country: 'Arizona', total: 4534, entrances: 134, bounceRate: '33.58%', exits: '15.47%' },
    { country: 'Phoenix', total: 5463, entrances: 290, bounceRate: '9.22%', exits: '7.99%' },
    { country: 'Scottsdale', total: 6534, entrances: 250, bounceRate: '20.75%', exits: '2.40%' },
    { country: 'Tucson', total: 4532, entrances: 216, bounceRate: '32.07%', exits: '15.09%' },
    { country: 'Flagstaff', total: 5643, entrances: 216, bounceRate: '32.07%', exits: '15.09%' },
  ];

  const visitedPages = [
    { page: 'home/index.html', browsers: 3456, visitors: 556, unique: 556, bounceRate: '13.6%', updated: 'July 13, 2025' },
    { page: 'Store/shop/cart.html', browsers: 3456, visitors: 556, unique: 556, bounceRate: '13.6%', updated: 'June 15, 2025' },
    { page: 'Store/shop', browsers: 3456, visitors: 556, unique: 556, bounceRate: '13.6%', updated: 'July 8, 2025' },
    { page: 'home/blog.html', browsers: 3456, visitors: 556, unique: 556, bounceRate: '13.6%', updated: 'June 28, 2025' },
    { page: 'home/blog/blog-overview.html', browsers: 3456, visitors: 556, unique: 556, bounceRate: '13.6%', updated: 'July 2, 2025' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Congratulations Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-yellow-800" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">Congratulations Dave!</h2>
                <p className="text-blue-100">You reached Page Views <span className="font-bold">10M</span> You have done 100% reached target today.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {metricCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="flex items-center space-x-1">
                  {card.trend === 'up' ? (
                    <ArrowUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${card.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {card.change}
                  </span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className={`text-xs ${card.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {card.trend === 'up' ? 'than last month' : 'vs $5,699 than last month'}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Follower Growth */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Follower Growth</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="85, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">85%</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 mb-2">65,268</p>
              <div className="flex items-center justify-center space-x-1 mb-2">
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">0.82% since last week</span>
              </div>
              <p className="text-sm text-gray-600">It is a long established fact that a ayout. Updated 20 minutes ago</p>
            </div>
          </motion.div>

          {/* Country Wise Page Views */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week Page Views</h3>
            <div className="space-y-3">
              {countries.map((country, index) => (
                <div key={country.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{country.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{country.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View All
            </button>
          </motion.div>

          {/* Website Overview Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Website Overview</h3>
            <div className="h-48 flex items-end justify-between space-x-1">
              {Array.from({ length: 12 }, (_, i) => {
                const pageViews = Math.floor(Math.random() * 8000) + 1000;
                const newVisitors = Math.floor(Math.random() * 4000) + 500;
                return (
                  <div key={i} className="flex flex-col items-center space-y-1">
                    <div className="w-6 bg-blue-500 rounded-t" style={{ height: `${(pageViews / 8000) * 120}px` }}></div>
                    <div className="w-6 bg-red-500 rounded-t" style={{ height: `${(newVisitors / 4000) * 80}px` }}></div>
                    <span className="text-xs text-gray-500">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Page views</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">New Visitors</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Traffic Source */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Source</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">CITY</th>
                    <th className="text-left py-2 font-medium text-gray-700">TOTAL TRAFFIC</th>
                    <th className="text-left py-2 font-medium text-gray-700">ENTRANCES</th>
                    <th className="text-left py-2 font-medium text-gray-700">BOUNCE RATE</th>
                    <th className="text-left py-2 font-medium text-gray-700">EXITS</th>
                  </tr>
                </thead>
                <tbody>
                  {trafficData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-900">{row.country}</td>
                      <td className="py-2 text-gray-600">{row.total.toLocaleString()}</td>
                      <td className="py-2 text-gray-600">{row.entrances} ({(row.entrances/row.total*100).toFixed(2)}%)</td>
                      <td className="py-2 text-gray-600">{row.bounceRate} <ArrowDownIcon className="w-3 h-3 inline text-green-500" /></td>
                      <td className="py-2 text-gray-600">{row.exits} <ArrowUpIcon className="w-3 h-3 inline text-red-500" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Website Visitors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Website Visitors</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="40, 100"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="35, 100"
                    strokeLinecap="round"
                    strokeDashoffset="-40"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="25, 100"
                    strokeLinecap="round"
                    strokeDashoffset="-75"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Local</span>
                </div>
                <span className="text-sm font-medium text-gray-900">40%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Domestic</span>
                </div>
                <span className="text-sm font-medium text-gray-900">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">International</span>
                </div>
                <span className="text-sm font-medium text-gray-900">25%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Most Visited Pages - Full Width Below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Visited Pages</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700">PAGE NAME</th>
                  <th className="text-left py-2 font-medium text-gray-700">BROWSERS</th>
                  <th className="text-left py-2 font-medium text-gray-700">VISITORS</th>
                  <th className="text-left py-2 font-medium text-gray-700">UNIQUE PAGE VISITORS</th>
                  <th className="text-left py-2 font-medium text-gray-700">BOUNCE RATE</th>
                  <th className="text-left py-2 font-medium text-gray-700">PAGE UPDATED</th>
                  <th className="text-left py-2 font-medium text-gray-700">PREVIEW</th>
                </tr>
              </thead>
              <tbody>
                {visitedPages.map((page, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">{page.page}</td>
                    <td className="py-2 text-gray-600">
                      <div className="flex -space-x-1">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div key={i} className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white"></div>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 text-gray-600">{page.browsers.toLocaleString()}</td>
                    <td className="py-2 text-gray-600">{page.visitors.toLocaleString()}</td>
                    <td className="py-2 text-gray-600">{page.bounceRate} <ArrowDownIcon className="w-3 h-3 inline text-green-500" /></td>
                    <td className="py-2 text-gray-600">{page.updated}</td>
                    <td className="py-2 text-gray-600">
                      <EyeIcon className="w-4 h-4 text-blue-500 cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 