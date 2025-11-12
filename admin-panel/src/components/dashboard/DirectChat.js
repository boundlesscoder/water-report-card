'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const DirectChat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Alexander Pierce',
      message: 'Is this template really for free? That\'s unbelievable!',
      time: '23 Jan 2:00 pm',
      isOwn: false
    },
    {
      id: 2,
      sender: 'Sarah Bullock',
      message: 'You better believe it!',
      time: '23 Jan 2:05 pm',
      isOwn: true
    },
    {
      id: 3,
      sender: 'Alexander Pierce',
      message: 'Working with Water Report Card on a great new app! Wanna join?',
      time: '23 Jan 6:10 pm',
      isOwn: false
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'You',
        message: message.trim(),
        time: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        isOwn: true
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Direct Chat</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            3
          </span>
        </div>
        <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: msg.isOwn ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-lg px-4 py-2 ${
                msg.isOwn 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{msg.message}</p>
              </div>
              <div className={`mt-1 text-xs text-gray-500 ${msg.isOwn ? 'text-right' : 'text-left'}`}>
                {msg.time}
              </div>
            </div>
            {!msg.isOwn && (
              <div className="order-2 ml-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {msg.sender.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type Message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="px-4"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DirectChat; 