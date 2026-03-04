import React, { useState } from 'react';
import { Search, Send } from 'lucide-react';

const MessagesPage = () => {
  // --- STATE ---
  const [selectedChat, setSelectedChat] = useState('maharaja'); // Default active chat
  const [messageInput, setMessageInput] = useState('');
  
  // Dummy Conversation Data
  const [conversations] = useState([
    {
      id: 'maharaja',
      name: 'Maharaja Tiffin Service',
      subtitle: 'North Indian',
      lastMessage: 'Just now',
      avatar: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
      messages: [
        { id: 1, text: "Can I get extra roti with tomorrow's meal?", sender: 'me', time: '9 Jan' },
        { id: 2, text: "Sure! We'll add 2 extra rotis to your meal. No additional charge.", sender: 'them', time: '9 Jan' },
        { id: 3, text: "Thank you so much!", sender: 'me', time: '9 Jan' },
        { id: 4, text: "helooo", sender: 'me', time: 'Just now' },
        { id: 5, text: "hiiiii", sender: 'me', time: 'Just now' },
      ]
    },
    // Add more conversations here if needed for testing UI
  ]);

  const activeConversation = conversations.find(c => c.id === selectedChat);

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Chat with your tiffin service vendors</p>
      </div>

      {/* Main Chat Layout (Grid) */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        
        {/* === LEFT COLUMN: Conversations List === */}
        <div className="lg:w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Conversations</h3>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search vendors..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`flex items-center gap-4 p-4 cursor-pointer transition-colors border-l-4 ${
                  selectedChat === chat.id 
                    ? 'bg-orange-50 border-l-orange-500' 
                    : 'bg-white border-l-transparent hover:bg-gray-50'
                }`}
              >
                <img 
                  src={chat.avatar} 
                  alt={chat.name} 
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className={`font-bold text-sm truncate ${selectedChat === chat.id ? 'text-gray-900' : 'text-gray-700'}`}>
                      {chat.name}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{chat.lastMessage}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {chat.messages[chat.messages.length - 1].text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === RIGHT COLUMN: Chat Window === */}
        <div className="lg:w-2/3 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white">
            <img 
              src={activeConversation.avatar} 
              alt={activeConversation.name} 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-bold text-gray-900">{activeConversation.name}</h3>
              <p className="text-xs text-gray-500">{activeConversation.subtitle}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {activeConversation.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'me' 
                      ? 'bg-[#EA580C] text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
              />
              <button className="bg-[#EA580C] hover:bg-orange-700 text-white p-3 rounded-lg transition-colors shadow-sm shadow-orange-100">
                <Send size={20} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default MessagesPage;