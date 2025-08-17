// 應用程式狀態管理
class ProductivityApp {
    constructor() {
        this.todos = this.loadFromStorage('todos') || [
            {"id": 1, "text": "完成專案報告", "completed": false, "priority": 1},
            {"id": 2, "text": "準備明天的簡報", "completed": false, "priority": 2}
        ];
        this.assignments = this.loadFromStorage('assignments') || [
            {"id": 1, "name": "數學作業", "dueDate": "2025-08-20"},
            {"id": 2, "name": "英文報告", "dueDate": "2025-08-25"}
        ];
        this.websites = this.loadFromStorage('websites') || [
            {"id": 1, "name": "Gmail", "url": "https://gmail.com", "icon": "📧"},
            {"id": 2, "name": "Google", "url": "https://google.com", "icon": "🔍"},
            {"id": 3, "name": "YouTube", "url": "https://youtube.com", "icon": "📺"}
        ];
        this.events = this.loadFromStorage('events') || {};
        this.scheduleImage = this.loadFromStorage('scheduleImage') || null;
        
        this.currentEditingTodo = null;
        this.currentEditingAssignment = null;
        this.currentEditingWebsite = null;
        this.currentEditingEvent = null;
        this.selectedDate = null;
        
        this.dayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        this.monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        
        this.init();
    }

    init() {
        this.setupTimeDisplay();
        this.setupEventListeners();
        this.renderTodos();
        this.renderAssignments();
        this.renderWebsites();
        this.initCalendar();
        this.loadScheduleImage();
        
        // 每分鐘更新時間
        setInterval(() => this.updateTime(), 60000);
    }

    // 本地存儲管理
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`productivity_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`無法載入 ${key}:`, e);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(`productivity_${key}`, JSON.stringify(data));
        } catch (e) {
            console.error(`無法儲存 ${key}:`, e);
        }
    }

    // 時間顯示
    setupTimeDisplay() {
        this.updateTime();
    }

    updateTime() {
        const now = new Date();
        const date = now.toLocaleDateString('zh-TW', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const day = this.dayNames[now.getDay()];
        const time = now.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });

        document.getElementById('currentDate').textContent = date;
        document.getElementById('currentDay').textContent = day;
        document.getElementById('currentTime').textContent = time;
    }

    // 事件監聽器設置
    setupEventListeners() {
        // 代辦事項
        document.getElementById('addTodoBtn').addEventListener('click', () => this.openTodoModal());
        document.getElementById('closeTodoModal').addEventListener('click', () => this.closeTodoModal());
        document.getElementById('cancelTodo').addEventListener('click', () => this.closeTodoModal());
        document.getElementById('saveTodo').addEventListener('click', () => this.saveTodo());

        // 作業
        document.getElementById('addAssignmentBtn').addEventListener('click', () => this.openAssignmentModal());
        document.getElementById('closeAssignmentModal').addEventListener('click', () => this.closeAssignmentModal());
        document.getElementById('cancelAssignment').addEventListener('click', () => this.closeAssignmentModal());
        document.getElementById('saveAssignment').addEventListener('click', () => this.saveAssignment());

        // 網站
        document.getElementById('addWebsiteBtn').addEventListener('click', () => this.openWebsiteModal());
        document.getElementById('closeWebsiteModal').addEventListener('click', () => this.closeWebsiteModal());
        document.getElementById('cancelWebsite').addEventListener('click', () => this.closeWebsiteModal());
        document.getElementById('saveWebsite').addEventListener('click', () => this.saveWebsite());

        // 課表上傳
        document.getElementById('uploadScheduleBtn').addEventListener('click', () => {
            document.getElementById('scheduleUpload').click();
        });
        document.getElementById('scheduleUpload').addEventListener('change', (e) => this.handleScheduleUpload(e));

        // 日曆控制
        document.getElementById('calendarYear').addEventListener('change', () => this.renderCalendar());
        document.getElementById('calendarMonth').addEventListener('change', () => this.renderCalendar());

        // 行程管理
        document.getElementById('closeEventModal').addEventListener('click', () => this.closeEventModal());
        document.getElementById('closeAddEventModal').addEventListener('click', () => this.closeAddEventModal());
        document.getElementById('cancelEvent').addEventListener('click', () => this.closeAddEventModal());
        document.getElementById('saveEvent').addEventListener('click', () => this.saveEvent());

        // 模態框背景點擊關閉
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    // 代辦事項管理
    openTodoModal(todo = null) {
        this.currentEditingTodo = todo;
        const modal = document.getElementById('todoModal');
        const title = document.getElementById('todoModalTitle');
        const text = document.getElementById('todoText');

        if (todo) {
            title.textContent = '編輯代辦事項';
            text.value = todo.text;
        } else {
            title.textContent = '新增代辦事項';
            text.value = '';
        }

        modal.classList.remove('hidden');
        text.focus();
    }

    closeTodoModal() {
        document.getElementById('todoModal').classList.add('hidden');
        this.currentEditingTodo = null;
    }

    saveTodo() {
        const text = document.getElementById('todoText').value.trim();
        if (!text) return;

        if (this.currentEditingTodo) {
            this.currentEditingTodo.text = text;
        } else {
            const newTodo = {
                id: Date.now(),
                text: text,
                completed: false,
                priority: this.todos.length + 1
            };
            this.todos.push(newTodo);
        }

        this.saveToStorage('todos', this.todos);
        this.renderTodos();
        this.closeTodoModal();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage('todos', this.todos);
            this.renderTodos();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage('todos', this.todos);
        this.renderTodos();
    }

    renderTodos() {
        const container = document.getElementById('todosList');
        if (!container) return;

        // 按優先級排序
        const sortedTodos = [...this.todos].sort((a, b) => a.priority - b.priority);

        container.innerHTML = sortedTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" draggable="true" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="app.toggleTodo(${todo.id})">
                <span class="todo-text">${todo.text}</span>
                <div class="todo-actions">
                    <button class="btn-icon" onclick="app.openTodoModal(app.todos.find(t => t.id === ${todo.id}))" title="編輯">✏️</button>
                    <button class="btn-icon" onclick="app.deleteTodo(${todo.id})" title="刪除">🗑️</button>
                </div>
            </div>
        `).join('');

        this.setupTodoDragAndDrop();
    }

    setupTodoDragAndDrop() {
        const todoItems = document.querySelectorAll('.todo-item');
        
        todoItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
                const targetId = parseInt(e.target.closest('.todo-item').dataset.id);
                this.reorderTodos(draggedId, targetId);
            });
        });
    }

    reorderTodos(draggedId, targetId) {
        const draggedTodo = this.todos.find(t => t.id === draggedId);
        const targetTodo = this.todos.find(t => t.id === targetId);

        if (!draggedTodo || !targetTodo) return;

        const draggedPriority = draggedTodo.priority;
        const targetPriority = targetTodo.priority;

        // 交換優先級
        draggedTodo.priority = targetPriority;
        targetTodo.priority = draggedPriority;

        this.saveToStorage('todos', this.todos);
        this.renderTodos();
    }

    // 作業管理
    openAssignmentModal(assignment = null) {
        this.currentEditingAssignment = assignment;
        const modal = document.getElementById('assignmentModal');
        const title = document.getElementById('assignmentModalTitle');
        const name = document.getElementById('assignmentName');
        const dueDate = document.getElementById('assignmentDueDate');

        if (assignment) {
            title.textContent = '編輯作業';
            name.value = assignment.name;
            dueDate.value = assignment.dueDate;
        } else {
            title.textContent = '新增作業';
            name.value = '';
            dueDate.value = '';
        }

        modal.classList.remove('hidden');
        name.focus();
    }

    closeAssignmentModal() {
        document.getElementById('assignmentModal').classList.add('hidden');
        this.currentEditingAssignment = null;
    }

    saveAssignment() {
        const name = document.getElementById('assignmentName').value.trim();
        const dueDate = document.getElementById('assignmentDueDate').value;

        if (!name || !dueDate) return;

        if (this.currentEditingAssignment) {
            this.currentEditingAssignment.name = name;
            this.currentEditingAssignment.dueDate = dueDate;
        } else {
            const newAssignment = {
                id: Date.now(),
                name: name,
                dueDate: dueDate
            };
            this.assignments.push(newAssignment);
        }

        this.saveToStorage('assignments', this.assignments);
        this.renderAssignments();
        this.closeAssignmentModal();
    }

    deleteAssignment(id) {
        this.assignments = this.assignments.filter(a => a.id !== id);
        this.saveToStorage('assignments', this.assignments);
        this.renderAssignments();
    }

    renderAssignments() {
        const container = document.getElementById('assignmentsList');
        if (!container) return;

        // 按到期日期排序
        const sortedAssignments = [...this.assignments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        const today = new Date().toISOString().split('T')[0];

        container.innerHTML = sortedAssignments.map(assignment => {
            const isOverdue = assignment.dueDate < today;
            return `
                <div class="assignment-item ${isOverdue ? 'overdue' : ''}">
                    <div class="assignment-name">${assignment.name}</div>
                    <div class="assignment-due">
                        <span>截止日期: ${new Date(assignment.dueDate).toLocaleDateString('zh-TW')}</span>
                        <div class="assignment-actions">
                            <button class="btn-icon" onclick="app.openAssignmentModal(app.assignments.find(a => a.id === ${assignment.id}))" title="編輯">✏️</button>
                            <button class="btn-icon" onclick="app.deleteAssignment(${assignment.id})" title="刪除">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 網站管理
    openWebsiteModal(website = null) {
        this.currentEditingWebsite = website;
        const modal = document.getElementById('websiteModal');
        const title = document.getElementById('websiteModalTitle');
        const name = document.getElementById('websiteName');
        const url = document.getElementById('websiteUrl');
        const icon = document.getElementById('websiteIcon');

        if (website) {
            title.textContent = '編輯網站';
            name.value = website.name;
            url.value = website.url;
            icon.value = website.icon;
        } else {
            title.textContent = '新增網站';
            name.value = '';
            url.value = '';
            icon.value = '';
        }

        modal.classList.remove('hidden');
        name.focus();
    }

    closeWebsiteModal() {
        document.getElementById('websiteModal').classList.add('hidden');
        this.currentEditingWebsite = null;
    }

    saveWebsite() {
        const name = document.getElementById('websiteName').value.trim();
        const url = document.getElementById('websiteUrl').value.trim();
        const icon = document.getElementById('websiteIcon').value.trim();

        if (!name || !url) return;

        if (this.currentEditingWebsite) {
            this.currentEditingWebsite.name = name;
            this.currentEditingWebsite.url = url;
            this.currentEditingWebsite.icon = icon || '🌐';
        } else {
            const newWebsite = {
                id: Date.now(),
                name: name,
                url: url,
                icon: icon || '🌐'
            };
            this.websites.push(newWebsite);
        }

        this.saveToStorage('websites', this.websites);
        this.renderWebsites();
        this.closeWebsiteModal();
    }

    deleteWebsite(id) {
        this.websites = this.websites.filter(w => w.id !== id);
        this.saveToStorage('websites', this.websites);
        this.renderWebsites();
    }

    renderWebsites() {
        const container = document.getElementById('websitesList');
        if (!container) return;

        container.innerHTML = this.websites.map(website => `
            <div class="website-item" onclick="app.openWebsite('${website.url}')">
                <span class="website-icon">${website.icon}</span>
                <div class="website-name">${website.name}</div>
                <div class="website-actions" onclick="event.stopPropagation()">
                    <button class="btn-icon" onclick="app.openWebsiteModal(app.websites.find(w => w.id === ${website.id}))" title="編輯">✏️</button>
                    <button class="btn-icon" onclick="app.deleteWebsite(${website.id})" title="刪除">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    openWebsite(url) {
        window.open(url, '_blank');
    }

    // 課表管理
    handleScheduleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.scheduleImage = e.target.result;
            this.saveToStorage('scheduleImage', this.scheduleImage);
            this.loadScheduleImage();
        };
        reader.readAsDataURL(file);
    }

    loadScheduleImage() {
        const container = document.getElementById('scheduleDisplay');
        if (!container) return;

        if (this.scheduleImage) {
            container.innerHTML = `<img src="${this.scheduleImage}" alt="課表" />`;
        } else {
            container.innerHTML = '<p class="upload-placeholder">點擊上傳課表圖片</p>';
        }
    }

    // 月曆管理
    initCalendar() {
        const now = new Date();
        const yearInput = document.getElementById('calendarYear');
        const monthSelect = document.getElementById('calendarMonth');

        yearInput.value = now.getFullYear();
        monthSelect.value = now.getMonth();

        this.renderCalendar();
    }

    renderCalendar() {
        const year = parseInt(document.getElementById('calendarYear').value);
        const month = parseInt(document.getElementById('calendarMonth').value);
        const container = document.getElementById('calendar');

        if (!container) return;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDate = new Date(firstDay);
        startDate.setDate(1 - firstDay.getDay());

        let calendarHTML = '<div class="calendar-grid">';
        
        // 星期標頭
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            calendarHTML += `<div class="calendar-header">${day}</div>`;
        });

        // 日期格子
        const today = new Date();
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayEvents = this.events[dateStr] || [];

            calendarHTML += `
                <div class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}">
                    <div class="day-number">${currentDate.getDate()}</div>
                    <div class="day-events">
                        ${dayEvents.slice(0, 2).map(event => 
                            `<div class="event-item">${event.name}</div>`
                        ).join('')}
                        ${dayEvents.length > 2 ? `<div class="event-item">+${dayEvents.length - 2}更多</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        container.innerHTML = calendarHTML;

        // 添加點擊事件監聽器
        this.setupCalendarEventListeners();
    }

    setupCalendarEventListeners() {
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            day.addEventListener('click', (e) => {
                const dateStr = e.currentTarget.dataset.date;
                if (dateStr) {
                    this.openEventModal(dateStr);
                }
            });
        });
    }

    // 行程管理
    openEventModal(dateStr) {
        this.selectedDate = dateStr;
        const modal = document.getElementById('eventModal');
        const title = document.getElementById('eventModalTitle');

        const date = new Date(dateStr);
        title.textContent = `${date.toLocaleDateString('zh-TW')} 行程管理`;

        this.renderEventTimeline();
        modal.classList.remove('hidden');
    }

    closeEventModal() {
        document.getElementById('eventModal').classList.add('hidden');
        this.selectedDate = null;
    }

    renderEventTimeline() {
        const container = document.getElementById('eventTimeline');
        if (!container || !this.selectedDate) return;

        const dayEvents = this.events[this.selectedDate] || [];
        let timelineHTML = '';

        for (let hour = 0; hour < 24; hour++) {
            const hourStr = hour.toString().padStart(2, '0') + ':00';
            const hourEvents = dayEvents.filter(event => {
                const eventHour = parseInt(event.startTime.split(':')[0]);
                return eventHour === hour;
            });

            timelineHTML += `
                <div class="timeline-hour">
                    <div class="hour-label">${hourStr}</div>
                    <div class="hour-events">
                        ${hourEvents.map(event => `
                            <div class="timeline-event">
                                <div class="event-info">
                                    <div class="event-title">${event.name}</div>
                                    <div class="event-details">
                                        ${event.startTime} - ${event.endTime}
                                        ${event.location ? ` • ${event.location}` : ''}
                                        ${event.notes ? ` • ${event.notes}` : ''}
                                    </div>
                                </div>
                                <div class="event-actions">
                                    <button class="btn-icon" onclick="app.openAddEventModal(app.events['${this.selectedDate}'].find(e => e.id === ${event.id}))" title="編輯">✏️</button>
                                    <button class="btn-icon" onclick="app.deleteEvent(${event.id})" title="刪除">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                        <button class="add-event-btn" onclick="app.openAddEventModal(null, '${hourStr}')">
                            + 新增 ${hourStr} 行程
                        </button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = timelineHTML;
    }

    openAddEventModal(event = null, defaultTime = '') {
        this.currentEditingEvent = event;
        const modal = document.getElementById('addEventModal');
        const title = document.getElementById('addEventModalTitle');
        const name = document.getElementById('eventName');
        const startTime = document.getElementById('eventStartTime');
        const endTime = document.getElementById('eventEndTime');
        const location = document.getElementById('eventLocation');
        const notes = document.getElementById('eventNotes');

        if (event) {
            title.textContent = '編輯行程';
            name.value = event.name;
            startTime.value = event.startTime;
            endTime.value = event.endTime;
            location.value = event.location || '';
            notes.value = event.notes || '';
        } else {
            title.textContent = '新增行程';
            name.value = '';
            startTime.value = defaultTime;
            endTime.value = '';
            location.value = '';
            notes.value = '';
        }

        modal.classList.remove('hidden');
        name.focus();
    }

    closeAddEventModal() {
        document.getElementById('addEventModal').classList.add('hidden');
        this.currentEditingEvent = null;
    }

    saveEvent() {
        const name = document.getElementById('eventName').value.trim();
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;
        const location = document.getElementById('eventLocation').value.trim();
        const notes = document.getElementById('eventNotes').value.trim();

        if (!name || !startTime || !endTime) return;

        if (!this.events[this.selectedDate]) {
            this.events[this.selectedDate] = [];
        }

        if (this.currentEditingEvent) {
            this.currentEditingEvent.name = name;
            this.currentEditingEvent.startTime = startTime;
            this.currentEditingEvent.endTime = endTime;
            this.currentEditingEvent.location = location;
            this.currentEditingEvent.notes = notes;
        } else {
            const newEvent = {
                id: Date.now(),
                name: name,
                startTime: startTime,
                endTime: endTime,
                location: location,
                notes: notes
            };
            this.events[this.selectedDate].push(newEvent);
        }

        // 按時間排序
        this.events[this.selectedDate].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });

        this.saveToStorage('events', this.events);
        this.renderEventTimeline();
        this.renderCalendar();
        this.closeAddEventModal();
    }

    deleteEvent(id) {
        if (!this.events[this.selectedDate]) return;

        this.events[this.selectedDate] = this.events[this.selectedDate].filter(e => e.id !== id);
        
        if (this.events[this.selectedDate].length === 0) {
            delete this.events[this.selectedDate];
        }

        this.saveToStorage('events', this.events);
        this.renderEventTimeline();
        this.renderCalendar();
    }
}

// 初始化應用程式
const app = new ProductivityApp();