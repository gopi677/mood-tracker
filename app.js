const MOODS = {
    'A': { label: 'Happy', color: '#4CAF50' },
    'C': { label: 'Okay', color: '#FFEB3B' },
    'F': { label: 'Sad', color: '#E91E63' }
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STORAGE_KEY = 'moodTrackerData';
const NOTES_STORAGE_KEY = 'moodTrackerNotes';

class MoodTracker {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth();
        this.currentView = 'month';
        this.data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        this.notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)) || {};
        this.init();
    }

    init() {
        this.cacheElements();
        this.renderToday();
        this.renderWeekdayHeaders();
        this.renderMonthView();
        this.renderMonthHeaders();
        this.renderGrid();
        this.renderLegend();
        this.renderMoodOptions();
        this.updateStats();
        this.bindEvents();
        this.updateYearTitle();
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    cacheElements() {
        this.elements = {
            yearTitle: document.getElementById('yearTitle'),
            prevYear: document.getElementById('prevYear'),
            nextYear: document.getElementById('nextYear'),
            todayDate: document.getElementById('todayDate'),
            todayMoods: document.getElementById('todayMoods'),
            monthHeaders: document.getElementById('monthHeaders'),
            moodGrid: document.getElementById('moodGrid'),
            statsGrid: document.getElementById('statsGrid'),
            legendGrid: document.getElementById('legendGrid'),
            moodModal: document.getElementById('moodModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalClose: document.getElementById('modalClose'),
            moodOptions: document.getElementById('moodOptions'),
            clearMood: document.getElementById('clearMood'),
            modalNote: document.getElementById('modalNote'),
            todayNote: document.getElementById('todayNote'),
            monthViewBtn: document.getElementById('monthViewBtn'),
            yearViewBtn: document.getElementById('yearViewBtn'),
            monthView: document.getElementById('monthView'),
            yearView: document.getElementById('yearView'),
            monthTitle: document.getElementById('monthTitle'),
            prevMonth: document.getElementById('prevMonth'),
            nextMonth: document.getElementById('nextMonth'),
            weekdayHeaders: document.getElementById('weekdayHeaders'),
            monthGrid: document.getElementById('monthGrid')
        };
    }

    bindEvents() {
        this.elements.prevYear.onclick = () => this.changeYear(-1);
        this.elements.nextYear.onclick = () => this.changeYear(1);
        this.elements.modalClose.onclick = () => this.closeModal();
        this.elements.clearMood.onclick = () => this.setMood(null);
        this.elements.todayNote.oninput = () => this.saveTodayNote();
        this.elements.monthViewBtn.onclick = () => this.switchView('month');
        this.elements.yearViewBtn.onclick = () => this.switchView('year');
        this.elements.prevMonth.onclick = () => this.changeMonth(-1);
        this.elements.nextMonth.onclick = () => this.changeMonth(1);
    }

    getKey(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

    renderToday() {
        const today = new Date();
        this.elements.todayDate.textContent = today.toDateString();
        const key = this.getKey(today.getFullYear(), today.getMonth(), today.getDate());
        this.elements.todayMoods.innerHTML = Object.entries(MOODS).map(([id, info]) => `
            <button class="today-mood-btn ${this.data[key] === id ? 'selected' : ''}" onclick="app.setTodayMood('${id}')">
                <div class="today-mood-color" style="background:${info.color}">${id}</div>
                <div class="today-mood-label">${info.label}</div>
            </button>
        `).join('');
        this.elements.todayNote.value = this.notes[key] || '';
    }

    setTodayMood(id) {
        const today = new Date();
        const key = this.getKey(today.getFullYear(), today.getMonth(), today.getDate());
        this.data[key] = (this.data[key] === id) ? null : id;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.init();
    }

    // Helper functions for grid and PWA logic
    updateYearTitle() { this.elements.yearTitle.textContent = this.currentYear; }
    changeYear(n) { this.currentYear += n; this.init(); }
    switchView(v) { 
        this.currentView = v;
        this.elements.monthView.classList.toggle('hidden', v !== 'month');
        this.elements.yearView.classList.toggle('hidden', v !== 'year');
        this.elements.monthViewBtn.classList.toggle('active', v === 'month');
        this.elements.yearViewBtn.classList.toggle('active', v === 'year');
    }

    renderLegend() {
        this.elements.legendGrid.innerHTML = Object.entries(MOODS).map(([id, info]) => `
            <div class="legend-item">
                <div class="legend-color" style="background:${info.color}">${id}</div>
                <span class="legend-text">${info.label}</span>
            </div>
        `).join('');
    }

    updateStats() {
        const counts = {A:0, C:0, F:0}; let total = 0;
        Object.values(this.data).forEach(m => { if(counts[m]!==undefined) {counts[m]++; total++; }});
        this.elements.statsGrid.innerHTML = Object.entries(MOODS).map(([id, info]) => {
            const pct = total ? ((counts[id]/total)*100).toFixed(1) : 0;
            return `<div class="stat-item"><div class="stat-color" style="background:${info.color}"></div><div class="stat-info"><b>${counts[id]}</b> <small>${pct}%</small></div></div>`;
        }).join('');
    }

    renderWeekdayHeaders() {
        this.elements.weekdayHeaders.innerHTML = ['M','T','W','T','F','S','S'].map(d => `<div class="weekday-header">${d}</div>`).join('');
    }

    renderMonthView() {
        const days = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const start = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const offset = start === 0 ? 6 : start - 1;
        let html = '';
        for(let i=0; i<offset; i++) html += '<div class="month-day empty"></div>';
        for(let d=1; d<=days; d++) {
            const key = this.getKey(this.currentYear, this.currentMonth, d);
            const m = this.data[key] || '';
            html += `<div class="month-day" data-mood="${m}" onclick="app.openModal('${key}', ${d})">${d}</div>`;
        }
        this.elements.monthGrid.innerHTML = html;
        this.elements.monthTitle.textContent = MONTHS[this.currentMonth] + ' ' + this.currentYear;
    }

    openModal(key, d) {
        this.selectedKey = key;
        this.elements.modalTitle.textContent = `${MONTHS[this.currentMonth]} ${d}`;
        this.elements.modalNote.value = this.notes[key] || '';
        this.elements.moodModal.classList.add('active');
    }

    closeModal() {
        this.notes[this.selectedKey] = this.elements.modalNote.value;
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(this.notes));
        this.elements.moodModal.classList.remove('active');
        this.init();
    }

    renderMoodOptions() {
        this.elements.moodOptions.innerHTML = Object.entries(MOODS).map(([id, info]) => `
            <button class="mood-option" onclick="app.setMood('${id}')">
                <div class="mood-option-color" style="background:${info.color}">${id}</div>
                <span>${info.label}</span>
            </button>
        `).join('');
    }

    setMood(id) {
        this.data[this.selectedKey] = id;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.closeModal();
    }
}
const app = new MoodTracker();