import React, { useState } from 'react';
import { 
  Check, Trash2, Package, Bell, MessageSquare, CreditCard, CheckCheck 
} from 'lucide-react';

const NotificationsPage = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'order', 
      title: 'Order Confirmed', 
      text: 'Your order from South Indian Express has been confirmed for delivery.', 
      date: '9 Jan', 
      isUnread: true 
    },
    { 
      id: 2, 
      type: 'subscription', 
      title: 'Subscription Renewal Due', 
      text: 'Your monthly subscription with Maharaja Tiffin Service renews in 3 days.', 
      date: '8 Jan', 
      isUnread: false 
    },
    { 
      id: 3, 
      type: 'message', 
      title: 'New Message', 
      text: 'You have a new message from Maharaja Tiffin Service', 
      date: '9 Jan', 
      isUnread: true 
    },
    { 
      id: 4, 
      type: 'payment', 
      title: 'Payment Successful', 
      text: 'Payment of ₹3000 for your monthly subscription has been processed.', 
      date: '1 Jan', 
      isUnread: false 
    },
  ]);

  // --- ACTIONS ---
  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
  };

  const markRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? ({ ...n, isUnread: false }) : n));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // --- FILTER LOGIC ---
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return n.isUnread;
    if (activeTab === 'read') return !n.isUnread;
    return true;
  });

  const unreadCount = notifications.filter(n => n.isUnread).length;
  const readCount = notifications.length - unreadCount;

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with your orders and subscriptions</p>
        </div>
        <button 
          onClick={markAllRead}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm text-sm"
        >
          <CheckCheck size={16} />
          Mark all as read
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard label="Total" count={notifications.length} />
        <StatsCard label="Unread" count={unreadCount} textColor="text-orange-600" />
        <StatsCard label="Read" count={readCount} textColor="text-green-600" />
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 p-1 rounded-xl inline-flex mb-8 w-full md:w-auto">
        {['all', 'unread', 'read'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 md:flex-none px-8 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} ({tab === 'all' ? notifications.length : tab === 'unread' ? unreadCount : readCount})
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4 mb-10">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem 
              key={notification.id}
              data={notification}
              onMarkRead={() => markRead(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
            />
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No notifications found.
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-6 text-lg">Notification Preferences</h3>
        
        <div className="space-y-4 mb-6">
          <PreferenceItem label="Order updates" />
          <PreferenceItem label="Payment reminders" />
          <PreferenceItem label="Promotional offers" />
        </div>

        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          Manage Preferences
        </button>
      </div>
    </>
  );
};

// --- HELPER COMPONENTS ---

const StatsCard = ({ label, count, textColor = "text-orange-600" }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
    <div className={`text-3xl font-bold mb-1 ${textColor}`}>{count}</div>
    <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</div>
  </div>
);

const NotificationItem = ({ data, onMarkRead, onDelete }) => {
  // Config for icons and colors based on type
  const config = {
    order: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    subscription: { icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
    message: { icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
    payment: { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
  };

  const { icon: Icon, color, bg } = config[data.type] || config.order;

  return (
    <div className={`
      relative bg-white border rounded-xl p-5 flex gap-4 transition-all hover:shadow-md
      ${data.isUnread ? 'border-orange-200 bg-orange-50/10' : 'border-gray-200'}
    `}>
      {/* Unread Dot */}
      {data.isUnread && (
        <div className="absolute top-5 right-5 w-2 h-2 bg-orange-500 rounded-full"></div>
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg} ${color}`}>
        <Icon size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 pr-8">
        <h4 className={`text-sm font-bold mb-1 ${data.isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
          {data.title}
        </h4>
        <p className="text-gray-500 text-sm mb-3 leading-relaxed">
          {data.text}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">{data.date}</span>
          
          <div className="flex items-center gap-4">
            {data.isUnread && (
              <button 
                onClick={onMarkRead}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Check size={14} /> Mark read
              </button>
            )}
            <button 
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreferenceItem = ({ label }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600 text-sm font-medium">{label}</span>
    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Enabled
    </span>
  </div>
);

export default NotificationsPage;