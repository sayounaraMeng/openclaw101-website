/**
 * OpenClaw 101 Website - Main Application
 * Single Page Application with Vanilla JavaScript
 */

// Application State
const state = {
  currentDay: null,
  currentTopic: null,
  progress: JSON.parse(localStorage.getItem('openclaw101_progress') || '{}'),
  content: null,
  searchQuery: '',
  searchResults: [],
  sidebarOpen: false
};

// DOM Elements
const elements = {
  sidebar: document.getElementById('sidebar'),
  sidebarNav: document.getElementById('sidebar-nav'),
  mainContent: document.getElementById('main-content'),
  tocSidebar: document.getElementById('toc-sidebar'),
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  menuToggle: document.getElementById('menu-toggle'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
  renderSidebar();
  renderHome();
  setupEventListeners();
  updateProgress();
});

// Load Content Data
async function loadContent() {
  try {
    // Try to load full content first, fallback to basic content
    let response = await fetch('data/content-full.json');
    if (!response.ok) {
      response = await fetch('data/content.json');
    }
    state.content = await response.json();
  } catch (error) {
    console.error('Failed to load content:', error);
    showError('Failed to load course content. Please refresh the page.');
  }
}

// Render Sidebar Navigation
function renderSidebar() {
  if (!state.content) return;
  
  const navHTML = state.content.days.map(day => {
    const dayProgress = calculateDayProgress(day.id);
    const isCompleted = dayProgress === 100;
    
    return `
      <div class="nav-section">
        <div class="nav-item" data-day="${day.id}" onclick="navigateToDay('${day.id}')">
          <span class="nav-item-icon">${day.icon}</span>
          <span class="nav-item-text">${day.title}</span>
          <span class="nav-item-progress ${isCompleted ? 'completed' : ''}"></span>
        </div>
      </div>
    `;
  }).join('');
  
  elements.sidebarNav.innerHTML = `
    <div class="nav-section-title">Course Content</div>
    ${navHTML}
  `;
}

// Render Home Page
function renderHome() {
  if (!state.content) return;
  
  const { course, features, days } = state.content;
  
  elements.mainContent.innerHTML = `
    <div class="hero">
      <div class="hero-badge">
        <span>🎓</span>
        <span>System Learning Guide</span>
      </div>
      <h1 class="hero-title">${course.title}</h1>
      <p class="hero-subtitle">${course.subtitle}</p>
      <p class="hero-description">${course.description}</p>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-value">${course.duration}</div>
          <div class="hero-stat-label">Duration</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">${course.dailyTime}</div>
          <div class="hero-stat-label">Daily Study</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">${course.totalDocs}</div>
          <div class="hero-stat-label">Lessons</div>
        </div>
      </div>
      <div style="margin-top: 2rem;">
        <button class="btn btn-primary" onclick="navigateToDay('day01')">
          <span>🚀</span>
          <span>Start Learning</span>
        </button>
      </div>
    </div>
    
    <div class="features">
      ${features.map(f => `
        <div class="feature-card">
          <div class="feature-icon">${f.icon}</div>
          <h3 class="feature-title">${f.title}</h3>
          <p class="feature-description">${f.description}</p>
        </div>
      `).join('')}
    </div>
    
    <div class="days-grid">
      ${days.map(day => `
        <div class="day-card" onclick="navigateToDay('${day.id}')">
          <div class="day-header">
            <div class="day-icon">${day.icon}</div>
            <div class="day-info">
              <h3 class="day-title">${day.title}</h3>
              <p class="day-subtitle">${day.subtitle}</p>
            </div>
          </div>
          <p class="day-description">${day.description}</p>
          <div class="day-topics">
            ${day.topics.slice(0, 3).map(t => `
              <span class="day-topic-tag">${t.title.split(':')[1] || t.title}</span>
            `).join('')}
            ${day.topics.length > 3 ? `<span class="day-topic-tag">+${day.topics.length - 3} more</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  elements.tocSidebar.innerHTML = '';
  state.currentDay = null;
  state.currentTopic = null;
}

// Render Day Content
function renderDay(dayId) {
  const day = state.content.days.find(d => d.id === dayId);
  if (!day) return;
  
  state.currentDay = dayId;
  state.currentTopic = null;
  
  elements.mainContent.innerHTML = `
    <div class="content-area">
      <div class="topic-content">
        <div class="topic-header">
          <div class="topic-breadcrumb">
            <a href="#" onclick="renderHome(); return false;">Home</a>
            <span>/</span>
            <span>${day.title}</span>
          </div>
          <h1 class="topic-title">${day.icon} ${day.title}</h1>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">${day.description}</p>
        </div>
        
        <div class="topic-body">
          <h2>📚 Topics</h2>
          <div class="days-grid" style="padding: 0;">
            ${day.topics.map((topic, index) => {
              const isCompleted = state.progress[topic.id] === true;
              return `
                <div class="day-card" onclick="navigateToTopic('${day.id}', '${topic.id}')">
                  <div class="day-header">
                    <div class="day-icon">${isCompleted ? '✅' : (index + 1)}</div>
                    <div class="day-info">
                      <h3 class="day-title">${topic.title}</h3>
                      <p class="day-subtitle">${topic.duration} • ${topic.type}</p>
                    </div>
                  </div>
                  <p class="day-description">${topic.summary}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Update TOC
  elements.tocSidebar.innerHTML = `
    <div class="toc-title">Topics</div>
    <ul class="toc-list">
      ${day.topics.map((topic, index) => `
        <li class="toc-item">
          <a class="toc-link" href="#" onclick="navigateToTopic('${day.id}', '${topic.id}'); return false;">
            ${index + 1}. ${topic.title.split(':')[1] || topic.title}
          </a>
        </li>
      `).join('')}
    </ul>
  `;
  
  // Update active nav item
  updateActiveNavItem(dayId);
  
  // Close mobile sidebar
  if (window.innerWidth <= 768) {
    elements.sidebar.classList.remove('open');
  }
}

// Render Topic Content
async function renderTopic(dayId, topicId) {
  const day = state.content.days.find(d => d.id === dayId);
  const topic = day?.topics.find(t => t.id === topicId);
  if (!topic) return;
  
  state.currentDay = dayId;
  state.currentTopic = topicId;
  
  // Use content from JSON data (full content)
  let markdownContent = topic.content || generateTopicContent(topic);
  
  // Convert markdown to HTML
  const htmlContent = markdownToHTML(markdownContent);
  
  elements.mainContent.innerHTML = `
    <div class="content-area">
      <div class="topic-content">
        <div class="topic-header">
          <div class="topic-breadcrumb">
            <a href="#" onclick="renderHome(); return false;">Home</a>
            <span>/</span>
            <a href="#" onclick="navigateToDay('${dayId}'); return false;">${day.title}</a>
            <span>/</span>
            <span>${topic.title}</span>
          </div>
          <h1 class="topic-title">${topic.title}</h1>
        </div>
        
        <div class="topic-body" id="topic-body">
          ${htmlContent}
        </div>
        
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-secondary" onclick="navigateToDay('${dayId}')">
            ← Back to ${day.title}
          </button>
          <button class="btn btn-primary" onclick="markComplete('${topicId}')" id="complete-btn">
            ${state.progress[topicId] ? '✅ Completed' : 'Mark as Complete'}
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Generate TOC from content
  generateTOC();
  
  // Add copy buttons to code blocks
  addCodeCopyButtons();
  
  // Update active nav item
  updateActiveNavItem(dayId);
  
  // Close mobile sidebar
  if (window.innerWidth <= 768) {
    elements.sidebar.classList.remove('open');
  }
}

// Generate TOC from content headings
function generateTOC() {
  const topicBody = document.getElementById('topic-body');
  if (!topicBody) return;
  
  const headings = topicBody.querySelectorAll('h2, h3');
  if (headings.length === 0) {
    elements.tocSidebar.innerHTML = '';
    return;
  }
  
  const tocHTML = Array.from(headings).map((heading, index) => {
    const level = heading.tagName === 'H2' ? 1 : 2;
    const text = heading.textContent;
    const id = `heading-${index}`;
    heading.id = id;
    
    return `
      <li class="toc-item" style="padding-left: ${level * 0.5}rem;">
        <a class="toc-link" href="#${id}" onclick="scrollToHeading('${id}'); return false;">
          ${text}
        </a>
      </li>
    `;
  }).join('');
  
  elements.tocSidebar.innerHTML = `
    <div class="toc-title">On this page</div>
    <ul class="toc-list">
      ${tocHTML}
    </ul>
  `;
}

// Scroll to heading
function scrollToHeading(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Add copy buttons to code blocks
function addCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre');
  codeBlocks.forEach(block => {
    const button = document.createElement('button');
    button.className = 'code-copy-btn';
    button.textContent = 'Copy';
    button.onclick = () => copyCode(block, button);
    block.classList.add('code-block');
    block.appendChild(button);
  });
}

// Copy code to clipboard
async function copyCode(block, button) {
  const code = block.querySelector('code')?.textContent || block.textContent;
  try {
    await navigator.clipboard.writeText(code.replace('Copy', '').trim());
    button.textContent = 'Copied!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = 'Copy';
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

// Simple Markdown to HTML converter
function markdownToHTML(markdown) {
  let html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Lists
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Tables
    .replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(c => c.trim()).filter(c => c);
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    })
    // Horizontal rule
    .replace(/^---$/gim, '<hr>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  return `<p>${html}</p>`;
}

// Generate placeholder content for topics
function generateTopicContent(topic) {
  return `# ${topic.title}

## 学习目标

通过本文档，你将：
${topic.summary}

## 预计学习时间

${topic.duration}

## 内容类型

${topic.type}

---

> 完整内容正在加载中...
> 
> 如果内容未显示，请确保文档文件存在于正确的位置。
`;
}

// Navigation Functions
function navigateToDay(dayId) {
  renderDay(dayId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToTopic(dayId, topicId) {
  renderTopic(dayId, topicId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mark topic as complete
function markComplete(topicId) {
  state.progress[topicId] = !state.progress[topicId];
  localStorage.setItem('openclaw101_progress', JSON.stringify(state.progress));
  
  const btn = document.getElementById('complete-btn');
  if (btn) {
    btn.textContent = state.progress[topicId] ? '✅ Completed' : 'Mark as Complete';
  }
  
  updateProgress();
  renderSidebar();
}

// Calculate progress for a day
function calculateDayProgress(dayId) {
  const day = state.content?.days.find(d => d.id === dayId);
  if (!day) return 0;
  
  const completed = day.topics.filter(t => state.progress[t.id]).length;
  return Math.round((completed / day.topics.length) * 100);
}

// Update overall progress
function updateProgress() {
  if (!state.content) return;
  
  const totalTopics = state.content.days.reduce((sum, day) => sum + day.topics.length, 0);
  const completedTopics = Object.values(state.progress).filter(v => v === true).length;
  const percentage = Math.round((completedTopics / totalTopics) * 100);
  
  if (elements.progressBar) {
    elements.progressBar.style.width = `${percentage}%`;
  }
  if (elements.progressText) {
    elements.progressText.textContent = `${percentage}% Complete`;
  }
}

// Update active nav item
function updateActiveNavItem(dayId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.day === dayId) {
      item.classList.add('active');
    }
  });
}

// Search functionality
function setupSearch() {
  if (!elements.searchInput) return;
  
  elements.searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 2) {
      hideSearchResults();
      return;
    }
    performSearch(query);
  }, 300));
  
  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      hideSearchResults();
    }
  });
}

function performSearch(query) {
  if (!state.content) return;
  
  const results = [];
  
  state.content.days.forEach(day => {
    day.topics.forEach(topic => {
      const searchText = `${topic.title} ${topic.summary}`.toLowerCase();
      if (searchText.includes(query)) {
        results.push({
          dayId: day.id,
          topicId: topic.id,
          dayTitle: day.title,
          topicTitle: topic.title,
          summary: topic.summary
        });
      }
    });
  });
  
  renderSearchResults(results);
}

function renderSearchResults(results) {
  if (!elements.searchResults) return;
  
  if (results.length === 0) {
    elements.searchResults.innerHTML = `
      <div class="search-result-item">
        <div class="search-result-title">No results found</div>
      </div>
    `;
  } else {
    elements.searchResults.innerHTML = results.map(r => `
      <div class="search-result-item" onclick="navigateToTopic('${r.dayId}', '${r.topicId}'); hideSearchResults();">
        <div class="search-result-title">${r.topicTitle}</div>
        <div class="search-result-preview">${r.summary.substring(0, 100)}...</div>
      </div>
    `).join('');
  }
  
  elements.searchResults.style.display = 'block';
}

function hideSearchResults() {
  if (elements.searchResults) {
    elements.searchResults.style.display = 'none';
  }
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Mobile menu toggle
function setupMobileMenu() {
  if (elements.menuToggle) {
    elements.menuToggle.addEventListener('click', () => {
      elements.sidebar.classList.toggle('open');
    });
  }
}

// Show error message
function showError(message) {
  elements.mainContent.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-title">Error</div>
      <p>${message}</p>
    </div>
  `;
}

// Setup all event listeners
function setupEventListeners() {
  setupSearch();
  setupMobileMenu();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Press / to focus search
  if (e.key === '/' && document.activeElement !== elements.searchInput) {
    e.preventDefault();
    elements.searchInput?.focus();
  }
  
  // Press Escape to close search results
  if (e.key === 'Escape') {
    hideSearchResults();
    elements.searchInput?.blur();
  }
});
