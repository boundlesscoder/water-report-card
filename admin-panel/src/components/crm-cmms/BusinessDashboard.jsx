'use client';

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const BusinessDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try business API first, fallback to mock data or existing endpoints
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/api/admin/business/dashboard/stats'),
          api.get('/api/admin/business/dashboard/activity')
        ]);
        
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
        
        if (activityRes.data?.success) {
          setActivity(activityRes.data.data);
        }
      } catch (businessApiError) {
        // Fallback to mock data for demonstration
        setStats({
          customers: { total_accounts: 1, active_accounts: 1, customer_types: 3 },
          locations: { total_locations: 20, active_locations: 20, regions: 1 },
          assets: { total_assets: 100, active_assets: 95, maintenance_assets: 5, overdue_maintenance: 2 },
          workOrders: { total_work_orders: 15, open_work_orders: 3, in_progress_work_orders: 2, critical_work_orders: 1 },
          serviceAlerts: { total_alerts: 8, unacknowledged_alerts: 3, critical_alerts: 1 }
        });
        setActivity([
          { type: 'work_order', id: '1', description: 'Filter maintenance at Press Coffee Biltmore', status: 'open', created_at: new Date().toISOString() },
          { type: 'service_alert', id: '2', description: 'Low flow rate detected at Scottsdale location', status: 'open', created_at: new Date().toISOString() }
        ]);
      }
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - matching existing CRM style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your CRM and CMMS operations
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Customer Accounts"
          value={stats?.customers?.total_accounts || 0}
          subtitle={`${stats?.customers?.active_accounts || 0} active`}
          icon={UserGroupIcon}
          color="blue"
          trend={`${stats?.customers?.customer_types || 0} types`}
        />
        
        <MetricCard
          title="Service Locations"
          value={stats?.locations?.total_locations || 0}
          subtitle={`${stats?.locations?.active_locations || 0} active`}
          icon={MapPinIcon}
          color="green"
          trend={`${stats?.locations?.regions || 0} regions`}
        />
        
        <MetricCard
          title="Equipment Assets"
          value={stats?.assets?.total_assets || 0}
          subtitle={`${stats?.assets?.active_assets || 0} operational`}
          icon={WrenchScrewdriverIcon}
          color="purple"
          trend={`${stats?.assets?.maintenance_assets || 0} in maintenance`}
        />
        
        <MetricCard
          title="Service Alerts"
          value={stats?.serviceAlerts?.unacknowledged_alerts || 0}
          subtitle={`${stats?.serviceAlerts?.critical_alerts || 0} critical`}
          icon={ExclamationTriangleIcon}
          color={stats?.serviceAlerts?.critical_alerts > 0 ? "red" : "yellow"}
          trend="Needs attention"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Orders Overview */}
        <div className="lg:col-span-2">
          <WorkOrdersOverview workOrderStats={stats?.workOrders} />
        </div>
        
        {/* Recent Activity */}
        <div>
          <RecentActivity activity={activity} />
        </div>
      </div>

      {/* Maintenance & Service Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaintenanceOverview assetStats={stats?.assets} />
        <ServiceAlertsOverview alertStats={stats?.serviceAlerts} />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value.toLocaleString()}
                </div>
              </dd>
              {subtitle && (
                <dd className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </dd>
              )}
              {trend && (
                <dd className="text-xs text-gray-500 mt-1">
                  {trend}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkOrdersOverview = ({ workOrderStats }) => {
  const statusData = [
    { 
      label: 'Open', 
      count: workOrderStats?.open_work_orders || 0, 
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    { 
      label: 'In Progress', 
      count: workOrderStats?.in_progress_work_orders || 0, 
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700'
    },
    { 
      label: 'Critical Priority', 
      count: workOrderStats?.critical_work_orders || 0, 
      color: 'bg-red-500',
      textColor: 'text-red-700'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Work Orders</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {statusData.map((item) => (
            <div key={item.label} className="text-center">
              <div className={`text-2xl font-bold ${item.textColor}`}>
                {item.count}
              </div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          {statusData.map((item) => {
            const total = workOrderStats?.total_work_orders || 1;
            const percentage = Math.round((item.count / total) * 100);
            
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const RecentActivity = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'work_order':
        return ClipboardDocumentListIcon;
      case 'service_alert':
        return ExclamationTriangleIcon;
      case 'asset':
        return WrenchScrewdriverIcon;
      default:
        return ChartBarIcon;
    }
  };

  const getActivityColor = (type, status) => {
    switch (type) {
      case 'work_order':
        return status === 'completed' ? 'text-green-600' : 'text-blue-600';
      case 'service_alert':
        return status === 'acknowledged' ? 'text-gray-600' : 'text-red-600';
      case 'asset':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {activity.slice(0, 10).map((item, index) => {
              const Icon = getActivityIcon(item.type);
              const isLast = index === activity.length - 1;
              
              return (
                <li key={`${item.type}-${item.id}`}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          getActivityColor(item.type, item.status).includes('red') ? 'bg-red-100' :
                          getActivityColor(item.type, item.status).includes('green') ? 'bg-green-100' :
                          getActivityColor(item.type, item.status).includes('blue') ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${getActivityColor(item.type, item.status)}`} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm text-gray-900">
                            {item.description}
                          </div>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              item.status === 'completed' || item.status === 'acknowledged' ? 'bg-green-100 text-green-800' :
                              item.status === 'critical' || item.status === 'open' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        {activity.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};

const MaintenanceOverview = ({ assetStats }) => {
  const overdueCount = assetStats?.overdue_maintenance || 0;
  const maintenanceCount = assetStats?.maintenance_assets || 0;
  const totalActive = assetStats?.active_assets || 1;
  
  const maintenanceHealth = Math.round(((totalActive - overdueCount) / totalActive) * 100);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Maintenance Overview</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {overdueCount}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {maintenanceCount}
            </div>
            <div className="text-sm text-gray-600">In Maintenance</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Maintenance Health Score</span>
            <span className="font-medium">{maintenanceHealth}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                maintenanceHealth >= 90 ? 'bg-green-500' :
                maintenanceHealth >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${maintenanceHealth}%` }}
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <div className="flex justify-between py-1">
            <span>Total Active Assets:</span>
            <span className="font-medium">{totalActive}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Assets Up to Date:</span>
            <span className="font-medium">{totalActive - overdueCount - maintenanceCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceAlertsOverview = ({ alertStats }) => {
  const totalAlerts = alertStats?.total_alerts || 0;
  const unacknowledged = alertStats?.unacknowledged_alerts || 0;
  const critical = alertStats?.critical_alerts || 0;
  
  const alertsHealth = totalAlerts > 0 ? Math.round(((totalAlerts - unacknowledged) / totalAlerts) * 100) : 100;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Service Alerts</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {critical}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {unacknowledged}
            </div>
            <div className="text-sm text-gray-600">Unacknowledged</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Response Rate</span>
            <span className="font-medium">{alertsHealth}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                alertsHealth >= 90 ? 'bg-green-500' :
                alertsHealth >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${alertsHealth}%` }}
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <div className="flex justify-between py-1">
            <span>Total Alerts:</span>
            <span className="font-medium">{totalAlerts}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Resolved:</span>
            <span className="font-medium">{totalAlerts - unacknowledged}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
