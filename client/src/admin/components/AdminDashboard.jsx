import React from 'react';
import { Users, TrendingUp, DollarSign, Activity,Smartphone,Laptop,Tablet} from 'lucide-react';
export default function AdminDashboard() {
  const stats = [
    {
      title: 'Volume',
      value: '$24,242.58',
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'positive',
      description: 'Total trading volume'
    },
    {
      title: 'Trades',
      value: '0',
      icon: Activity,
      change: '0%',
      changeType: 'neutral',
      description: 'Number of trades'
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: TrendingUp,
      change: '0%',
      changeType: 'neutral',
      description: 'Platform revenue'
    },
    {
      title: 'Users',
      value: '87',
      icon: Users,
      change: '+5.2%',
      changeType: 'positive',
      description: 'Active users'
    }
  ];

  const userGrowthData = [
    { month: 'Jan', users: 45, growth: 15 },
    { month: 'Feb', users: 52, growth: 18 },
    { month: 'Mar', users: 48, growth: 12 },
    { month: 'Apr', users: 61, growth: 25 },
    { month: 'May', users: 67, growth: 22 },
    { month: 'Jun', users: 72, growth: 18 },
    { month: 'Jul', users: 78, growth: 20 },
    { month: 'Aug', users: 82, growth: 15 },
    { month: 'Sep', users: 87, growth: 12 },
  ];

  const deviceUsage = [
    { device: 'Mobile', percentage: 65, icon: Smartphone, color: 'bg-blue-500' },
    { device: 'Desktop', percentage: 25, icon: Laptop, color: 'bg-green-500' },
    { device: 'Tablet', percentage: 10, icon: Tablet, color: 'bg-purple-500' },
  ];

  const maxUsers = Math.max(...userGrowthData.map(item => item.users));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Dashboard Overview</h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="rounded-xl p-1 lg:p-6 border border-gray-800 hover:border-gray-600 transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-400 mb-2">{stat.title}</p>
                <p className="text-lg lg:text-2xl font-bold text-white mb-1">{stat.value}</p>
                {/* <div className={`flex items-center gap-1 text-xs lg:text-sm ${
                  stat.changeType === 'positive' ? 'text-green-400' : 
                  stat.changeType === 'negative' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {stat.changeType === 'positive' && <ArrowUp className="h-3 w-3 lg:h-4 lg:w-4" />}
                  {stat.changeType === 'negative' && <ArrowDown className="h-3 w-3 lg:h-4 lg:w-4" />}
                  <span>{stat.change}</span>
                  <span className="text-gray-500 ml-1 hidden sm:inline">from last month</span>
                </div> */}
              </div>
              <div className="p-2 lg:p-3 rounded-lg bg-indigo-500/10">
                <stat.icon className="h-4 w-4 lg:h-6 lg:w-6 text-indigo-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 hidden sm:block">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* User Growth Chart - Improved */}
        <div className=" rounded-xl p-3 lg:p-6 sm:border sm:border-gray-700 ">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h3 className="text-base lg:text-lg font-semibold text-white">User Growth</h3>
            <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-400">
              <span>Last 9 months</span>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="space-y-3 lg:space-y-4">
            {userGrowthData.map((item, index) => (
              <div key={index} className="flex items-center gap-3 lg:gap-4">
                <span className="text-xs text-gray-400 w-8 lg:w-12">{item.month}</span>
                <div className="flex-1 flex items-center gap-2 lg:gap-3">
                  <div className="flex-1 bg-gray-700 rounded-full h-4 lg:h-6">
                    <div 
                      className="bg-blue-500  h-4 lg:h-6 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${(item.users / maxUsers) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium hidden lg:block">
                        {item.users}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-white w-8 lg:w-12 text-right">
                    {item.users}
                  </span>
                </div>
                <span className={`hidden sm:block  text-xs px-2 py-1 rounded-full ${
                  item.growth >= 20 
                    ? 'bg-green-500/20 text-green-400' 
                    : item.growth >= 15 
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  +{item.growth}%
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 lg:mt-6 pt-4 border-t border-gray-700 gap-2">
            <div className="text-xs lg:text-sm text-gray-400">
              Total growth: <span className="text-green-400 font-medium">+93%</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Users</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Growth %</span>
              </div>
            </div>
          </div>
        </div>

        {/* Device Usage */}
        <div className=" rounded-xl p-4 lg:p-6 sm:border sm:border-gray-700">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h3 className="text-base lg:text-lg font-semibold text-white">Device Usage</h3>
            <span className="text-xs lg:text-sm text-gray-400">This month</span>
          </div>

          <div className="space-y-4 lg:space-y-6">
            {deviceUsage.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={`p-2 lg:p-3 rounded-lg ${device.color} bg-opacity-10`}>
                    <device.icon className={`h-4 w-4 lg:h-5 lg:w-5 ${
                      device.color === 'bg-blue-500' ? 'text-blue-400' :
                      device.color === 'bg-green-500' ? 'text-green-400' :
                      'text-purple-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm lg:text-base font-medium text-white">{device.device}</p>
                    <p className="text-xs text-gray-400">{device.percentage}% of users</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 lg:w-32 bg-gray-700 rounded-full h-2 lg:h-3">
                    <div 
                      className={`h-2 lg:h-3 rounded-full transition-all ${
                        device.color === 'bg-blue-500' ? 'bg-blue-500' :
                        device.color === 'bg-green-500' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs lg:text-sm text-gray-400 w-8 text-right">
                    {device.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 lg:mt-6 pt-4 border-t border-gray-700">
            <div className="text-xs lg:text-sm text-gray-400">
              Mobile dominates with <span className="text-blue-400 font-medium">65%</span> of traffic
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}