import React from 'react';
import { 
  ArrowLeft, TrendingUp, Users, IndianRupee, 
  PieChart, BarChart3, Leaf, Drumstick, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const Analytics = ({ onBack }) => {
    const navigate = useNavigate();
  // Mock Data for Charts
  const monthlyRevenue = [
    { month: 'Sep', amount: 18000, height: '60%' },
    { month: 'Oct', amount: 21000, height: '70%' },
    { month: 'Nov', amount: 20000, height: '65%' },
    { month: 'Dec', amount: 24000, height: '80%' },
    { month: 'Jan', amount: 28000, height: '95%' },
    { month: 'Feb', amount: 24500, height: '85%' }, // Current month (partial)
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex items-center gap-4">
          <button 
            onClick={()=>navigate("/Ven_Dashboard")}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
            <p className="text-gray-500 text-sm">Track your growth and optimize food preparation</p>
          </div>
        </div>

        {/* --- Top Metrics --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <IndianRupee size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp size={12} /> +15%
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Estimated Monthly Revenue</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹31,500</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Users size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp size={12} /> +5
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Active Students</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">45</h3>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-400 p-6 rounded-2xl shadow-md text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <PieChart size={24} />
            </div>
            <p className="text-orange-100 text-sm font-medium">Monthly Retention Rate</p>
            <h3 className="text-3xl font-bold mt-1">92%</h3>
            <p className="text-xs text-orange-100 mt-2">Only 3 students paused this month.</p>
          </div>
        </div>

        {/* --- Charts Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Bar Chart (Simulated with CSS) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="text-blue-500" />
              6-Month Income Summary
            </h2>
            
            <div className="h-64 flex items-end justify-between gap-2 border-b border-gray-100 pb-2">
              {monthlyRevenue.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  {/* Tooltip on Hover */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-gray-600 mb-2">
                    ₹{data.amount/1000}k
                  </span>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[40px] bg-blue-100 group-hover:bg-blue-500 rounded-t-md transition-colors relative"
                    style={{ height: data.height }}
                  ></div>
                  {/* Label */}
                  <span className="text-xs text-gray-500 mt-3 font-medium">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tiffin Demand Trends & Wastage Optimizer */}
          <div className="space-y-6">
            
            {/* Demand Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PieChart className="text-purple-500" />
                Current Demand Trends
              </h2>
              
              <div className="space-y-5">
                {/* Veg vs Non-Veg */}
                <div>
                  <div className="flex justify-between text-sm mb-2 font-semibold">
                    <span className="flex items-center gap-1 text-green-700"><Leaf size={14}/> Pure Veg (60%)</span>
                    <span className="flex items-center gap-1 text-red-700">Non-Veg (40%) <Drumstick size={14}/></span>
                  </div>
                  <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500" style={{ width: '60%' }}></div>
                    <div className="h-full bg-red-500" style={{ width: '40%' }}></div>
                  </div>
                </div>

                {/* Full vs Half */}
                <div>
                  <div className="flex justify-between text-sm mb-2 font-semibold text-gray-700">
                    <span>Full Meal (75%)</span>
                    <span>Half Meal (25%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-orange-500" style={{ width: '75%' }}></div>
                    <div className="h-full bg-orange-300" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insight: Food Wastage Optimizer */}
            <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl mt-1">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Food Preparation Insight</h3>
                  <p className="text-sm text-green-800 mt-2 leading-relaxed">
                    Based on your active subscriptions and marked leaves, prepare food for exactly <strong>38 students</strong> today. <br/><br/>
                    <strong>Breakdown:</strong> 22 Veg Full, 8 Veg Half, 8 Non-Veg Full.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;