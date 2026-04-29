// ========== ДАННЫЕ ==========

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let works = JSON.parse(localStorage.getItem('works')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || [];

// ID работы из URL (?id=123)
const urlParams = new URLSearchParams(window.location.search);
const workId = parseInt(urlParams.get('id'));
let currentWork = null;
let chapters = [];
let currentChapter = 0;

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    // Преобразуем в строку, если это не строка
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
    var date = new Date(dateString);
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
    
    for (var i = 0; i < works.length; i++) {
        if (works[i].id === workId) {
            currentWork = works[i];
            break;
        }
    }
    
    if (!currentWork) {
        alert('Работа не найдена');
        window.location.href = 'index.html';
        return false;
    }
    
    // Загружаем главы
    if (currentWork.chapters && currentWork.chapters.length > 0) {
        chapters = currentWork.chapters;
    } else if (currentWork.content) {
        // Старый формат - одна глава
        var contentText = currentWork.content;
        if (typeof contentText !== 'string') {
            contentText = '';
        }
        chapters = [{ title: 'Глава 1', content: contentText }];
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
    var statusMap = {
        'in-progress': '🔄 В процессе',
        'completed': '✅ Завершено',
        'frozen': '❄️ Заморожено'
    };
    document.getElementById('workStatus').textContent = statusMap[currentWork.status] || '📖 Опубликовано';
    
    // Дата
    if (currentWork.createdAt) {
        document.getElementById('workDate').textContent = '📅 ' + formatDate(currentWork.createdAt);
    }
    
    // Теги
    var tagsContainer = document.getElementById('workTags');
    if (currentWork.tags && currentWork.tags.length > 0) {
        var tagsHtml = '';
        for (var i = 0; i < currentWork.tags.length; i++) {
            tagsHtml += '<span class="tag">#' + escapeHtml(currentWork.tags[i]) + '</span>';
        }
        tagsContainer.innerHTML = tagsHtml;
    } else {
        tagsContainer.innerHTML = '<span class="tag">#фанфик</span>';
    }
    
    // Статистика
    var likesCount = currentWork.likes ? currentWork.likes.length : 0;
    var commentsCount = 0;
    for (var i = 0; i < comments.length; i++) {
        if (comments[i].workId === workId) commentsCount++;
    }
    var chaptersCount = chapters.length;
    
    document.getElementById('likesCount').textContent = likesCount;
    document.getElementById('commentsCount').textContent = commentsCount;
    document.getElementById('commentsCountHeader').textContent = commentsCount;
    document.getElementById('chaptersCount').textContent = chaptersCount > 0 ? chaptersCount : 1;
    
    // Кнопка лайка
    var likeBtn = document.getElementById('likeBtn');
    if (currentUser && currentWork.likes && currentWork.likes.indexOf(currentUser.id) !== -1) {
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
    } else if (chapters.length === 1) {
        document.getElementById('chapterNav').style.display = 'none';
        var contentText = chapters[0].content || '';
        if (typeof contentText !== 'string') {
            contentText = '';
        }
        document.getElementById('workContent').innerHTML = escapeHtml(contentText).replace(/\n/g, '<br>');
    } else {
        document.getElementById('chapterNav').style.display = 'none';
        document.getElementById('workContent').innerHTML = '<p>Содержание отсутствует</p>';
    }
}

function displayChapter(index) {
    if (index < 0 || index >= chapters.length) return;
    
    currentChapter = index;
    var chapter = chapters[index];
    var content = '';
    var chapterTitle = '';
    
    if (chapter) {
        chapterTitle = chapter.title || 'Глава ' + (index + 1);
        content = chapter.content || '';
        if (typeof content !== 'string') {
            content = JSON.stringify(content);
        }
    } else {
        chapterTitle = 'Глава ' + (index + 1);
        content = '';
    }
    
    var contentHtml = '<h3 style="color:#9b62d1; margin-bottom:16px;">' + escapeHtml(chapterTitle) + '</h3>' + escapeHtml(content).replace(/\n/g, '<br>');
    document.getElementById('workContent').innerHTML = contentHtml;
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
    
    var workIndex = -1;
    for (var i = 0; i < works.length; i++) {
        if (works[i].id === workId) {
            workIndex = i;
            break;
        }
    }
    if (workIndex === -1) return;
    
    var likeIndex = -1;
    for (var i = 0; i < works[workIndex].likes.length; i++) {
        if (works[workIndex].likes[i] === currentUser.id) {
            likeIndex = i;
            break;
        }
    }
    
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
    var container = document.getElementById('commentsList');
    var workComments = [];
    for (var i = 0; i < comments.length; i++) {
        if (comments[i].workId === workId) {
            workComments.push(comments[i]);
        }
    }
    workComments.sort(function(a, b) { return a.id - b.id; });
    
    if (workComments.length === 0) {
        container.innerHTML = '<div class="empty-comments">💬 Пока нет комментариев. Будьте первым!</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < workComments.length; i++) {
        var comment = workComments[i];
        html += `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.authorName)}</span>
                    <span class="comment-date">${formatDate(comment.createdAt)}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
        `;
        if (comment.authorId === (currentUser ? currentUser.id : null)) {
            html += `
                <div class="comment-actions">
                    <button class="edit-comment" data-id="${comment.id}">✏️ Редактировать</button>
                    <button class="delete-comment" data-id="${comment.id}">🗑️ Удалить</button>
                </div>
            `;
        }
        html += `</div>`;
    }
    
    container.innerHTML = html;
    
    var editBtns = document.querySelectorAll('.edit-comment');
    for (var i = 0; i < editBtns.length; i++) {
        editBtns[i].addEventListener('click', function(e) {
            var id = parseInt(this.getAttribute('data-id'));
            editComment(id);
        });
    }
    
    var deleteBtns = document.querySelectorAll('.delete-comment');
    for (var i = 0; i < deleteBtns.length; i++) {
        deleteBtns[i].addEventListener('click', function(e) {
            var id = parseInt(this.getAttribute('data-id'));
            deleteComment(id);
        });
    }
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
    
    var newComment = {
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
    displayWorkInfo();
    return true;
}

function editComment(commentId) {
    var comment = null;
    for (var i = 0; i < comments.length; i++) {
        if (comments[i].id === commentId) {
            comment = comments[i];
            break;
        }
    }
    
    if (!comment || comment.authorId !== (currentUser ? currentUser.id : null)) {
        alert('Вы можете редактировать только свои комментарии');
        return;
    }
    
    var newText = prompt('Редактировать комментарий:', comment.text);
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
    var commentIndex = -1;
    for (var i = 0; i < comments.length; i++) {
        if (comments[i].id === commentId) {
            commentIndex = i;
            break;
        }
    }
    if (commentIndex === -1) return;
    
    if (comments[commentIndex].authorId !== (currentUser ? currentUser.id : null)) {
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
    document.getElementById('likeBtn').addEventListener('click', toggleLike);
    
    var prevBtn = document.getElementById('prevChapterBtn');
    var nextBtn = document.getElementById('nextChapterBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            displayChapter(currentChapter - 1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            displayChapter(currentChapter + 1);
        });
    }
    
    var commentForm = document.getElementById('addCommentForm');
    var loginPrompt = document.getElementById('commentsLoginPrompt');
    
    if (currentUser) {
        if (commentForm) commentForm.style.display = 'block';
        if (loginPrompt) loginPrompt.style.display = 'none';
        var submitBtn = document.getElementById('submitCommentBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                var textarea = document.getElementById('newCommentText');
                if (textarea) addComment(textarea.value);
            });
        }
    } else {
        if (commentForm) commentForm.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
        var loginLink = document.getElementById('loginFromCommentsBtn');
        if (loginLink) {
            loginLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'index.html';
            });
        }
    }
    
    var authorLink = document.getElementById('authorLink');
    if (authorLink && currentWork) {
        authorLink.textContent = currentWork.authorName || 'Автор';
        authorLink.href = '#';
        authorLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Страница автора "' + (currentWork.authorName || 'Автор') + '" в разработке');
        });
    }
}

// ========== ЗАПУСК ==========

function init() {
    if (!loadWork()) return;
    displayWorkInfo();
    renderComments();
    setupUI();

init();
