import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, Megaphone, Calendar, Trash2, Edit2, Send, Save, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MenuManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('menu'); 

  // --- DYNAMIC STATES ---
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isEditing, setIsEditing] = useState(false);
  const [tempMenu, setTempMenu] = useState({ lunch: "", dinner: "" });

  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [announcementType, setAnnouncementType] = useState("General");

  // --- 1. FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/vendor/communications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Provide an empty fallback if they haven't set a menu yet
          setWeeklyMenu(data.weeklyMenu || {
            Monday: { lunch: "", dinner: "" }, Tuesday: { lunch: "", dinner: "" },
            Wednesday: { lunch: "", dinner: "" }, Thursday: { lunch: "", dinner: "" },
            Friday: { lunch: "", dinner: "" }, Saturday: { lunch: "", dinner: "" },
            Sunday: { lunch: "", dinner: "" }
          });
          setAnnouncements(data.announcements || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. SAVE MENU TO DATABASE ---
  const handleSaveMenu = async () => {
    const updatedWeeklyMenu = { ...weeklyMenu, [selectedDay]: tempMenu };
    setWeeklyMenu(updatedWeeklyMenu); // Optimistic UI update
    setIsEditing(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/update-menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ weeklyMenu: updatedWeeklyMenu })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to save menu.');
        setIsEditing(true);
        return;
      }
      if (data.weeklyMenu) {
        setWeeklyMenu(data.weeklyMenu);
      }
      alert("Menu saved successfully!");
    } catch (error) {
      alert("Failed to save menu.");
      setIsEditing(true);
    }
  };

  // --- 3. POST ANNOUNCEMENT TO DATABASE ---
  const handlePostAnnouncement = async () => {
    if (!newAnnouncement) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/post-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          type: announcementType,
          text: newAnnouncement,
          date: new Date().toLocaleDateString('en-IN')
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements); // Update UI with DB data
        setNewAnnouncement("");
        alert("Announcement Broadcasted to All Students!");
      }
    } catch (error) {
      alert("Failed to post announcement.");
    }
  };

  const handleEditClick = () => {
    setTempMenu(weeklyMenu[selectedDay]);
    setIsEditing(true);
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/Ven_Dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
            <p className="text-gray-500 text-sm">Manage Menus & Broadcast Announcements</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl w-fit">
          <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <ChefHat size={18} /> Weekly Menu
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'announcements' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <Megaphone size={18} /> Announcements
          </button>
        </div>

        {/* TAB 1: MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Day Selector Sidebar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-fit">
              <h3 className="font-bold text-gray-900 mb-4 px-2">Select Day</h3>
              <div className="space-y-1">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <button key={day} onClick={() => { setSelectedDay(day); setIsEditing(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${selectedDay === day ? 'bg-orange-600 text-white shadow-md shadow-orange-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Editor Area */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="text-orange-500" /> {selectedDay}'s Menu
                </h2>
                {!isEditing ? (
                  <button onClick={handleEditClick} className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors">
                    <Edit2 size={16} /> Edit Menu
                  </button>
                ) : (
                  <button onClick={handleSaveMenu} className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                    <Save size={16} /> Save Changes
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lunch Items</label>
                  {isEditing ? (
                    <textarea value={tempMenu.lunch} onChange={(e) => setTempMenu({...tempMenu, lunch: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-gray-700" rows="3" />
                  ) : (
                    <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl text-gray-800 font-medium whitespace-pre-wrap">
                      {weeklyMenu[selectedDay]?.lunch || "No menu set for Lunch."}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Dinner Items</label>
                  {isEditing ? (
                    <textarea value={tempMenu.dinner} onChange={(e) => setTempMenu({...tempMenu, dinner: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-gray-700" rows="3" />
                  ) : (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-gray-800 font-medium whitespace-pre-wrap">
                      {weeklyMenu[selectedDay]?.dinner || "No menu set for Dinner."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Megaphone className="text-blue-500" /> Post New Announcement
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Announcement Type</label>
                    <select value={announcementType} onChange={(e) => setAnnouncementType(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500">
                      <option>General</option><option>Holiday / Leave</option><option>Price Update</option><option>Service Change</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <textarea value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} placeholder="e.g., We will be closed this Friday..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 h-32 resize-none" />
                  </div>
                  <button onClick={handlePostAnnouncement} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                    <Send size={18} /> Post Announcement
                  </button>
                </div>
              </div>
            </div>

            {/* Right: History */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Posts</h3>
              <div className="space-y-4">
                {announcements.map((item) => (
                  <div key={item._id || item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${item.type === 'Holiday' ? 'bg-red-100 text-red-700' : item.type === 'Price Update' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-400">{item.date}</span>
                    </div>
                    <p className="text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-wrap">{item.text}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-gray-500 italic">No announcements posted yet.</p>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MenuManagement;
