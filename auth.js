// ========== АВТОРИЗАЦИЯ (через localStorage) ==========

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let works = JSON.parse(localStorage.getItem('works')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || [];

function saveAllData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('works', JSON.stringify(works));
    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// ========== МОДАЛЬНОЕ ОКНО ==========

function openModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ========== UI АВТОРИЗАЦИИ ==========

function updateAuthUI() {
    const authContainer = document.querySelector('.auth-container');
    if (!authContainer) return;
    
    if (currentUser) {
        authContainer.innerHTML = `
            <div class="user-dropdown">
                <button class="btn-user">${currentUser.username} 👤</button>
                <div class="dropdown-menu">
                    <a href="#" class="dropdown-item" id="myProfileBtn">Мой профиль</a>
                    <a href="#" class="dropdown-item" id="myWorksBtn">Мои работы</a>
                    <a href="#" class="dropdown-item" id="draftsBtn">Черновики</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-item" id="logoutBtn">Выйти</a>
                </div>
            </div>
        `;

        document.getElementById('myProfileBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
        
        document.getElementById('myWorksBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'myworks.html';
        });
        
        document.getElementById('draftsBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'drafts.html';
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateAuthUI();
            location.reload();
        });
        
    } else {
        authContainer.innerHTML = '<button class="btn-login" id="openModalBtn">Войти</button>';
        document.getElementById('openModalBtn')?.addEventListener('click', openModal);
    }
}

// ========== РЕГИСТРАЦИЯ И ВХОД ==========

function register(username, email, password) {
    if (users.find(u => u.email === email)) {
        alert('Пользователь с таким email уже существует');
        return false;
    }
    if (users.find(u => u.username === username)) {
        alert('Пользователь с таким именем уже существует');
        return false;
    }
    
    const newUser = { id: Date.now(), username, email, password, registeredAt: new Date().toISOString() };
    users.push(newUser);
    currentUser = newUser;
    saveAllData();
    alert(`Добро пожаловать, ${username}!`);
    updateAuthUI();
    closeModal();
    location.reload();
    return true;
}

function login(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        alert('Неверный email или пароль');
        return false;
    }
    currentUser = user;
    saveAllData();
    alert(`С возвращением, ${user.username}!`);
    updateAuthUI();
    closeModal();
    location.reload();
    return true;
}

function requireAuth(actionName) {
    if (!currentUser) {
        alert(`⚠️ Чтобы ${actionName}, нужно войти в аккаунт!`);
        openModal();
        return false;
    }
    return true;
}

// ========== РАБОТА С ФФ ==========

function addWork(title, description, genre) {
    if (!requireAuth('добавить работу')) return false;
    
    works.push({
        id: Date.now(),
        title, description, genre,
        authorId: currentUser.id,
        authorName: currentUser.username,
        likes: [],
        createdAt: new Date().toISOString(),
        chapters: 1
    });
    saveAllData();
    alert('Работа успешно добавлена!');
    renderWorks();
    return true;
}

function toggleLike(workId) {
    if (!requireAuth('поставить лайк')) return false;
    const work = works.find(w => w.id == workId);
    if (!work) return false;
    
    const likeIndex = work.likes.indexOf(currentUser.id);
    if (likeIndex === -1) {
        work.likes.push(currentUser.id);
        alert('❤️ Лайк поставлен');
    } else {
        work.likes.splice(likeIndex, 1);
        alert('💔 Лайк убран');
    }
    saveAllData();
    renderWorks();
    return true;
}

function addComment(workId, text) {
    if (!requireAuth('оставить комментарий')) return false;
    if (!text.trim()) return alert('Напишите текст комментария');
    
    comments.push({
        id: Date.now(),
        workId,
        authorId: currentUser.id,
        authorName: currentUser.username,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        editedAt: null,
        isEdited: false
    });
    saveAllData();
    alert('Комментарий добавлен!');
    
    // Обновляем открытое модальное окно, если оно есть
    const openModal = document.querySelector('.modal-overlay[data-work-id="' + workId + '"]');
    if (openModal) {
        refreshCommentsModal(workId, openModal);
    }
    renderWorks();
    return true;
}

// ========== ОТРИСОВКА ==========

function renderWorks() {
    const storiesFeed = document.querySelector('.stories-feed');
    if (!storiesFeed) return;
    
    if (works.length === 0) {
        storiesFeed.innerHTML = `<div class="empty-message">📖 Пока нет ни одной истории. Добавьте первую!</div>`;
        return;
    }
    
    storiesFeed.innerHTML = works.map(work => {
        // Правильно определяем количество глав
        let chaptersCount = 1;
        if (work.chaptersCount) {
            chaptersCount = work.chaptersCount;
        } else if (work.chapters && Array.isArray(work.chapters)) {
            chaptersCount = work.chapters.length;
        } else if (typeof work.chapters === 'number') {
            chaptersCount = work.chapters;
        }
        
        return `
        <div class="story-card" data-work-id="${work.id}">
            <a href="stranicafanfika.html?id=${work.id}" style="text-decoration: none; color: inherit;">
                <div class="card-content">
                    <div class="work-title">${escapeHtml(work.title)}</div>
                    <div class="work-author">от <strong>${escapeHtml(work.authorName)}</strong> • ${escapeHtml(work.genre || 'Без жанра')}</div>
                    <div class="work-preview">${escapeHtml((work.description || '').substring(0, 100))}${(work.description || '').length > 100 ? '...' : ''}</div>
                    <div class="work-stats">
                        <span class="like-btn" data-id="${work.id}" style="cursor:pointer;">❤️ ${work.likes ? work.likes.length : 0}</span>
                        <span class="comment-btn" data-id="${work.id}" style="cursor:pointer;">💬 ${comments.filter(c => c.workId == work.id).length}</span>
                        <span>📖 ${chaptersCount} ${getChapterWord(chaptersCount)}</span>
                    </div>
                </div>
            </a>
        </div>
    `}).join('');
    
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleLike(btn.dataset.id);
        });
    });
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showCommentsModal(btn.dataset.id);
        });
    });
}

// Вспомогательная функция для склонения слова "глава"
function getChapterWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'глава';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'главы';
    return 'глав';
}

function showCommentsModal(workId) {
    const work = works.find(w => w.id == workId);
    if (!work) return;
    
    const workComments = comments.filter(c => c.workId == workId);
    
    let commentsHtml = workComments.map(c => `
        <div class="comment-item" data-comment-id="${c.id}" style="padding:12px 0; border-bottom:1px solid #f0e6ff;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                <div>
                    <strong>${escapeHtml(c.authorName)}</strong>
                    <span style="font-size:0.65rem; color:#b89bd4; margin-left:10px;">${new Date(c.createdAt).toLocaleString()}</span>
                    ${c.isEdited ? '<span style="font-size:0.6rem; color:#aaa; margin-left:8px;">(ред.)</span>' : ''}
                </div>
                ${c.authorId === currentUser?.id ? `
                    <div class="comment-actions" style="display:flex; gap:8px;">
                        <button class="edit-comment-btn" data-id="${c.id}" style="background:none; border:none; cursor:pointer; color:#9b62d1; font-size:0.8rem;">✏️</button>
                        <button class="delete-comment-btn" data-id="${c.id}" style="background:none; border:none; cursor:pointer; color:#e085b0; font-size:0.8rem;">🗑️</button>
                    </div>
                ` : ''}
            </div>
            <p class="comment-text" style="margin-top:6px; color:#4a3a55;">${escapeHtml(c.text)}</p>
        </div>
    `).join('');
    
    if (workComments.length === 0) {
        commentsHtml = '<div style="padding:20px; text-align:center; color:#b89bd4;">Пока нет комментариев. Будьте первым!</div>';
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex; opacity:1; visibility:visible;';
    modal.dataset.workId = workId;
    modal.innerHTML = `
        <div class="modal" style="max-width:550px;">
            <div class="modal-header">
                <h3>💬 Комментарии: ${escapeHtml(work.title)}</h3>
                <button class="close-modal" style="background:#f0e6ff;">✕</button>
            </div>
            <div class="comments-container" style="max-height:350px; overflow:auto; padding:20px;">
                ${commentsHtml}
            </div>
            <div style="padding:20px; border-top:1px solid #eddfff;">
                <textarea id="newCommentText" rows="3" style="width:100%; padding:12px; border-radius:24px; border:1px solid #e5d5fe; font-family:inherit; resize:vertical;" placeholder="Написать комментарий..."></textarea>
                <button id="submitCommentBtn" class="submit-btn" style="margin-top:12px;">Отправить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    // Обработчики для кнопок редактирования/удаления
    modal.querySelectorAll('.edit-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditCommentModal(parseInt(btn.dataset.id), workId));
    });
    modal.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Удалить комментарий?')) {
                deleteComment(parseInt(btn.dataset.id));
            }
        });
    });
    
    const submitBtn = modal.querySelector('#submitCommentBtn');
    const textarea = modal.querySelector('#newCommentText');
    submitBtn.onclick = () => {
        const text = textarea.value;
        if (addComment(workId, text)) {
            refreshCommentsModal(workId, modal);
            textarea.value = '';
        }
    };
}

// ========== КНОПКА ДОБАВЛЕНИЯ РАБОТЫ ==========

function addAddWorkButton() {
    const feedHeader = document.querySelector('.feed-header');
    if (feedHeader && !document.getElementById('addWorkBtn')) {
        const btn = document.createElement('button');
        btn.id = 'addWorkBtn';
        btn.textContent = '➕ Добавить историю';
        btn.className = 'btn-login';
        btn.style.background = 'linear-gradient(135deg, #a07ac9, #8b62b3)';
        btn.onclick = () => {
            if (requireAuth('добавить работу')) {
                window.location.href = 'созданиеработы.html';
            }
        };
        feedHeader.appendChild(btn);
    }
}

// ========== НАСТРОЙКА МОДАЛЬНЫХ ОКОН ==========

function setupModalEvents() {
    const modalOverlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('closeModalBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    
    const showLogin = () => {
        loginForm?.classList.remove('hidden-form');
        registerForm?.classList.add('hidden-form');
        tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === 'login'));
    };
    const showRegister = () => {
        loginForm?.classList.add('hidden-form');
        registerForm?.classList.remove('hidden-form');
        tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === 'register'));
    };
    
    tabBtns.forEach(btn => btn.addEventListener('click', () => btn.dataset.tab === 'login' ? showLogin() : showRegister()));
    switchToRegister?.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
    switchToLogin?.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
    closeBtn?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOverlay?.classList.contains('active')) closeModal(); });
    document.querySelector('.modal')?.addEventListener('click', (e) => e.stopPropagation());
    
    // Обработчики кнопок входа/регистрации
    document.getElementById('submitLoginBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value.trim();
        const pwd = document.getElementById('loginPassword')?.value.trim();
        if (email && pwd) login(email, pwd);
        else alert('Заполните все поля');
    });
    
    document.getElementById('submitRegisterBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.getElementById('regUsername')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const pwd = document.getElementById('regPassword')?.value.trim();
        if (!name || !email || !pwd) alert('Заполните все поля');
        else if (pwd.length < 6) alert('Пароль минимум 6 символов');
        else register(name, email, pwd);
    });
    
    // Очистка полей при открытии
    const openModalBtn = document.getElementById('openModalBtn');
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            ['loginEmail', 'loginPassword', 'regUsername', 'regEmail', 'regPassword'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            showLogin();
        });
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function getRandomEmoji() {
    const emojis = ['🌙✨', '🌸🎐', '🍓🍰', '🦋🔮', '🎭🌆', '🏰⚔️', '📖💜', '✨💕'];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// ========== РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ КОММЕНТАРИЕВ ==========

function editComment(commentId, newText) {
    if (!requireAuth('редактировать комментарий')) return false;
    if (!newText.trim()) {
        alert('Нельзя оставить пустой комментарий');
        return false;
    }
    
    const comment = comments.find(c => c.id == commentId);
    if (!comment) {
        alert('Комментарий не найден');
        return false;
    }
    
    // Проверяем, что автор комментария — текущий пользователь
    if (comment.authorId !== currentUser.id) {
        alert('Вы можете редактировать только свои комментарии');
        return false;
    }
    
    comment.text = newText.trim();
    comment.editedAt = new Date().toISOString();
    comment.isEdited = true;
    saveAllData();
    alert('✏️ Комментарий отредактирован');
    
    // Перерисовываем все открытые модальные окна комментариев
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (modal.innerHTML.includes('newCommentText')) {
            const workId = modal.dataset.workId;
            if (workId) refreshCommentsModal(workId, modal);
        }
    });
    renderWorks(); // перерисовываем главную ленту для обновления количества комментариев
    return true;
}

function deleteComment(commentId) {
    if (!requireAuth('удалить комментарий')) return false;
    
    const commentIndex = comments.findIndex(c => c.id == commentId);
    if (commentIndex === -1) {
        alert('Комментарий не найден');
        return false;
    }
    
    const comment = comments[commentIndex];
    if (comment.authorId !== currentUser.id) {
        alert('Вы можете удалять только свои комментарии');
        return false;
    }
    
    if (confirm('🗑️ Вы уверены, что хотите удалить этот комментарий?')) {
        comments.splice(commentIndex, 1);
        saveAllData();
        alert('Комментарий удалён');
        
        // Обновляем все открытые модальные окна
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            if (modal.innerHTML.includes('newCommentText')) {
                const workId = modal.dataset.workId;
                if (workId) refreshCommentsModal(workId, modal);
            }
        });
        renderWorks();
        return true;
    }
    return false;
}

// Обновление модального окна комментариев в реальном времени
function refreshCommentsModal(workId, modalElement) {
    const work = works.find(w => w.id == workId);
    if (!work) return;
    
    const workComments = comments.filter(c => c.workId == workId);
    
    const commentsContainer = modalElement.querySelector('.comments-container');
    if (commentsContainer) {
        commentsContainer.innerHTML = workComments.map(c => `
            <div class="comment-item" data-comment-id="${c.id}" style="padding:12px 0; border-bottom:1px solid #f0e6ff; position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                    <div>
                        <strong>${escapeHtml(c.authorName)}</strong>
                        <span style="font-size:0.65rem; color:#b89bd4; margin-left:10px;">${new Date(c.createdAt).toLocaleString()}</span>
                        ${c.isEdited ? '<span style="font-size:0.6rem; color:#aaa; margin-left:8px;">(ред.)</span>' : ''}
                    </div>
                    ${c.authorId === currentUser?.id ? `
                        <div class="comment-actions" style="display:flex; gap:8px;">
                            <button class="edit-comment-btn" data-id="${c.id}" style="background:none; border:none; cursor:pointer; color:#9b62d1; font-size:0.8rem;">✏️</button>
                            <button class="delete-comment-btn" data-id="${c.id}" style="background:none; border:none; cursor:pointer; color:#e085b0; font-size:0.8rem;">🗑️</button>
                        </div>
                    ` : ''}
                </div>
                <p class="comment-text" style="margin-top:6px; color:#4a3a55;">${escapeHtml(c.text)}</p>
            </div>
        `).join('');
        
        if (workComments.length === 0) {
            commentsContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#b89bd4;">Пока нет комментариев. Будьте первым!</div>';
        }
        
        // Навешиваем обработчики на кнопки редактирования/удаления
        modalElement.querySelectorAll('.edit-comment-btn').forEach(btn => {
            btn.addEventListener('click', () => showEditCommentModal(parseInt(btn.dataset.id), workId));
        });
        modalElement.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Удалить комментарий?')) {
                    deleteComment(parseInt(btn.dataset.id));
                }
            });
        });
    }
}

// Модальное окно для редактирования комментария
function showEditCommentModal(commentId, workId) {
    const comment = comments.find(c => c.id == commentId);
    if (!comment) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex; opacity:1; visibility:visible;';
    modal.innerHTML = `
        <div class="modal" style="max-width:450px;">
            <div class="modal-header">
                <h3>✏️ Редактировать комментарий</h3>
                <button class="close-modal" style="background:#f0e6ff;">✕</button>
            </div>
            <div style="padding:20px;">
                <textarea id="editCommentText" rows="4" style="width:100%; padding:12px; border-radius:24px; border:1px solid #e5d5fe; font-family:inherit;">${escapeHtml(comment.text)}</textarea>
                <div style="display:flex; gap:12px; margin-top:16px; justify-content:flex-end;">
                    <button id="cancelEditBtn" class="btn-secondary">Отмена</button>
                    <button id="saveEditBtn" class="btn-primary">Сохранить</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    const cancelBtn = modal.querySelector('#cancelEditBtn');
    cancelBtn.onclick = () => modal.remove();
    
    const saveBtn = modal.querySelector('#saveEditBtn');
    const textarea = modal.querySelector('#editCommentText');
    saveBtn.onclick = () => {
        const newText = textarea.value.trim();
        if (!newText) {
            alert('Комментарий не может быть пустым');
            return;
        }
        editComment(commentId, newText);
        modal.remove();
    };
}

// ========== ЗАПУСК ==========

function init() {
    updateAuthUI();
    addAddWorkButton();
    renderWorks();
    setupModalEvents();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}