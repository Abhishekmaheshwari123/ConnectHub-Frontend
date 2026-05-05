import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { LogOut, Send, Search, User } from 'lucide-react';

const Dashboard = () => {
    const { logout, user } = useAuth();
    const { 
        conversations, messages, activePartner, setActivePartner, 
        unreadCounts, loadHistory, sendMessage 
    } = useChat();
    const [inputText, setInputText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (activePartner) {
            loadHistory(activePartner);
        }
    }, [activePartner, loadHistory]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText);
            setInputText('');
        }
    };

    const formatDateLabel = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return "Today";
        now.setDate(now.getDate() - 1);
        if (d.toDateString() === now.toDateString()) return "Yesterday";
        return d.toLocaleDateString();
    };

    let lastDate = "";

    return (
        <div className="app-container">
            {/* SIDEBAR */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="avatar">{user?.email[0].toUpperCase()}</div>
                    </div>
                    <div className="actions">
                        <button onClick={logout} className="icon-btn"><LogOut size={20} /></button>
                    </div>
                </div>
                <div className="search-bar">
                    <input 
                        placeholder="Search or start new chat" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchTerm && setActivePartner(searchTerm)}
                    />
                </div>
                <div className="chat-list">
                    {conversations.map(c => (
                        <div 
                            key={c.User} 
                            className={`chat-item ${activePartner === c.User ? 'active' : ''}`}
                            onClick={() => setActivePartner(c.User)}
                        >
                            <div className="avatar small">{c.User[0].toUpperCase()}</div>
                            <div className="chat-item-info">
                                <span className="chat-item-name">{c.User}</span>
                                <span className="chat-item-last-msg">{c.LastMessage || 'No messages yet'}</span>
                            </div>
                            {unreadCounts[c.User] > 0 && (
                                <span className="badge">{unreadCounts[c.User]}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="chat-area">
                {activePartner ? (
                    <>
                        <div className="chat-header">
                            <div className="avatar small">{activePartner[0].toUpperCase()}</div>
                            <div style={{ marginLeft: '15px' }}>
                                <span style={{ fontWeight: 500 }}>{activePartner}</span>
                            </div>
                        </div>
                        <div className="messages-container">
                            {messages.map((m, i) => {
                                const currentDate = formatDateLabel(m.sentAt || m.SentAt);
                                const showDivider = lastDate !== currentDate;
                                lastDate = currentDate;
                                
                                return (
                                    <React.Fragment key={m.id || i}>
                                        {showDivider && <div className="date-divider">{currentDate}</div>}
                                        <div className={`message ${ (m.sender || m.Sender) === user.email ? 'sent' : 'received'}`}>
                                            <div>{m.message || m.content || m.Content}</div>
                                            <div className="message-footer">
                                                <span>{new Date(m.sentAt || m.SentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {(m.sender || m.Sender) === user.email && (
                                                    <span className={`tick ${(m.status || m.Status) === 'Seen' ? 'seen' : ''}`}>
                                                        {(m.status || m.Status) === 'Sent' ? '✓' : '✓✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                        <form className="input-container" onSubmit={handleSend}>
                            <input 
                                placeholder="Type a message" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <button type="submit" className="send-btn"><Send size={24} color="#54656f" /></button>
                        </form>
                    </>
                ) : (
                    <div className="empty-chat">
                        <div className="empty-chat-content">
                            <h2>ConnectHub</h2>
                            <p>Select a chat to start messaging</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;
