import React from 'react';
import { Mail, Calendar, User } from 'lucide-react';

const MessagesCard = ({ messages = [] }) => {
    console.log('🔍 MessagesCard received:', messages, 'Length:', messages?.length);

    if (!messages || messages.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                </div>
                <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No messages available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Mail className="h-5 w-5 text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                    </span>
                </div>
            </div>

            {/* Messages List */}
            <div className="max-h-96 overflow-y-auto">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0"
                    >
                        {/* Message Header */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="font-semibold text-gray-900 text-sm flex-1">
                                {message.subject || 'No Subject'}
                            </h3>
                        </div>

                        {/* Message Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-500">
                            {message.sender && (
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{message.sender}</span>
                                </div>
                            )}
                            {message.date && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{message.date}</span>
                                </div>
                            )}
                        </div>

                        {/* Message Content */}
                        {message.content && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {message.content}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MessagesCard;
