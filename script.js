// ===== PARTICLE BACKGROUND =====
particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.5, random: false },
        size: { value: 3, random: true },
        line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
        }
    },
    interactivity: {
        detect_on: 'canvas',
        events: {
            onhover: { enable: true, mode: 'repulse' },
            onclick: { enable: true, mode: 'push' },
            resize: true
        }
    },
    retina_detect: true
});

// ===== STATE MANAGEMENT =====
let todos = JSON.parse(localStorage.getItem('galacticTodos')) || [];
let filter = 'all';
let searchQuery = '';

// ===== DOM ELEMENTS =====
const todoForm = document.getElementById('todoForm');
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');
const themeToggle = document.getElementById('themeToggle');
const statsToggle = document.getElementById('statsToggle');
const statsPanel = document.getElementById('statsPanel');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeModal = document.getElementById('closeModal');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    renderTodos();
    updateStats();
    updateProgress();
    loadTheme();
    setupKeyboardShortcuts();
    setupDragAndDrop();
});

// ===== ADD TODO =====
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTodo = {
        id: Date.now(),
        text: taskInput.value.trim(),
        category: categorySelect.value,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.unshift(newTodo);
    saveTodos();
    renderTodos();
    updateStats();
    updateProgress();
    
    // Reset form
    taskInput.value = '';
    dueDateInput.value = '';
    taskInput.focus();
    
    showToast('🚀 Task launched successfully!');
});

// ===== RENDER TODOS =====
function renderTodos() {
    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    todoList.innerHTML = filteredTodos.map(todo => {
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
        const categoryClass = `category-${todo.category}`;
        const priorityClass = `priority-${todo.priority}`;
        
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''} ${priorityClass}" 
                 data-id="${todo.id}" 
                 draggable="true">
                <input type="checkbox" 
                       class="todo-checkbox" 
                       ${todo.completed ? 'checked' : ''}
                       onchange="toggleTodo(${todo.id})">
                
                <div class="todo-content">
                    <div class="todo-text">${todo.text}</div>
                    <div class="todo-meta">
                        <span class="category-badge ${categoryClass}">
                            ${getCategoryIcon(todo.category)} ${todo.category}
                        </span>
                        <span>
                            <i class="fas fa-flag"></i> ${todo.priority}
                        </span>
                        ${todo.dueDate ? `
                            <span class="due-date ${isOverdue ? 'overdue' : ''}">
                                <i class="fas fa-calendar"></i> ${formatDate(todo.dueDate)}
                                ${isOverdue ? '⚠️' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="todo-actions">
                    <button class="edit-btn" onclick="editTodo(${todo.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteTodo(${todo.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== TOGGLE TODO =====
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateStats();
        updateProgress();
        
        if (todo.completed) {
            showToast('✅ Mission accomplished!');
        }
    }
}

// ===== EDIT TODO =====
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        const newText = prompt('Edit task:', todo.text);
        if (newText && newText.trim()) {
            todo.text = newText.trim();
            saveTodos();
            renderTodos();
            showToast('✏️ Task updated!');
        }
    }
}

// ===== DELETE TODO =====
function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        updateStats();
        updateProgress();
        showToast('🗑️ Task deleted!');
    }
}

// ===== FILTER & SEARCH =====
function getFilteredTodos() {
    let filtered = todos;
    
    // Apply status filter
    if (filter === 'active') {
        filtered = filtered.filter(t => !t.completed);
    } else if (filter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    }
    
    // Apply search
    if (searchQuery) {
        filtered = filtered.filter(t => 
            t.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return filtered;
}

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTodos();
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.dataset.filter;
        renderTodos();
    });
});

clearCompletedBtn.addEventListener('click', () => {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount > 0 && confirm(`Delete ${completedCount} completed tasks?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
        updateStats();
        updateProgress();
        showToast('🧹 Completed tasks cleared!');
    }
});

// ===== STATISTICS =====
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    
    // Calculate streak (simplified)
    const streak = calculateStreak();
    document.getElementById('streak').textContent = streak;
}

function calculateStreak() {
    // Simple implementation: count consecutive days with completed tasks
    // In a real app, you'd track this more carefully
    return Math.min(todos.filter(t => t.completed).length, 99);
}

function updateProgress() {
    const total = todos.length;
    if (total === 0) {
        progressFill.style.width = '0%';
        progressText.textContent = '0% Complete';
        return;
    }
    
    const completed = todos.filter(t => t.completed).length;
    const percentage = Math.round((completed / total) * 100);
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${percentage}% Complete`;
}

statsToggle.addEventListener('click', () => {
    statsPanel.classList.toggle('hidden');
});

// ===== THEME TOGGLE =====
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ===== HELP MODAL =====
helpButton.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    helpModal.classList.add('hidden');
});

helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
        helpModal.classList.add('hidden');
    }
});

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+N: Focus on task input
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            taskInput.focus();
        }
        
        // Ctrl+F: Focus on search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Ctrl+D: Toggle theme
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            themeToggle.click();
        }
        
        // Escape: Clear search or close modal
        if (e.key === 'Escape') {
            if (!helpModal.classList.contains('hidden')) {
                helpModal.classList.add('hidden');
            } else if (searchInput.value) {
                searchInput.value = '';
                searchQuery = '';
                renderTodos();
            }
        }
    });
}

// ===== DRAG AND DROP =====
function setupDragAndDrop() {
    let draggedElement = null;
    
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('todo-item')) {
            draggedElement = e.target;
            e.target.classList.add('dragging');
        }
    });
    
    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('todo-item')) {
            e.target.classList.remove('dragging');
        }
    });
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(todoList, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            todoList.appendChild(dragging);
        } else {
            todoList.insertBefore(dragging, afterElement);
        }
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedElement) {
            // Update todos order
            const newOrder = Array.from(todoList.children).map(item => 
                parseInt(item.dataset.id)
            );
            todos = newOrder.map(id => todos.find(t => t.id === id));
            saveTodos();
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== UTILITY FUNCTIONS =====
function getCategoryIcon(category) {
    const icons = {
        work: '💼',
        personal: '🏠',
        study: '📚',
        other: '✨'
    };
    return icons[category] || '✨';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function saveTodos() {
    localStorage.setItem('galacticTodos', JSON.stringify(todos));
}

// ===== WELCOME MESSAGE =====
if (todos.length === 0) {
    console.log(`
    🚀 Welcome to Galactic Todo List! 
    
    This app is part of a GitHub workshop. 
    Learn Git and GitHub while building awesome features!
    
    Press Ctrl+? or click the help button to see keyboard shortcuts.
    `);
}
