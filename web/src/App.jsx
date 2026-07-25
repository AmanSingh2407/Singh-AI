import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './index.css'

export default function App() {
  const [messages, setMessages] = useState([])
  const [inputPrompt, setInputPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('Singh AI 3')
  const [providerStatus, setProviderStatus] = useState('Singh AI Connected')
  const [activeTab, setActiveTab] = useState('chat')
  const [libraryData, setLibraryData] = useState(null)
  const [projectsData, setProjectsData] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeProjectChat, setActiveProjectChat] = useState(null)
  
  // Sidebar & Profile State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userProfile, setUserProfile] = useState({ name: 'Aman', plan: 'Go', avatar: '' })
  const [editName, setEditName] = useState('Aman')
  const [editPlan, setEditPlan] = useState('Go')
  const [editAvatar, setEditAvatar] = useState('')

  // Library State
  const [libCategory, setLibCategory] = useState('All')
  const [libSearch, setLibSearch] = useState('')
  const [libViewMode, setLibViewMode] = useState('list')
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)

  // Projects State & Modal
  const [projCategory, setProjCategory] = useState('All')
  const [projSearch, setProjSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjName, setNewProjName] = useState('')
  const [newProjDesc, setNewProjDesc] = useState('')
  const [newChatTitle, setNewChatTitle] = useState('')
  const [showNewChatInput, setShowNewChatInput] = useState(false)

  // Recents State & Controls
  const [chatsData, setChatsData] = useState(null)
  const [isRecentsCollapsed, setIsRecentsCollapsed] = useState(false)
  const [activeMenuChatId, setActiveMenuChatId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Scheduled Tasks State
  const [scheduledData, setScheduledData] = useState(null)
  const [schedFilter, setSchedFilter] = useState('Active')
  const [schedPrompt, setSchedPrompt] = useState('')

  const chatEndRef = useRef(null)

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.provider) setProviderStatus(data.provider.replace('Grok', 'Singh AI'))
      })
      .catch(() => setProviderStatus('Singh AI Connected'))
    
    // Initial fetch for dynamic data
    fetch('/api/library')
      .then((r) => r.json())
      .then(setLibraryData)
      .catch(() => {})

    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjectsData)
      .catch(() => {})

    fetch('/api/chats')
      .then((r) => r.json())
      .then(setChatsData)
      .catch(() => {})

    fetch('/api/scheduled')
      .then((r) => r.json())
      .then(setScheduledData)
      .catch(() => {})

    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.name) {
          setUserProfile(data)
          setEditName(data.name)
          setEditPlan(data.plan || 'Go')
          setEditAvatar(data.avatar || '')
        }
      })
      .catch(() => {})
  }, [])

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, plan: editPlan, avatar: editAvatar }),
      })
      const data = await res.json()
      if (data.profile) {
        setUserProfile(data.profile)
      }
      setShowProfileModal(false)
    } catch (err) {
      alert('Error updating profile: ' + err.message)
    }
  }

  const handleCreateScheduledTask = async (promptText) => {
    const text = (promptText || schedPrompt).trim()
    if (!text) return
    try {
      const res = await fetch('/api/scheduled/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, schedule: 'Every 1 hour' }),
      })
      const data = await res.json()
      if (data.tasks) setScheduledData({ tasks: data.tasks })
      setSchedPrompt('')
    } catch (err) {
      alert('Error scheduling task: ' + err.message)
    }
  }

  const handleToggleScheduledTask = async (id) => {
    try {
      const res = await fetch('/api/scheduled/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.tasks) setScheduledData({ tasks: data.tasks })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteScheduledTask = async (id) => {
    try {
      const res = await fetch('/api/scheduled/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.tasks) setScheduledData({ tasks: data.tasks })
    } catch (err) {
      console.error(err)
    }
  }

  const handleRenameRecentChat = async (id, title) => {
    try {
      const res = await fetch('/api/chats/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      })
      const data = await res.json()
      if (data.chats) setChatsData({ chats: data.chats })
      setEditingChatId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleTogglePinRecentChat = async (e, id) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/chats/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.chats) setChatsData({ chats: data.chats })
      setActiveMenuChatId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteRecentChat = async (e, id) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/chats/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.chats) setChatsData({ chats: data.chats })
      setActiveMenuChatId(null)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewChat = () => {
    setActiveTab('chat')
    setSelectedProject(null)
    setActiveProjectChat(null)
    setMessages([])
    setInputPrompt('')
  }

  const openLibrary = () => {
    setActiveTab('library')
    setSelectedProject(null)
    fetch('/api/library')
      .then((r) => r.json())
      .then(setLibraryData)
      .catch(() => {})
  }

  const openProjects = () => {
    setActiveTab('projects')
    setSelectedProject(null)
    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjectsData)
      .catch(() => {})
  }

  const handleCreateProject = async () => {
    const name = newProjName.trim()
    if (!name) return

    try {
      setLoading(true)
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: newProjDesc }),
      })
      const data = await res.json()
      if (data.projects) {
        setProjectsData({ projects: data.projects })
        if (data.project) {
          setSelectedProject(data.project)
          setActiveTab('projects')
        }
      }
      setShowCreateModal(false)
      setNewProjName('')
      setNewProjDesc('')
    } catch (err) {
      alert('Error creating project: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePin = async (e, id) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/projects/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.projects) setProjectsData({ projects: data.projects })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendProjectChatMessage = async (textToSend) => {
    if (!selectedProject || !activeProjectChat) return
    const promptText = (textToSend || inputPrompt).trim()
    if (!promptText || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: promptText }
    setMessages((prev) => [...prev, userMsg])
    setInputPrompt('')
    setLoading(true)

    try {
      const res = await fetch('/api/projects/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          chatId: activeProjectChat.id,
          prompt: promptText,
        }),
      })
      const data = await res.json()
      if (data.chat) {
        setActiveProjectChat(data.chat)
        setMessages(data.chat.messages || [])
      }
      if (data.projects) setProjectsData({ projects: data.projects })
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Error: ${err.message}`,
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const createQuickProjectChat = async (promptText) => {
    if (!selectedProject || !promptText.trim()) return
    const title = promptText.trim().slice(0, 30)
    try {
      setLoading(true)
      const res = await fetch('/api/projects/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject.id, title }),
      })
      const data = await res.json()
      if (data.chat) {
        setActiveProjectChat(data.chat)
        // Now send prompt to new chat
        const sendRes = await fetch('/api/projects/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProject.id,
            chatId: data.chat.id,
            prompt: promptText,
          }),
        })
        const sendData = await sendRes.json()
        if (sendData.chat) {
          setActiveProjectChat(sendData.chat)
          setMessages(sendData.chat.messages || [])
        }
        if (sendData.projects) setProjectsData({ projects: sendData.projects })
      }
    } catch (err) {
      alert('Error creating chat: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64Data = event.target.result
      try {
        setLoading(true)
        await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: base64Data }),
        })
        openLibrary()
      } catch (err) {
        alert('Upload error: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteFile = async (e, filename) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return

    // Optimistically update UI immediately
    setLibraryData((prev) => ({
      ...prev,
      items: (prev?.items || []).filter((i) => i.name !== filename && i.id !== filename),
    }))

    try {
      await fetch('/api/library/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      openLibrary()
    } catch (err) {
      alert('Delete error: ' + err.message)
    }
  }

  const handleSendPrompt = async (textToSend) => {
    setActiveTab('chat')
    const promptText = (textToSend || inputPrompt).trim()
    if (!promptText || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: promptText }
    setMessages((prev) => [...prev, userMsg])
    setInputPrompt('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      })
      const data = await res.json()

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || 'No response generated.',
        tools: data.matched_tools || [],
        commands: data.matched_commands || [],
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (data.chats) setChatsData({ chats: data.chats })
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Error: ${err.message}`,
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const renderFormattedContent = (content) => {
    return (
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre({ children }) {
              return <>{children}</>
            },
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const codeString = String(children).replace(/\n$/, '')
              if (!inline && (match || codeString.includes('\n'))) {
                const lang = match ? match[1] : 'code'
                return (
                  <pre>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase', fontWeight: '600' }}>
                        {lang}
                      </span>
                      <button
                        className="copy-code-btn"
                        style={{ position: 'static' }}
                        onClick={(e) => {
                          navigator.clipboard.writeText(codeString)
                          e.target.innerText = 'Copied!'
                          setTimeout(() => (e.target.innerText = 'Copy'), 2000)
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <code>{codeString}</code>
                  </pre>
                )
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  // 100% Dynamic Filter items for Library view (No hardcoded fallback dummy data)
  const libraryItems = (libraryData?.items || []).filter((item) => {
    const matchesCat = libCategory === 'All' || item.category === libCategory
    const matchesSearch = !libSearch || item.name.toLowerCase().includes(libSearch.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="app-container">
      {/* Hidden File Input for Upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Sidebar (Left) */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {isSidebarCollapsed ? (
          <>
            {/* Collapsed Rail Icons matching user screenshot */}
            <div className="collapsed-top-icons">
              <button
                className="collapsed-icon-btn"
                title="Expand sidebar"
                onClick={() => setIsSidebarCollapsed(false)}
              >
                ◧
              </button>
              <button
                className="collapsed-icon-btn"
                title="New chat"
                onClick={handleNewChat}
              >
                📝
              </button>
              <button
                className="collapsed-icon-btn"
                title="Search"
                onClick={() => {
                  setIsSidebarCollapsed(false)
                }}
              >
                🔍
              </button>
              <button
                className="collapsed-icon-btn"
                title="Pinned & Projects"
                onClick={openProjects}
              >
                📌
              </button>
              <button
                className="collapsed-icon-btn"
                title="Recents & Chat"
                onClick={() => setActiveTab('chat')}
              >
                💬
              </button>
            </div>

            {/* Bottom Collapsed User Avatar Circle */}
            <div
              className="collapsed-avatar-circle"
              title={`${userProfile.name || 'Aman'} (${userProfile.plan || 'Go'}) - Profile Settings`}
              onClick={() => setShowProfileModal(true)}
            >
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                (userProfile.name || 'AS').slice(0, 2).toUpperCase()
              )}
            </div>
          </>
        ) : (
          <>
            <div className="sidebar-top">
              <div className="sidebar-header">
                <button className="icon-btn" title="Search">
                  🔍
                </button>
                <button
                  className="icon-btn"
                  title="Toggle sidebar collapse"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                  ◧
                </button>
              </div>

              <button className="new-chat-btn" onClick={handleNewChat}>
                <span style={{ fontSize: '18px', fontWeight: '400' }}>+</span> New chat
              </button>

              <nav className="nav-group">
                <a className={`nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={openLibrary}>
                  <span style={{ fontSize: '14px' }}>📊</span> Library
                </a>
                <a className={`nav-item ${activeTab === 'projects' && !selectedProject ? 'active' : ''}`} onClick={openProjects}>
                  <div className="nav-item-projects">
                    <span>📁 Projects</span>
                    <span
                      className="nav-project-plus"
                      title="Create new project"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowCreateModal(true)
                      }}
                    >
                      +
                    </span>
                  </div>
                </a>
                <a className={`nav-item ${activeTab === 'scheduled' ? 'active' : ''}`} onClick={() => setActiveTab('scheduled')}>
                  <span style={{ fontSize: '14px' }}>🕒</span> Scheduled
                </a>

                <div className="nav-section-label">Pinned</div>
                {(projectsData?.projects || []).filter((p) => p.pinned).map((p) => (
                  <a
                    key={p.id}
                    className={`nav-item ${selectedProject?.id === p.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProject(p)
                      setActiveTab('projects')
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>📌</span> {p.name}
                  </a>
                ))}
                {(chatsData?.chats || []).filter((c) => c.pinned).map((c) => (
                  <a
                    key={c.id}
                    className="nav-item"
                    onClick={() => handleSendPrompt(c.title)}
                  >
                    <span style={{ fontSize: '14px' }}>📌</span> {c.title}
                  </a>
                ))}

                {/* Recents Header matching screenshot */}
                <div className="recents-header-container">
                  <span
                    className="recents-header-title"
                    onClick={() => setIsRecentsCollapsed(!isRecentsCollapsed)}
                  >
                    Recents <span style={{ fontSize: '10px' }}>{isRecentsCollapsed ? '❯' : '∨'}</span>
                  </span>
                  <div className="recents-header-actions">
                    <button
                      className="recents-icon-btn"
                      title="More options"
                      onClick={(e) => {
                        e.stopPropagation()
                        alert('Recents Options: Hover over any chat item to Pin, Rename, or Delete!')
                      }}
                    >
                      •••
                    </button>
                    <button
                      className="recents-icon-btn"
                      title="New chat"
                      onClick={handleNewChat}
                    >
                      📝
                    </button>
                  </div>
                </div>

                {/* Recents List Items */}
                {!isRecentsCollapsed && (
                  <div>
                    {(chatsData?.chats || [
                      { id: 'chat-rec-1', title: 'About ChatGPT' },
                      { id: 'chat-rec-2', title: 'Grok API Key Info' },
                      { id: 'chat-rec-3', title: 'Vercel Custom Domain Setup' },
                      { id: 'chat-rec-4', title: 'Moringa Tablet Usage Guide' },
                      { id: 'chat-rec-5', title: 'Janmanchchakra Request' },
                      { id: 'chat-rec-6', title: 'Janma Chakra Banwana' },
                      { id: 'chat-rec-7', title: 'Hosting Landing Page on Netlify' },
                      { id: 'chat-rec-8', title: 'Awaaz logo design' }
                    ]).filter(c => !c.pinned).map((chat) => (
                      <div key={chat.id} style={{ position: 'relative' }}>
                        <a
                          className="nav-item"
                          onClick={() => handleSendPrompt(chat.title)}
                        >
                          <div className="recent-item-container">
                            {editingChatId === chat.id ? (
                              <input
                                className="lib-search-input"
                                style={{ background: '#09090B', padding: '2px 6px', borderRadius: '4px' }}
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameRecentChat(chat.id, editingTitle)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            ) : (
                              <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                                {chat.title}
                              </span>
                            )}
                            <div className="recent-item-actions">
                              <button
                                className="recents-icon-btn"
                                title="Chat Options"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id)
                                }}
                              >
                                •••
                              </button>
                            </div>
                          </div>
                        </a>

                        {/* Popover Context Menu for Chat Item */}
                        {activeMenuChatId === chat.id && (
                          <div className="popover-menu" onClick={(e) => e.stopPropagation()}>
                            <div
                              className="popover-item"
                              onClick={(e) => handleTogglePinRecentChat(e, chat.id)}
                            >
                              <span>📌</span> Pin chat
                            </div>
                            <div
                              className="popover-item"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingChatId(chat.id)
                                setEditingTitle(chat.title)
                                setActiveMenuChatId(null)
                              }}
                            >
                              <span>✏️</span> Rename
                            </div>
                            <div
                              className="popover-item"
                              style={{ color: '#EF4444' }}
                              onClick={(e) => handleDeleteRecentChat(e, chat.id)}
                            >
                              <span>🗑️</span> Delete
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </nav>
            </div>

            {/* User Profile (Bottom) - Removed Setting Icon & Clickable for Profile Settings Page */}
            <div
              className="user-profile"
              style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
              onClick={() => setShowProfileModal(true)}
              title="Click to edit profile settings"
            >
              <div className="user-info">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="Avatar"
                    className="avatar"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar">
                    {(userProfile.name || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="user-details">
                  <h5>{userProfile.name || 'Aman'}</h5>
                  <span>{userProfile.plan || 'Go'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`mobile-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header Bar */}
        <header className="header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="icon-btn mobile-menu-btn"
              title="Toggle navigation menu"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              style={{ fontSize: '18px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ☰
            </button>
            <img
              src="/logo.png"
              alt="Singh AI Logo"
              style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #3F3F46' }}
            />
            <select
              className="model-selector"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                background: '#18181B',
                border: '1px solid #27272A',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: '600',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Singh AI 3">Singh AI 3</option>
              <option value="Singh AI Flash">Singh AI Flash</option>
              <option value="Singh AI Pro">Singh AI Pro</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="status-badge">
              <div className="status-dot"></div>
              <span>{providerStatus}</span>
            </div>
            <button className="icon-btn" title="Full screen">
              ⤢
            </button>
          </div>
        </header>

        {/* Dynamic Views: Library, Projects, Scheduled, vs Chat */}
        {activeTab === 'library' && (
          <div className="chat-scroll-wrapper">
            <div className="chat-container" style={{ maxWidth: '960px', gap: '0' }}>
              {/* Library Header Row */}
              <div className="lib-header">
                <h1 className="lib-title">Library</h1>
                <div className="lib-actions">
                  <div className="lib-search-box">
                    <span style={{ color: '#71717A', fontSize: '13px' }}>🔍</span>
                    <input
                      className="lib-search-input"
                      type="text"
                      placeholder="Search"
                      value={libSearch}
                      onChange={(e) => setLibSearch(e.target.value)}
                    />
                  </div>
                  <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                    + New ∨
                  </button>
                </div>
              </div>

              {/* Tabs & View Toggles */}
              <div className="lib-tabs-bar">
                <div className="lib-tabs">
                  {['All', 'Images', 'Documents'].map((cat) => (
                    <button
                      key={cat}
                      className={`tab-pill ${libCategory === cat ? 'active' : ''}`}
                      onClick={() => setLibCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="lib-view-toggles">
                  <button className="view-btn">≡</button>
                  <button
                    className={`view-btn ${libViewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setLibViewMode('grid')}
                  >
                    ::
                  </button>
                  <button
                    className={`view-btn ${libViewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setLibViewMode('list')}
                  >
                    ≡≡
                  </button>
                </div>
              </div>

              {/* File List Table or Grid View */}
              {libViewMode === 'list' ? (
                <table className="file-table">
                  <thead>
                    <tr>
                      <th style={{ width: '55%' }}>Name</th>
                      <th style={{ width: '20%' }}>Modified</th>
                      <th style={{ width: '15%' }}>Size</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {libraryItems.map((file) => (
                      <tr
                        key={file.id}
                        className="file-row"
                        onClick={() => {
                          if (file.category === 'Images') setPreviewImage(file.url)
                          else window.open(file.url, '_blank')
                        }}
                      >
                        <td>
                          <div className="file-thumb-cell">
                            <div className="file-thumb">
                              {file.category === 'Images' ? (
                                <img src={file.url} alt="" />
                              ) : (
                                <span>📄</span>
                              )}
                            </div>
                            <span style={{ fontWeight: '500', color: '#F4F4F5' }}>{file.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#A1A1AA' }}>{file.modified}</td>
                        <td style={{ color: '#A1A1AA' }}>{file.size}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            title="Delete file"
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '14px', padding: '4px 8px' }}
                            onClick={(e) => handleDeleteFile(e, file.name)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                    {libraryItems.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#71717A' }}>
                          No files found in Library. Click <strong>+ New</strong> to upload files.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '12px' }}>
                  {libraryItems.map((file) => (
                    <div
                      key={file.id}
                      style={{ background: '#121215', border: '1px solid #27272A', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}
                      onClick={() => {
                        if (file.category === 'Images') setPreviewImage(file.url)
                        else window.open(file.url, '_blank')
                      }}
                    >
                      <div style={{ height: '120px', borderRadius: '8px', background: '#18181B', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyCenter: 'center', marginBottom: '8px' }}>
                        {file.category === 'Images' ? (
                          <img src={file.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '32px' }}>📄</span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                      <p style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>{file.size} • {file.modified}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Lightbox Preview for Images */}
        {previewImage && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setPreviewImage(null)}
          >
            <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
              <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', border: '1px solid #27272A' }} />
              <button
                style={{ position: 'absolute', top: '-16px', right: '-16px', background: '#27272A', color: '#FFF', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => setPreviewImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {activeTab === 'projects' && !selectedProject && (
          <div className="chat-scroll-wrapper">
            <div className="chat-container" style={{ maxWidth: '960px', gap: '0' }}>
              {/* Projects Header Row */}
              <div className="lib-header">
                <h1 className="lib-title">Projects</h1>
                <div className="lib-actions">
                  <div className="lib-search-box">
                    <span style={{ color: '#71717A', fontSize: '13px' }}>🔍</span>
                    <input
                      className="lib-search-input"
                      type="text"
                      placeholder="Search projects"
                      value={projSearch}
                      onChange={(e) => setProjSearch(e.target.value)}
                    />
                  </div>
                  <button className="upload-btn" onClick={() => setShowCreateModal(true)}>
                    + New
                  </button>
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="lib-tabs-bar">
                <div className="lib-tabs">
                  {['All', 'Created by you', 'Shared with you'].map((cat) => (
                    <button
                      key={cat}
                      className={`tab-pill ${projCategory === cat ? 'active' : ''}`}
                      onClick={() => setProjCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projects Table */}
              <table className="file-table">
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>Name</th>
                    <th style={{ width: '25%' }}>Modified</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(projectsData?.projects || [])
                    .filter((p) => !projSearch || p.name.toLowerCase().includes(projSearch.toLowerCase()))
                    .map((proj) => (
                      <tr
                        key={proj.id}
                        className="file-row"
                        onClick={() => setSelectedProject(proj)}
                      >
                        <td>
                          <div className="file-thumb-cell">
                            <div className="file-thumb" style={{ background: '#18181B', fontSize: '18px' }}>
                              {proj.name.toLowerCase().includes('homework') || proj.name.toLowerCase().includes('prep') ? '🎓' : '📁'}
                            </div>
                            <div>
                              <span style={{ fontWeight: '500', color: '#F4F4F5', display: 'block' }}>{proj.name}</span>
                              {proj.description && (
                                <span style={{ fontSize: '11px', color: '#71717A' }}>{proj.description}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#A1A1AA' }}>{proj.modified}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              title={proj.pinned ? 'Unpin project' : 'Pin project'}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: proj.pinned ? 1 : 0.4 }}
                              onClick={(e) => handleTogglePin(e, proj.id)}
                            >
                              📌
                            </button>
                            <button
                              title="Delete project"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#EF4444' }}
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!confirm(`Delete project "${proj.name}"?`)) return
                                const res = await fetch('/api/projects/delete', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: proj.id }),
                                })
                                const data = await res.json()
                                if (data.projects) setProjectsData({ projects: data.projects })
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {(projectsData?.projects || []).length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#71717A' }}>
                        No projects found. Click <strong>+ New</strong> or hover on <strong>Projects</strong> in the sidebar to create one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Project Workspace View (Matching User Screenshot Layout) */}
        {activeTab === 'projects' && selectedProject && !activeProjectChat && (
          <div className="chat-scroll-wrapper">
            <div className="chat-container" style={{ maxWidth: '960px', gap: '20px' }}>
              {/* Project Header Row matching screenshot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="modal-cancel-btn"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => setSelectedProject(null)}
                  >
                    ← Projects
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '26px' }}>📁</span>
                    <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#FFFFFF' }}>{selectedProject.name}</h1>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="upload-btn" style={{ background: '#27272A', color: '#FFF', padding: '8px 14px' }}>
                    ↑ Share
                  </button>
                  <button className="icon-btn" style={{ background: '#27272A', borderRadius: '50%', width: '36px', height: '36px' }}>
                    •••
                  </button>
                </div>
              </div>

              {/* Prominent Prompt Bar: + New chat in Pravzo */}
              <div className="prompt-bar" style={{ background: '#18181B', border: '1px solid #27272A', padding: '14px 20px', borderRadius: '24px' }}>
                <span style={{ fontSize: '20px', color: '#71717A', cursor: 'pointer' }}>+</span>
                <input
                  className="prompt-input"
                  type="text"
                  placeholder={`New chat in ${selectedProject.name}`}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createQuickProjectChat(inputPrompt)
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button className="icon-btn" title="Voice input" onClick={() => createQuickProjectChat(inputPrompt)}>
                    🎤
                  </button>
                  <button className="icon-btn" title="Waveform action" onClick={() => createQuickProjectChat(inputPrompt)}>
                    🎛️
                  </button>
                </div>
              </div>

              {/* Sub-bar Tabs: Chats vs Sources */}
              <div className="lib-tabs-bar" style={{ marginBottom: '8px' }}>
                <div className="lib-tabs">
                  <button className="tab-pill active">Chats</button>
                  <button className="tab-pill">Sources</button>
                </div>
              </div>

              {/* Project Chat Rows List (Matching Screenshot format) */}
              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #1F1F23' }}>
                {(selectedProject.chats || []).map((chat) => (
                  <div
                    key={chat.id}
                    className="file-row"
                    style={{ padding: '16px 12px', borderBottom: '1px solid #18181B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => {
                      setActiveProjectChat(chat)
                      setMessages(chat.messages || [])
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>{chat.title}</h4>
                      <p style={{ fontSize: '13px', color: '#71717A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '650px' }}>
                        {chat.preview || (chat.messages?.[0]?.content?.slice(0, 70) || 'Click to view conversation...')}
                      </p>
                    </div>
                    <span style={{ fontSize: '13px', color: '#71717A', fontWeight: '400' }}>{chat.date || 'Jul 4'}</span>
                  </div>
                ))}
                {(selectedProject.chats || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#71717A' }}>
                    No chats in this project yet. Type above in <strong>New chat in {selectedProject.name}</strong> to start a conversation!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Conversation View inside Selected Project */}
        {activeTab === 'projects' && selectedProject && activeProjectChat && (
          <div className="chat-scroll-wrapper">
            <div className="chat-container" style={{ maxWidth: '800px' }}>
              {/* Back to Project Chat List Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #1F1F23', marginBottom: '16px' }}>
                <button
                  className="modal-cancel-btn"
                  onClick={() => {
                    setActiveProjectChat(null)
                    setMessages([])
                  }}
                >
                  ← Back to {selectedProject.name} Chats
                </button>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFF' }}>💬 {activeProjectChat.title}</span>
              </div>

              {/* Message List */}
              {messages.map((msg) => (
                <div key={msg.id} className={`message-item ${msg.role}`}>
                  {renderFormattedContent(msg.content)}
                </div>
              ))}
              {loading && (
                <div className="message-item assistant">
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 0' }}>
                    <div className="status-dot" style={{ animation: 'pulse 1s infinite' }}></div>
                    <span style={{ fontSize: '13px', color: '#71717A' }}>Grok is typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Persistent Input Bar inside Project Chat Conversation */}
            <div style={{ padding: '16px 24px 24px 24px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
              <div className="prompt-bar">
                <span style={{ fontSize: '20px', color: '#71717A', cursor: 'pointer' }}>+</span>
                <input
                  className="prompt-input"
                  type="text"
                  placeholder={`Reply in ${activeProjectChat.title}...`}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendProjectChatMessage()
                  }}
                />
                <button
                  className="icon-btn"
                  style={{ color: '#10B981', fontWeight: 'bold' }}
                  onClick={() => handleSendProjectChatMessage()}
                >
                  ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal Dialog */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Create New Project</h3>
              <p className="modal-desc">Organize your code, docs, and multi-thread chats into dedicated project workspaces.</p>
              
              <label style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Project Name</label>
              <input
                className="modal-input"
                type="text"
                placeholder="e.g. Pravzo Mobile App"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                autoFocus
              />

              <label style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Description (Optional)</label>
              <input
                className="modal-input"
                type="text"
                placeholder="e.g. Main frontend repository"
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
              />

              <div className="modal-actions">
                <button className="modal-cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="modal-submit-btn" onClick={handleCreateProject}>
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Tasks View (Matching User Screenshot Layout) */}
        {activeTab === 'scheduled' && (
          <div className="chat-scroll-wrapper">
            <div className="chat-container" style={{ maxWidth: '800px', gap: '24px' }}>
              {/* Scheduled Header matching screenshot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>Scheduled</h1>
                  <p style={{ fontSize: '14px', color: '#A1A1AA' }}>
                    Ask ChatGPT to schedule tasks, set reminders, or monitor for updates.
                  </p>
                </div>
                <button
                  className="upload-btn"
                  style={{
                    background: '#18181B',
                    border: '1px solid #27272A',
                    color: '#FFF',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                  onClick={() => setSchedFilter(schedFilter === 'Active' ? 'All' : 'Active')}
                >
                  <span>🍸</span> {schedFilter}
                </button>
              </div>

              {/* Prominent Task Scheduling Bar matching screenshot */}
              <div className="prompt-bar" style={{ background: '#18181B', border: '1px solid #27272A', padding: '14px 20px', borderRadius: '24px' }}>
                <span style={{ fontSize: '20px', color: '#71717A', cursor: 'pointer' }}>+</span>
                <input
                  className="prompt-input"
                  type="text"
                  placeholder="Schedule a task"
                  value={schedPrompt}
                  onChange={(e) => setSchedPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateScheduledTask(schedPrompt)
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button className="icon-btn" title="Voice input" onClick={() => handleCreateScheduledTask(schedPrompt)}>
                    🎤
                  </button>
                  <button className="icon-btn" title="Waveform action" onClick={() => handleCreateScheduledTask(schedPrompt)}>
                    🎛️
                  </button>
                </div>
              </div>

              {/* Scheduled Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {(scheduledData?.tasks || [])
                  .filter((t) => schedFilter === 'All' || t.status === 'Active')
                  .map((task) => (
                    <div
                      key={task.id}
                      style={{
                        background: '#121215',
                        border: '1px solid #27272A',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>{task.prompt}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: task.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: task.status === 'Active' ? '#10B981' : '#F59E0B',
                              fontWeight: '600'
                            }}
                          >
                            ● {task.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#71717A' }}>
                          <span>🕒 {task.schedule}</span>
                          <span>•</span>
                          <span>Created {task.created_at}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="modal-cancel-btn"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleToggleScheduledTask(task.id)}
                        >
                          {task.status === 'Active' ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          className="icon-btn"
                          style={{ color: '#EF4444', fontSize: '14px' }}
                          title="Delete task"
                          onClick={() => handleDeleteScheduledTask(task.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                {(scheduledData?.tasks || []).filter((t) => schedFilter === 'All' || t.status === 'Active').length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#71717A', fontSize: '14px' }}>
                    No active scheduled tasks. Type above in <strong>Schedule a task</strong> to set a reminder or recurring job!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <>
            {messages.length === 0 ? (
              <div className="hero-container">
                <h1 className="hero-title">Hey, Aman. Ready to dive in?</h1>

                <div className="prompt-bar">
                  <span style={{ fontSize: '20px', color: '#71717A', cursor: 'pointer' }}>+</span>
                  <input
                    className="prompt-input"
                    type="text"
                    placeholder="Ask anything"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendPrompt()
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="icon-btn" title="Voice Input">
                      🎤
                    </button>
                    <button className="icon-btn" title="Audio Waveform">
                      🎛️
                    </button>
                  </div>
                </div>

                <div className="action-cards">
                  <div
                    className="action-card"
                    onClick={() => handleSendPrompt('Create an image prompt or visual design asset')}
                  >
                    <span style={{ fontSize: '18px' }}>🖼️</span>
                    <span>Create an image</span>
                  </div>
                  <div
                    className="action-card"
                    onClick={() => handleSendPrompt('Write a python script to calculate fibonacci numbers and save it')}
                  >
                    <span style={{ fontSize: '18px' }}>📝</span>
                    <span>Write or edit</span>
                  </div>
                  <div
                    className="action-card"
                    onClick={() => handleSendPrompt('Explain the architecture of Claw Code AI Agent harness')}
                  >
                    <span style={{ fontSize: '18px' }}>🌐</span>
                    <span>Look something up</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="chat-scroll-wrapper">
                <div className="chat-container">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`message-item ${msg.role}`}>
                      {renderFormattedContent(msg.content)}
                    </div>
                  ))}
                  {loading && (
                    <div className="message-item assistant">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 0' }}>
                        <div className="status-dot" style={{ animation: 'pulse 1s infinite' }}></div>
                        <span style={{ fontSize: '13px', color: '#71717A' }}>Singh AI is typing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div style={{ padding: '0 24px 24px 24px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
                <div className="prompt-bar">
                  <span style={{ fontSize: '20px', color: '#71717A', cursor: 'pointer' }}>+</span>
                  <input
                    className="prompt-input"
                    type="text"
                    placeholder="Ask anything..."
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendPrompt()
                    }}
                  />
                  <button
                    className="icon-btn"
                    style={{ color: '#10B981', fontWeight: 'bold' }}
                    onClick={() => handleSendPrompt()}
                  >
                    ➔
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Profile Settings Modal Page */}
        {showProfileModal && (
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Profile Settings</h3>
              <p className="modal-desc">Manage your display name, subscription tier, and profile avatar.</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0 20px 0' }}>
                {editAvatar ? (
                  <img
                    src={editAvatar}
                    alt="Avatar Preview"
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #27272A' }}
                  />
                ) : (
                  <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '24px', background: '#10B981' }}>
                    {(editName || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '600' }}>{editName || 'Aman'}</h4>
                  <span style={{ fontSize: '13px', color: '#A1A1AA' }}>{editPlan || 'Go'}</span>
                </div>
              </div>

              <label style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input
                className="modal-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
              />

              <label style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Plan / Role Title</label>
              <input
                className="modal-input"
                type="text"
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
                placeholder="e.g. Go, Pro, AI Engineer"
              />

              <label style={{ fontSize: '12px', color: '#A1A1AA', display: 'block', marginBottom: '6px' }}>Profile Photo URL</label>
              <input
                className="modal-input"
                type="text"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="Paste photo URL (or leave blank for initial avatar)"
              />

              <div className="modal-actions">
                <button className="modal-cancel-btn" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button className="modal-submit-btn" onClick={handleUpdateProfile}>
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
