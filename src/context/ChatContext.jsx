import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [connection, setConnection] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activePartner, setActivePartner] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    useEffect(() => {
        if (token) {
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl("http://localhost:5262/chatHub", { accessTokenFactory: () => token })
                .withAutomaticReconnect()
                .build();

            setConnection(newConnection);
        } else {
            setConnection(null);
        }
    }, [token]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log("Connected to SignalR");
                    fetchConversations();
                    fetchUnread();
                })
                .catch(err => console.error("SignalR Connection Error: ", err));

            connection.on("ReceiveMessage", (data) => {
                const sender = (data.sender || data.Sender).toLowerCase();
                const receiver = (data.receiver || data.Receiver).toLowerCase();
                const myEmail = user.email.toLowerCase();
                const partner = (sender === myEmail) ? receiver : sender;

                if (partner === activePartner?.toLowerCase()) {
                    setMessages(prev => {
                        // Avoid double messages
                        const exists = prev.some(m => m.id === data.id);
                        if (exists) return prev;
                        return [...prev, data];
                    });
                    
                    if (sender !== user.email) {
                        connection.invoke("MarkAsSeen", sender);
                    }
                }
                
                fetchConversations();
            });

            connection.on("MessageDelivered", (data) => {
                const mid = data.id || data.Id;
                setMessages(prev => prev.map(m => (m.id || m.Id) === mid ? { ...m, status: "Delivered", Status: "Delivered" } : m));
            });

            connection.on("MessagesSeen", (ids) => {
                setMessages(prev => prev.map(m => ids.includes(m.id || m.Id) ? { ...m, status: "Seen", Status: "Seen" } : m));
            });

            connection.on("ReceiveNotification", (data) => {
                const from = (data.from || data.From).toLowerCase();
                if (activePartner?.toLowerCase() !== from) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [from]: (prev[from] || 0) + 1
                    }));
                }
            });

            return () => {
                connection.stop();
            };
        }
    }, [connection, user?.email, activePartner]);

    const fetchConversations = async () => {
        const res = await fetch("http://localhost:5262/api/chat/conversations", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setConversations(data.sort((a, b) => new Date(b.Time) - new Date(a.Time)));
    };

    const fetchUnread = async () => {
        const res = await fetch("http://localhost:5262/api/chat/unread", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const counts = {};
        data.forEach(u => {
            const email = (u.user || u.User).toLowerCase();
            counts[email] = u.count || u.Count;
        });
        setUnreadCounts(counts);
    };

    const loadHistory = useCallback(async (email) => {
        const res = await fetch(`http://localhost:5262/api/chat/history/${email}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setMessages(data);
        if (connection) connection.invoke("MarkAsSeen", email);
        
        setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[email];
            return newCounts;
        });
    }, [token, connection]);

    const sendMessage = async (content) => {
        if (connection && activePartner && content.trim()) {
            await connection.invoke("SendMessage", activePartner, content);
        }
    };

    return (
        <ChatContext.Provider value={{ 
            conversations, messages, activePartner, setActivePartner, 
            unreadCounts, loadHistory, sendMessage 
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
