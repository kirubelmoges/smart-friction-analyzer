import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, TrendingUp, Zap, 
  Box, Database, RefreshCw, Cpu, 
  Gauge, Target, Award, Flame,
  AlertCircle, Eye,  
  CheckCircle, Wifi, WifiOff, 
  TrendingDown, TrendingUp as TrendingUpIcon, Minus
} from 'lucide-react';

const Dashboard = () => {
  // ============================================
  // STATE VARIABLES
  // ============================================
  const [measurements, setMeasurements] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  
  // INSTANCE-SPECIFIC STATE (last 3 measurements only)
  const [instantAvgMu, setInstantAvgMu] = useState(0);
  const [instantCount, setInstantCount] = useState(0);
  const [trendDirection, setTrendDirection] = useState('stable');
  const [latestInstantMu, setLatestInstantMu] = useState(0);
  const [latestInstantAngle, setLatestInstantAngle] = useState(0);
  
  // UI State
  const [newMeasurement, setNewMeasurement] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://static-friction-analyzer.onrender.com/api';
  const previousLengthRef = useRef(0);
  const notificationTimeoutRef = useRef(null);
  const angleChartDataRef = useRef([]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // ============================================
  // LOADING TIPS ANIMATION
  // ============================================
  const loadingTips = [
    "🎮 Calibrating sensors...",
    "📡 Connecting to Django backend...",
    "🔌 Check Arduino USB connection",
    "📐 Place the inclined plane on a flat surface",
    "🧹 Ensure the board surface is clean and dry",
    "📦 Place the test block at the TOP of the board",
    "🐌 Remember: Tilt SLOWLY (1° per second)",
    "👀 Watch the block closely for movement",
    "🛑 STOP immediately when block slides",
    "📊 Your measurement will appear automatically",
    "🔄 Reset to flat after each test",
    "✅ Ready! Your system is online"
  ];

  const [visibleTips, setVisibleTips] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // ============================================
  // CALCULATE INSTANT STATS (LAST 3 MEASUREMENTS ONLY)
  // ============================================
  const calculateInstantStats = useCallback((data) => {
    if (!data || data.length === 0) {
      setInstantAvgMu(0);
      setInstantCount(0);
      setLatestInstantMu(0);
      setLatestInstantAngle(0);
      setTrendDirection('stable');
      return;
    }
    
    const sortedData = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const lastThree = sortedData.slice(0, 3);
    const validMu = lastThree.filter(m => m.coefficient_friction > 0 && m.coefficient_friction < 2);
    
    if (lastThree.length > 0) {
      setLatestInstantMu(lastThree[0].coefficient_friction || 0);
      setLatestInstantAngle(lastThree[0].critical_angle || 0);
    }
    
    if (validMu.length > 0) {
      const sum = validMu.reduce((acc, m) => acc + m.coefficient_friction, 0);
      const avg = sum / validMu.length;
      setInstantAvgMu(avg);
      setInstantCount(validMu.length);
      
      if (validMu.length >= 2) {
        const prevAvg = validMu.slice(0, 2).reduce((acc, m) => acc + m.coefficient_friction, 0) / 2;
        if (avg > prevAvg + 0.03) setTrendDirection('increasing');
        else if (avg < prevAvg - 0.03) setTrendDirection('decreasing');
        else setTrendDirection('stable');
      }
    }
  }, []);

  // ============================================
  // FETCH MEASUREMENTS
  // ============================================
  const fetchMeasurements = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/measurements/`);
      let data = [];
      
      if (response.data && Array.isArray(response.data.results)) {
        data = response.data.results;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      const sortedData = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (previousLengthRef.current > 0 && sortedData.length > previousLengthRef.current) {
        const newest = sortedData[0];
        setNewMeasurement(newest);
        setShowNotification(true);
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = setTimeout(() => setShowNotification(false), 4000);
      }
      
      setMeasurements(sortedData);
      previousLengthRef.current = sortedData.length;
      calculateInstantStats(sortedData);
      setIsConnected(true);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching measurements:', err);
      setIsConnected(false);
      setError('Cannot connect to backend. Make sure Django server is running.');
      setLoading(false);
    }
  }, [calculateInstantStats]);

  // ============================================
  // FETCH LIVE DATA FOR CHART
  // ============================================
  const fetchLiveData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/livedata/`);
      let data = [];
      if (response.data && Array.isArray(response.data.results)) {
        data = response.data.results;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      if (data.length > 0) {
        const formattedData = data.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          angle: item.current_angle || 0
        })).reverse();
        
        setLiveData(prev => {
          const combined = [...formattedData, ...prev];
          const unique = combined.filter((item, index, self) => 
            index === self.findIndex(t => t.time === item.time)
          );
          return unique.slice(0, 30);
        });
      }
    } catch (err) {
      console.log('Live data not available:', err);
    }
  }, [API_BASE_URL]);

  // ============================================
  // FETCH LATEST ANGLE - REAL TIME
  // ============================================
  const fetchLatestAngle = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/latest-angle/`);
      const newAngle = response.data.current_angle || 0;
      setCurrentAngle(newAngle);
      
      // Also add to live data chart
      setLiveData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          angle: newAngle
        };
        const updated = [newPoint, ...prev].slice(0, 30);
        return updated;
      });
      
    } catch (err) {
      console.log('Angle data not available:', err);
    }
  }, [API_BASE_URL]);

  // ============================================
  // FETCH STATISTICS
  // ============================================
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/`);
      setStatistics(response.data);
    } catch (err) {
      console.log('Statistics not available');
    }
  }, [API_BASE_URL]);

  // ============================================
  // ANIMATE LOADING TIPS
  // ============================================
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        if (currentTipIndex < loadingTips.length) {
          setVisibleTips(prev => [...prev, loadingTips[currentTipIndex]]);
          setCurrentTipIndex(prev => prev + 1);
        } else {
          clearInterval(interval);
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading, currentTipIndex]);

  // ============================================
  // INITIAL DATA FETCH AND POLLING
  // ============================================
  useEffect(() => {
    fetchMeasurements();
    fetchStatistics();
    fetchLiveData();
    fetchLatestAngle();
    
    // Poll for new measurements every 2 seconds
    const measurementInterval = setInterval(() => {
      fetchMeasurements();
      fetchStatistics();
      setLastUpdate(new Date());
    }, 2000);
    
    // Poll for live angle every 500ms (real-time)
    const angleInterval = setInterval(() => {
      fetchLatestAngle();
    }, 500);
    
    // Poll for live data chart every 2 seconds
    const liveDataInterval = setInterval(() => {
      fetchLiveData();
    }, 2000);
    
    return () => {
      clearInterval(measurementInterval);
      clearInterval(angleInterval);
      clearInterval(liveDataInterval);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, [fetchMeasurements, fetchLiveData, fetchLatestAngle, fetchStatistics]);

  // ============================================
  // MANUAL REFRESH
  // ============================================
  const handleManualRefresh = () => {
    fetchMeasurements();
    fetchStatistics();
    fetchLiveData();
    fetchLatestAngle();
    setLastUpdate(new Date());
    setRefreshTrigger(prev => prev + 1);
  };

  // ============================================
  // PREPARE CHART DATA
  // ============================================
  const chartData = liveData.slice(0, 20).reverse();

  // Prepare pie chart data
  const frictionRanges = [
    { name: 'Low (0-0.3)', value: measurements.filter(m => m.coefficient_friction < 0.3 && m.coefficient_friction > 0).length },
    { name: 'Medium (0.3-0.6)', value: measurements.filter(m => m.coefficient_friction >= 0.3 && m.coefficient_friction < 0.6).length },
    { name: 'High (0.6-0.9)', value: measurements.filter(m => m.coefficient_friction >= 0.6 && m.coefficient_friction < 0.9).length },
    { name: 'Very High (>0.9)', value: measurements.filter(m => m.coefficient_friction >= 0.9).length },
  ];

  const getAngleColor = (angle) => {
    if (angle < 15) return 'text-green-400';
    if (angle < 30) return 'text-yellow-400';
    if (angle < 45) return 'text-orange-400';
    return 'text-red-400';
  };

  const TrendIcon = () => {
    if (trendDirection === 'increasing') return <TrendingUpIcon className="w-5 h-5 text-green-400" />;
    if (trendDirection === 'decreasing') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  // ============================================
  // LOADING SCREEN
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-purple-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          
          <p className="text-gray-300 text-xl font-bold mt-4">Initializing Measurement System...</p>
          <p className="text-purple-400 text-sm mt-2 animate-pulse">Connecting to Django backend</p>
          
          <div className="mt-8 h-80 overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 space-y-2">
              {visibleTips.map((tip, index) => (
                <p key={index} className="text-gray-300 text-sm bg-gray-800/50 rounded-lg px-4 py-2 border-l-4 border-purple-500">
                  {tip}
                </p>
              ))}
            </div>
          </div>
          
          <div className="mt-6 w-full bg-gray-700 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300" style={{ width: `${(currentTipIndex / loadingTips.length) * 100}%` }}></div>
          </div>
          
          <p className="text-gray-500 text-xs mt-4">Make sure Arduino (Uno) is connected via USB</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR SCREEN
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center border border-red-500/20">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN DASHBOARD RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-gray-900/50 via-purple-900/50 to-gray-900/50 backdrop-blur-sm border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                  Static Friction Analyzer
                </h1>
                <p className="text-gray-400 text-sm">Real-Time Friction Measurement System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 border ${isConnected ? 'border-green-500/20' : 'border-red-500/20'}`}>
                {isConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-4 py-2 border border-purple-500/20">
                <RefreshCw className="w-4 h-4 text-purple-400 hover:text-purple-300 cursor-pointer transition-all" onClick={handleManualRefresh} />
                <span className="text-gray-300 text-sm">Updated: {lastUpdate.toLocaleTimeString()}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Measurement Notification */}
      {showNotification && newMeasurement && (
        <div className="fixed top-24 right-6 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-2xl p-4 border border-green-400">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-white" />
              <div>
                <p className="text-white font-bold">New Measurement!</p>
                <p className="text-white text-sm">
                  μ = {newMeasurement.coefficient_friction?.toFixed(4)} at {newMeasurement.critical_angle?.toFixed(1)}°
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8 relative z-10">
        
        {/* MAIN STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* CURRENT ANGLE - REAL-TIME */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Current Angle
                  </p>
                  <p className={`text-5xl font-bold ${getAngleColor(currentAngle)} transition-all duration-300`}>
                    {currentAngle.toFixed(1)}°
                  </p>
                </div>
                <Gauge className="w-12 h-12 text-purple-400 opacity-80" />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>0°</span>
                  <span>Horizontal</span>
                  <span>90°</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full transition-all duration-300" style={{ width: `${(currentAngle / 90) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* LATEST μ CARD */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Latest Friction Coefficient (μ)
                  </p>
                  <p className="text-5xl font-bold text-blue-400">
                    {latestInstantMu > 0 ? latestInstantMu.toFixed(4) : '---'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {latestInstantAngle > 0 ? `at ${latestInstantAngle.toFixed(1)}° tilt` : 'Awaiting test'}
                  </p>
                </div>
                <Target className="w-12 h-12 text-blue-400 opacity-80" />
              </div>
            </div>
          </div>

          {/* INSTANT AVERAGE CARD */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Average μ (Last {instantCount} Tests)
                  </p>
                  <p className="text-5xl font-bold text-green-400">
                    {instantAvgMu > 0 ? instantAvgMu.toFixed(4) : '---'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                    Trend: <TrendIcon /> {trendDirection}
                  </p>
                </div>
                <Award className="w-12 h-12 text-green-400 opacity-80" />
              </div>
            </div>
          </div>

          {/* TOTAL TESTS CARD */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <Database className="w-3 h-3" /> Total Measurements
                  </p>
                  <p className="text-5xl font-bold text-orange-400">{measurements.length}</p>
                  <p className="text-gray-500 text-sm mt-2">Tests performed</p>
                </div>
                <Box className="w-12 h-12 text-orange-400 opacity-80" />
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* REAL-TIME ANGLE TRACKING CHART - SMOOTH LINE CHART */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Real-Time Angle Tracking
            </h2>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9ca3af" domain={[0, 90]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="angle" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorGradient)" dot={false} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Waiting for sensor data...</p>
                    <p className="text-xs mt-2">Connect Arduino and run serial reader</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-center text-gray-500 text-xs">
              {currentAngle > 0 && <span>Current: {currentAngle.toFixed(1)}° | Live updates every 0.5s</span>}
            </div>
          </div>

          {/* FRICTION DISTRIBUTION PIE CHART */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-pink-400" />
              Friction Distribution
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={frictionRanges.filter(r => r.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {frictionRanges.filter(r => r.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {measurements.filter(m => m.coefficient_friction > 0).length === 0 && (
              <p className="text-center text-gray-500 text-sm mt-4">No data yet. Perform a test to see distribution.</p>
            )}
          </div>
        </div>

        {/* MEASUREMENTS TABLE */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 px-6 py-4 border-b border-purple-500/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Measurement History (Last {measurements.length} Tests)
            </h2>
          </div>
          
          {measurements.filter(m => m.coefficient_friction > 0).length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 sticky top-0">
                  <tr className="text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Critical Angle</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Coefficient (μ)</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {measurements.filter(m => m.coefficient_friction > 0).map((measurement) => {
                    let category = '';
                    let categoryColor = '';
                    if (measurement.coefficient_friction < 0.3) { category = 'Low'; categoryColor = 'text-blue-400'; }
                    else if (measurement.coefficient_friction < 0.6) { category = 'Medium'; categoryColor = 'text-yellow-400'; }
                    else if (measurement.coefficient_friction < 0.9) { category = 'High'; categoryColor = 'text-orange-400'; }
                    else { category = 'Very High'; categoryColor = 'text-red-400'; }
                    
                    return (
                      <tr key={measurement.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {new Date(measurement.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="font-semibold text-purple-400">{measurement.critical_angle?.toFixed(2)}°</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300">
                            μ = {measurement.coefficient_friction?.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={categoryColor}>{category}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-600 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Measurements Yet</h3>
              <p className="text-gray-500">Start tilting your inclined plane to collect friction data</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Cpu className="w-4 h-4" />
            Real-Time Data | Last {instantCount} tests averaged
            <Activity className="w-4 h-4" />
          </p>
          <p className="mt-1">New measurements appear instantly | Angle updates every 500ms | Average updates after each test</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;