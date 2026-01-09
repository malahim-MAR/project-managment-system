import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    MessageCircle,
    X,
    Send,
    AtSign,
    Hash,
    Film,
    FileText,
    Video,
    Folder,
    ChevronDown,
    User
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChatSidebar = () => {
    const {
        messages,
        users,
        projects,
        videos,
        scripts,
        postProductions,
        isOpen,
        loading,
        unreadCount,
        sendMessage,
        toggleChat,
        closeChat
    } = useChat();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [inputValue, setInputValue] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [showReferences, setShowReferences] = useState(false);
    const [referenceType, setReferenceType] = useState(null);
    const [mentionFilter, setMentionFilter] = useState('');
    const [referenceFilter, setReferenceFilter] = useState('');
    const [selectedMentions, setSelectedMentions] = useState([]);
    const [selectedReferences, setSelectedReferences] = useState([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [sending, setSending] = useState(false);

    const chatSidebarRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const inputAreaRef = useRef(null);
    const mentionDropdownRef = useRef(null);
    const referenceDropdownRef = useRef(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current && isOpen) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target)) {
                setShowMentions(false);
            }
            if (referenceDropdownRef.current && !referenceDropdownRef.current.contains(e.target)) {
                setShowReferences(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle mobile keyboard visibility - scroll input into view
    useEffect(() => {
        if (!isOpen) return;

        const handleFocus = () => {
            // Small delay to let the keyboard appear
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 300);
        };

        const inputElement = inputRef.current;
        if (inputElement) {
            inputElement.addEventListener('focus', handleFocus);
        }

        // Handle visual viewport resize (when keyboard opens on mobile)
        const handleResize = () => {
            if (inputRef.current && document.activeElement === inputRef.current) {
                inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            if (inputElement) {
                inputElement.removeEventListener('focus', handleFocus);
            }
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
        };
    }, [isOpen]);

    // Handle input change and detect @ or # symbols
    const handleInputChange = (e) => {
        const value = e.target.value;
        const curPos = e.target.selectionStart;
        setInputValue(value);
        setCursorPosition(curPos);

        // Check for @ symbol (mentions)
        const textBeforeCursor = value.substring(0, curPos);
        const atMatch = textBeforeCursor.match(/@(\w*)$/);
        if (atMatch) {
            setMentionFilter(atMatch[1].toLowerCase());
            setShowMentions(true);
            setShowReferences(false);
        } else {
            setShowMentions(false);
        }

        // Check for # symbol (references)
        const hashMatch = textBeforeCursor.match(/#(\w*)$/);
        if (hashMatch) {
            setReferenceFilter(hashMatch[1].toLowerCase());
            setShowReferences(true);
            setShowMentions(false);
            setReferenceType(null);
        } else if (!showReferences || !referenceType) {
            setShowReferences(false);
        }
    };

    // Filter users for mentions
    const filteredUsers = users.filter(u =>
        u.id !== user?.id &&
        u.name.toLowerCase().includes(mentionFilter) &&
        !selectedMentions.find(m => m.userId === u.id)
    );

    // Get reference items based on type
    const getReferenceItems = () => {
        switch (referenceType) {
            case 'project':
                return projects.filter(p => p.name?.toLowerCase().includes(referenceFilter));
            case 'video':
                return videos.filter(v => v.name?.toLowerCase().includes(referenceFilter));
            case 'script':
                return scripts.filter(s => s.name?.toLowerCase().includes(referenceFilter));
            case 'postproduction':
                return postProductions.filter(pp => pp.name?.toLowerCase().includes(referenceFilter));
            default:
                return [];
        }
    };

    // Select a user mention
    const selectMention = (selectedUser) => {
        const textBeforeCursor = inputValue.substring(0, cursorPosition);
        const textAfterCursor = inputValue.substring(cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        const newText = textBeforeCursor.substring(0, atIndex) + `@${selectedUser.name} ` + textAfterCursor;

        setInputValue(newText);
        setSelectedMentions([...selectedMentions, { userId: selectedUser.id, userName: selectedUser.name }]);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    // Select reference type
    const selectReferenceType = (type) => {
        setReferenceType(type);
        setReferenceFilter('');
    };

    // Select a reference item
    const selectReference = (item) => {
        const textBeforeCursor = inputValue.substring(0, cursorPosition);
        const textAfterCursor = inputValue.substring(cursorPosition);
        const hashIndex = textBeforeCursor.lastIndexOf('#');

        const typeLabel = referenceType === 'postproduction' ? 'post-production' : referenceType;
        const newText = textBeforeCursor.substring(0, hashIndex) + `#${typeLabel}:${item.name} ` + textAfterCursor;

        setInputValue(newText);
        setSelectedReferences([...selectedReferences, { type: referenceType, id: item.id, name: item.name }]);
        setShowReferences(false);
        setReferenceType(null);
        inputRef.current?.focus();
    };

    // Handle send message
    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;

        setSending(true);
        const success = await sendMessage(inputValue, selectedMentions, selectedReferences);
        if (success) {
            setInputValue('');
            setSelectedMentions([]);
            setSelectedReferences([]);
        }
        setSending(false);
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Navigate to reference
    const handleReferenceClick = (ref) => {
        switch (ref.type) {
            case 'project':
                navigate(`/projects/${ref.id}`);
                break;
            case 'video':
                navigate(`/videos/${ref.id}`);
                break;
            case 'script':
                navigate(`/scripts`);
                break;
            case 'postproduction':
                navigate(`/post-productions/${ref.id}`);
                break;
            default:
                break;
        }
        closeChat();
    };

    // Format message time
    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    // Parse message content to highlight mentions and references
    const parseMessageContent = (content) => {
        // Pattern for @mentions and #references
        const mentionPattern = /@(\w+(?:\s+\w+)?)/g;
        const referencePattern = /#(project|video|script|post-production):([^\s]+(?:\s+[^\s#@]+)*)/g;

        const parts = [];
        let lastIndex = 0;
        let match;

        // Combined regex for sequential parsing
        const combinedPattern = /(@\w+(?:\s+\w+)?|#(project|video|script|post-production):[^\s]+(?:\s+[^\s#@]+)*)/g;

        while ((match = combinedPattern.exec(content)) !== null) {
            // Add text before match
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
            }

            const fullMatch = match[0];
            if (fullMatch.startsWith('@')) {
                parts.push({ type: 'mention', content: fullMatch });
            } else if (fullMatch.startsWith('#')) {
                parts.push({ type: 'reference', content: fullMatch });
            }

            lastIndex = match.index + fullMatch.length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            parts.push({ type: 'text', content: content.substring(lastIndex) });
        }

        return parts.length > 0 ? parts : [{ type: 'text', content }];
    };

    const referenceTypes = [
        { type: 'project', icon: Folder, label: 'Project', color: '#3b82f6' },
        { type: 'video', icon: Film, label: 'Video', color: '#8b5cf6' },
        { type: 'script', icon: FileText, label: 'Script', color: '#10b981' },
        { type: 'postproduction', icon: Video, label: 'Post-Production', color: '#f59e0b' }
    ];

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                className="chat-toggle-btn"
                onClick={toggleChat}
                title="Team Chat"
            >
                <MessageCircle size={22} />
                {unreadCount > 0 && (
                    <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {/* Chat Sidebar */}
            <div ref={chatSidebarRef} className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-title">
                        <MessageCircle size={22} />
                        <span>Team Chat</span>
                    </div>
                    <button className="chat-close-btn" onClick={closeChat}>
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="chat-messages">
                    {loading ? (
                        <div className="chat-loading">
                            <div className="chat-loading-spinner"></div>
                            <span>Loading messages...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="chat-empty">
                            <MessageCircle size={48} />
                            <h4>No messages yet</h4>
                            <p>Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.senderId === user?.id ? 'own' : ''}`}
                            >
                                <div className="chat-message-avatar">
                                    <User size={16} />
                                </div>
                                <div className="chat-message-content">
                                    <div className="chat-message-header">
                                        <span className="chat-message-sender">{msg.senderName}</span>
                                        <span className="chat-message-time">{formatTime(msg.createdAt)}</span>
                                    </div>
                                    <div className="chat-message-body">
                                        {parseMessageContent(msg.content).map((part, idx) => {
                                            if (part.type === 'mention') {
                                                return (
                                                    <span key={idx} className="chat-mention">
                                                        {part.content}
                                                    </span>
                                                );
                                            } else if (part.type === 'reference') {
                                                const refMatch = part.content.match(/#(project|video|script|post-production):(.+)/);
                                                if (refMatch) {
                                                    const refType = refMatch[1] === 'post-production' ? 'postproduction' : refMatch[1];
                                                    const refName = refMatch[2];
                                                    const ref = msg.references?.find(r => r.name === refName);
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className={`chat-reference chat-ref-${refType}`}
                                                            onClick={() => ref && handleReferenceClick(ref)}
                                                            style={{ cursor: ref ? 'pointer' : 'default' }}
                                                        >
                                                            {part.content}
                                                        </span>
                                                    );
                                                }
                                            }
                                            return <span key={idx}>{part.content}</span>;
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div ref={inputAreaRef} className="chat-input-area">
                    {/* Quick action buttons */}
                    <div className="chat-actions">
                        <button
                            className="chat-action-btn"
                            onClick={() => {
                                setInputValue(inputValue + '@');
                                inputRef.current?.focus();
                                setShowMentions(true);
                            }}
                            title="Mention someone"
                        >
                            <AtSign size={16} />
                        </button>
                        <button
                            className="chat-action-btn"
                            onClick={() => {
                                setInputValue(inputValue + '#');
                                inputRef.current?.focus();
                                setShowReferences(true);
                                setReferenceType(null);
                            }}
                            title="Reference item"
                        >
                            <Hash size={16} />
                        </button>
                    </div>

                    <div className="chat-input-wrapper">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            rows={1}
                        />
                        <button
                            className="chat-send-btn"
                            onClick={handleSend}
                            disabled={!inputValue.trim() || sending}
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    {/* Mentions Dropdown */}
                    {showMentions && filteredUsers.length > 0 && (
                        <div ref={mentionDropdownRef} className="chat-dropdown chat-mentions-dropdown">
                            <div className="chat-dropdown-header">
                                <AtSign size={14} />
                                <span>Mention a team member</span>
                            </div>
                            <div className="chat-dropdown-list">
                                {filteredUsers.slice(0, 5).map(u => (
                                    <button
                                        key={u.id}
                                        className="chat-dropdown-item"
                                        onClick={() => selectMention(u)}
                                    >
                                        <div className="chat-dropdown-avatar">
                                            <User size={14} />
                                        </div>
                                        <span>{u.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* References Dropdown */}
                    {showReferences && (
                        <div ref={referenceDropdownRef} className="chat-dropdown chat-references-dropdown">
                            {!referenceType ? (
                                <>
                                    <div className="chat-dropdown-header">
                                        <Hash size={14} />
                                        <span>Reference a...</span>
                                    </div>
                                    <div className="chat-dropdown-list">
                                        {referenceTypes.map(rt => (
                                            <button
                                                key={rt.type}
                                                className="chat-dropdown-item"
                                                onClick={() => selectReferenceType(rt.type)}
                                            >
                                                <rt.icon size={16} style={{ color: rt.color }} />
                                                <span>{rt.label}</span>
                                                <ChevronDown size={14} className="chat-dropdown-arrow" />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="chat-dropdown-header">
                                        <button
                                            className="chat-dropdown-back"
                                            onClick={() => setReferenceType(null)}
                                        >
                                            ←
                                        </button>
                                        <span>Select {referenceType}</span>
                                    </div>
                                    <input
                                        type="text"
                                        className="chat-dropdown-search"
                                        placeholder={`Search ${referenceType}s...`}
                                        value={referenceFilter}
                                        onChange={(e) => setReferenceFilter(e.target.value.toLowerCase())}
                                        autoFocus
                                    />
                                    <div className="chat-dropdown-list">
                                        {getReferenceItems().slice(0, 5).map(item => (
                                            <button
                                                key={item.id}
                                                className="chat-dropdown-item"
                                                onClick={() => selectReference(item)}
                                            >
                                                {referenceTypes.find(rt => rt.type === referenceType)?.icon &&
                                                    React.createElement(
                                                        referenceTypes.find(rt => rt.type === referenceType).icon,
                                                        { size: 14, style: { color: referenceTypes.find(rt => rt.type === referenceType).color } }
                                                    )
                                                }
                                                <span>{item.name}</span>
                                            </button>
                                        ))}
                                        {getReferenceItems().length === 0 && (
                                            <div className="chat-dropdown-empty">
                                                No {referenceType}s found
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && <div className="chat-overlay" onClick={closeChat} />}
        </>
    );
};

export default ChatSidebar;
