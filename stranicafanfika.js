// ========== ДАННЫЕ ==========

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let works = JSON.parse(localStorage.getItem('works')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || [];

// ID работы из URL (?id=123)
const urlParams = new URLSearchParams(window.location.search);
const workId = parseInt(urlParams.get('id'));
let currentWork = null;

// Для многоглавности
let currentChapter = 0;
let chapters = [];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function escapeHtml(str) {
    if (!str) return '';
    var string = String(str);
    return string.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function formatDate(dateString) {
    if (!dateString) return 'недавно';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function saveAllData() {
    localStorage.setItem('works', JSON.stringify(works));
    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// ========== ЗАГРУЗКА ДАННЫХ РАБОТЫ ==========

function loadWork() {
    if (!workId) {
        alert('Работа не найдена');
        window.location.href = 'index.html';
        return false;
    }
    
    currentWork = works.find(w => w.id === workId);
    if (!currentWork) {
        alert('Работа не найдена');
        window.location.href = 'index.html';
        return false;
    }
    
    // Загружаем главы (новый формат) или старый формат с content
    if (currentWork.chapters && currentWork.chapters.length > 0) {
        chapters = currentWork.chapters;
    } else if (currentWork.content) {
        chapters = [{ title: 'Глава 1', content: currentWork.content }];
    } else {
        chapters = [];
    }
    
    return true;
}

// ========== ОТОБРАЖЕНИЕ ИНФОРМАЦИИ О РАБОТЕ ==========

function displayWorkInfo() {
    if (!currentWork) return;
    
    document.title = (currentWork.title || 'Без названия') + ' — Ram-bleee';
    document.getElementById('workTitleBreadcrumb').textContent = currentWork.title || 'Без названия';
    document.getElementById('workTitle').textContent = currentWork.title || 'Без названия';
    document.getElementById('authorName').innerHTML = '👤 ' + escapeHtml(currentWork.authorName || 'Автор');
    document.getElementById('workGenre').textContent = currentWork.genre || 'Без жанра';
    document.getElementById('workDescription').innerHTML = escapeHtml(currentWork.description || '').replace(/\n/g, '<br>');
    
    // Статус
    const statusMap = {
        'in-progress': '🔄 В процессе',
        'completed': '✅ Завершено',
        'frozen': '❄️ Заморожено'
    };
    document.getElementById('workStatus').textContent = statusMap[currentWork.status] || '📖 Опубликовано';
    
    // Дата
    if (currentWork.createdAt) {
        document.getElementById('workDate').textContent = `📅 ${formatDate(currentWork.createdAt)}`;
    }
    
    // Теги
    const tagsContainer = document.getElementById('workTags');
    if (currentWork.tags && currentWork.tags.length > 0) {
        tagsContainer.innerHTML = currentWork.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
    } else {
        tagsContainer.innerHTML = '<span class="tag">#фанфик</span>';
    }
    
    
    // Статистика
    const likesCount = currentWork.likes ? currentWork.likes.length : 0;
    const commentsCount = comments.filter(c => c.workId === workId).length;
    const chaptersCount = chapters.length;
    
    document.getElementById('likesCount').textContent = likesCount;
    document.getElementById('commentsCount').textContent = commentsCount;
    document.getElementById('commentsCountHeader').textContent = commentsCount;
    document.getElementById('chaptersCount').textContent = chaptersCount;
    
    // Кнопка лайка
    const likeBtn = document.getElementById('likeBtn');
    if (currentUser && currentWork.likes && currentWork.likes.includes(currentUser.id)) {
        likeBtn.textContent = '❤️ Лайкнуть (❤️)';
        likeBtn.classList.add('liked');
    } else {
        likeBtn.textContent = '❤️ Лайкнуть';
        likeBtn.classList.remove('liked');
    }
    
    // Навигация по главам
    if (chapters.length > 1) {
        document.getElementById('chapterNav').style.display = 'flex';
        displayChapter(0);
    } else {
        document.getElementById('chapterNav').style.display = 'none';
        document.getElementById('workContent').innerHTML = escapeHtml(chapters[0] || '').replace(/\n/g, '<br>');
    }
}

function displayChapter(index) {
    if (index < 0 || index >= chapters.length) return;
    
    currentChapter = index;
    var chapter = chapters[index];
    var content = chapter ? chapter.content : '';
    var chapterTitle = chapter ? chapter.title : 'Глава ' + (index + 1);
    
    document.getElementById('workContent').innerHTML = '<h3 style="color:#9b62d1; margin-bottom:16px;">' + escapeHtml(chapterTitle) + '</h3>' + escapeHtml(content).replace(/\n/g, '<br>');
    document.getElementById('chapterIndicator').textContent = chapterTitle + ' (' + (index + 1) + ' из ' + chapters.length + ')';
    
    var prevBtn = document.getElementById('prevChapterBtn');
    var nextBtn = document.getElementById('nextChapterBtn');
    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) nextBtn.disabled = (index === chapters.length - 1);
}

// ========== ЛАЙКИ ==========

function toggleLike() {
    if (!currentUser) {
        alert('⚠️ Чтобы поставить лайк, нужно войти в аккаунт!');
        window.location.href = 'index.html';
        return;
    }
    
    const workIndex = works.findIndex(w => w.id === workId);
    if (workIndex === -1) return;
    
    const likeIndex = works[workIndex].likes.indexOf(currentUser.id);
    if (likeIndex === -1) {
        works[workIndex].likes.push(currentUser.id);
        alert('❤️ Лайк поставлен');
    } else {
        works[workIndex].likes.splice(likeIndex, 1);
        alert('💔 Лайк убран');
    }
    
    saveAllData();
    currentWork = works[workIndex];
    displayWorkInfo();
}

// ========== КОММЕНТАРИИ ==========

function renderComments() {
    const container = document.getElementById('commentsList');
    const workComments = comments.filter(c => c.workId === workId).sort((a, b) => a.id - b.id);
    
    if (workComments.length === 0) {
        container.innerHTML = '<div class="empty-comments">💬 Пока нет комментариев. Будьте первым!</div>';
        return;
    }
    
    container.innerHTML = workComments.map(comment => `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.authorName)}</span>
                <span class="comment-date">${formatDate(comment.createdAt)}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            ${comment.authorId === currentUser?.id ? `
                <div class="comment-actions">
                    <button class="edit-comment" data-id="${comment.id}">✏️ Редактировать</button>
                    <button class="delete-comment" data-id="${comment.id}">🗑️ Удалить</button>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Обработчики для редактирования/удаления
    document.querySelectorAll('.edit-comment').forEach(btn => {
        btn.addEventListener('click', () => editComment(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.delete-comment').forEach(btn => {
        btn.addEventListener('click', () => deleteComment(parseInt(btn.dataset.id)));
    });
}

function addComment(text) {
    if (!currentUser) {
        alert('⚠️ Чтобы оставить комментарий, нужно войти в аккаунт!');
        return false;
    }
    
    if (!text.trim()) {
        alert('Напишите текст комментария');
        return false;
    }
    
    const newComment = {
        id: Date.now(),
        workId: workId,
        authorId: currentUser.id,
        authorName: currentUser.username,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        editedAt: null,
        isEdited: false
    };
    
    comments.push(newComment);
    saveAllData();
    document.getElementById('newCommentText').value = '';
    renderComments();
    displayWorkInfo(); // обновляем счётчик комментариев
    return true;
}

function editComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment || comment.authorId !== currentUser?.id) {
        alert('Вы можете редактировать только свои комментарии');
        return;
    }
    
    const newText = prompt('Редактировать комментарий:', comment.text);
    if (newText && newText.trim()) {
        comment.text = newText.trim();
        comment.editedAt = new Date().toISOString();
        comment.isEdited = true;
        saveAllData();
        renderComments();
        alert('✏️ Комментарий отредактирован');
    }
}

function deleteComment(commentId) {
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    if (comments[commentIndex].authorId !== currentUser?.id) {
        alert('Вы можете удалять только свои комментарии');
        return;
    }
    
    if (confirm('🗑️ Удалить комментарий?')) {
        comments.splice(commentIndex, 1);
        saveAllData();
        renderComments();
        displayWorkInfo();
        alert('Комментарий удалён');
    }
}

// ========== НАСТРОЙКА ИНТЕРФЕЙСА ==========

function setupUI() {
    // Кнопка лайка
    document.getElementById('likeBtn').addEventListener('click', toggleLike);
    
    // Кнопки навигации по главам
    const prevBtn = document.getElementById('prevChapterBtn');
    const nextBtn = document.getElementById('nextChapterBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => displayChapter(currentChapter - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => displayChapter(currentChapter + 1));
    
    // Форма добавления комментария
    const commentForm = document.getElementById('addCommentForm');
    const loginPrompt = document.getElementById('commentsLoginPrompt');
    
    if (currentUser) {
        commentForm.style.display = 'block';
        loginPrompt.style.display = 'none';
        document.getElementById('submitCommentBtn').addEventListener('click', () => {
            const text = document.getElementById('newCommentText').value;
            addComment(text);
        });
    } else {
        commentForm.style.display = 'none';
        loginPrompt.style.display = 'block';
        document.getElementById('loginFromCommentsBtn').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
    
    // Ссылка на автора (в хлебных крошках)
    const authorLink = document.getElementById('authorLink');
    if (authorLink) {
        authorLink.textContent = currentWork.authorName;
        authorLink.href = '#';
        authorLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`Страница автора "${currentWork.authorName}" в разработке`);
        });
    }
}

// ========== ЗАПУСК ==========

function init() {
    if (!loadWork()) return;
    displayWorkInfo();
    renderComments();
    setupUI();
}

init();
