// ========== ЗАГРУЗКА ДАННЫХ ==========

var urlParams = new URLSearchParams(window.location.search);
var workId = parseInt(urlParams.get('id'));
var currentWork = null;
var chapters = [];

// ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========

function checkAuth() {
    var authStatus = document.getElementById('editorAuthStatus');
    
    if (!currentUser) {
        if (authStatus) {
            authStatus.innerHTML = '<span style="color:#e085b0;">⚠️ Вы не авторизованы. <a href="index.html" style="color:#b07ad9;">Войдите</a> чтобы редактировать</span>';
        }
        var saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
        }
        return false;
    } else {
        if (authStatus) {
            authStatus.innerHTML = '<span>✓ Вы вошли как <strong>' + currentUser.username + '</strong></span>';
        }
        return true;
    }
}

function loadWork() {
    if (!workId) {
        alert('Работа не найдена');
        window.location.href = 'profile.html';
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
        window.location.href = 'profile.html';
        return false;
    }
    
    if (currentWork.authorId !== currentUser.id) {
        alert('Вы можете редактировать только свои работы');
        window.location.href = 'profile.html';
        return false;
    }
    
    // Загружаем главы
    if (currentWork.chapters && currentWork.chapters.length > 0) {
        chapters = JSON.parse(JSON.stringify(currentWork.chapters));
    } else if (currentWork.content) {
        chapters = [{ title: 'Глава 1', content: currentWork.content }];
    } else {
        chapters = [];
    }
    
    return true;
}

function fillForm() {
    document.getElementById('workTitle').value = currentWork.title || '';
    document.getElementById('workGenre').value = currentWork.genre || '';
    document.getElementById('workStatus').value = currentWork.status || 'in-progress';
    document.getElementById('workTags').value = currentWork.tags ? currentWork.tags.join(', ') : '';
    document.getElementById('workDescription').value = currentWork.description || '';
    
    var descCounter = document.getElementById('descCounter');
    if (descCounter && currentWork.description) {
        descCounter.textContent = currentWork.description.length + ' / 500';
    }
    
    renderChaptersList();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderChaptersList() {
    var container = document.getElementById('chaptersList');
    if (!container) return;
    
    if (chapters.length === 0) {
        container.innerHTML = '<div class="empty-chapters">📖 Пока нет глав. Нажмите «+ Добавить главу»</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < chapters.length; i++) {
        var chapter = chapters[i];
        var preview = chapter.content ? chapter.content.substring(0, 80) : '';
        if (preview.length > 80) preview = preview + '...';
        
        html += `
            <div class="chapter-item" data-index="${i}">
                <div class="chapter-info">
                    <div class="chapter-title">📖 ${escapeHtml(chapter.title || 'Без названия')}</div>
                    <div class="chapter-preview">${escapeHtml(preview) || '(пустая глава)'}</div>
                </div>
                <div class="chapter-actions">
                    <button class="edit-chapter-btn" data-index="${i}" title="Редактировать главу">✏️</button>
                    <button class="delete-chapter-btn" data-index="${i}" title="Удалить главу">🗑️</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Обработчик клика по всей главе (открытие редактора)
    document.querySelectorAll('.chapter-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            // Не срабатываем, если клик по кнопкам
            if (e.target.classList.contains('edit-chapter-btn') || e.target.classList.contains('delete-chapter-btn')) {
                return;
            }
            var index = parseInt(this.getAttribute('data-index'));
            openChapterEditor(index);
        });
    });
    
    // Обработчик кнопки редактирования
    document.querySelectorAll('.edit-chapter-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var index = parseInt(this.getAttribute('data-index'));
            openChapterEditor(index);
        });
    });
    
    // Обработчик кнопки удаления
    document.querySelectorAll('.delete-chapter-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var index = parseInt(this.getAttribute('data-index'));
            if (confirm('Удалить главу "' + chapters[index].title + '"? Это действие нельзя отменить.')) {
                chapters.splice(index, 1);
                // Перенумеровываем главы
                for (var i = 0; i < chapters.length; i++) {
                    chapters[i].title = 'Глава ' + (i + 1);
                }
                renderChaptersList();
            }
        });
    });
}

function addChapter() {
    var newIndex = chapters.length + 1;
    chapters.push({
        title: 'Глава ' + newIndex,
        content: ''
    });
    renderChaptersList();
    openChapterEditor(chapters.length - 1);
}

function openChapterEditor(index) {
    var chapter = chapters[index];
    
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex; opacity:1; visibility:visible; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(46,36,54,0.7); backdrop-filter:blur(5px); align-items:center; justify-content:center; z-index:1001;';
    modal.innerHTML = `
        <div style="background:white; border-radius:48px; max-width:700px; width:90%; max-height:80vh; overflow:hidden; display:flex; flex-direction:column;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 28px 12px 28px; border-bottom:1px solid #eddfff;">
                <h3 style="font-size:1.4rem; font-weight:700; background:linear-gradient(125deg,#9f7bc9,#b388eb); background-clip:text; -webkit-background-clip:text; color:transparent;">✏️ Редактировать главу ${index + 1}</h3>
                <button class="close-modal" style="background:#f0e6ff; border:none; font-size:1.8rem; cursor:pointer; color:#9b75c7; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>
            <div style="padding:20px; overflow-y:auto; flex:1;">
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#5a3c74;">Название главы</label>
                    <input type="text" id="chapterTitle" value="${escapeHtml(chapter.title)}" style="width:100%; padding:12px; border-radius:20px; border:1px solid #e5d5fe; font-size:0.95rem;">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#5a3c74;">Содержание главы</label>
                    <textarea id="chapterContent" rows="12" style="width:100%; padding:12px; border-radius:20px; border:1px solid #e5d5fe; font-family:inherit; font-size:0.95rem; resize:vertical;">${escapeHtml(chapter.content)}</textarea>
                </div>
            </div>
            <div style="padding:16px 20px 20px 20px; border-top:1px solid #f0e6ff; display:flex; gap:12px; justify-content:flex-end;">
                <button id="cancelChapterBtn" class="btn-secondary">Отмена</button>
                <button id="saveChapterBtn" class="btn-primary">Сохранить главу</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    var closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = function() { modal.remove(); };
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    
    var cancelBtn = modal.querySelector('#cancelChapterBtn');
    cancelBtn.onclick = function() { modal.remove(); };
    
    var saveBtn = modal.querySelector('#saveChapterBtn');
    saveBtn.onclick = function() {
        var newTitle = modal.querySelector('#chapterTitle').value.trim();
        var newContent = modal.querySelector('#chapterContent').value;
        if (!newTitle) {
            alert('Введите название главы');
            return;
        }
        chapters[index].title = newTitle;
        chapters[index].content = newContent;
        renderChaptersList();
        modal.remove();
    };
}

function saveWork(title, genre, status, tags, description) {
    if (!currentUser) return false;
    if (!currentWork) return false;
    
    currentWork.title = title;
    currentWork.genre = genre;
    currentWork.status = status;
    currentWork.tags = tags ? tags.split(',').map(function(t) { return t.trim(); }) : [];
    currentWork.description = description;
    currentWork.chapters = chapters;
    currentWork.chaptersCount = chapters.length;
    currentWork.updatedAt = new Date().toISOString();
    
    // Для обратной совместимости
    if (chapters.length > 0) {
        currentWork.content = chapters[0].content;
    }
    
    localStorage.setItem('works', JSON.stringify(works));
    return true;
}

function setupForm() {
    var form = document.getElementById('editForm');
    if (!form) return;
    
    var cancelBtn = document.getElementById('cancelBtn');
    var descTextarea = document.getElementById('workDescription');
    var descCounter = document.getElementById('descCounter');
    var addChapterBtn = document.getElementById('addChapterBtn');
    
    if (descTextarea && descCounter) {
        descTextarea.addEventListener('input', function() {
            descCounter.textContent = descTextarea.value.length + ' / 500';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Вы уверены? Несохранённые изменения будут потеряны.')) {
                window.location.href = 'profile.html';
            }
        });
    }
    
    if (addChapterBtn) {
        addChapterBtn.addEventListener('click', addChapter);
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('⚠️ Чтобы редактировать историю, нужно войти в аккаунт!');
            window.location.href = 'index.html';
            return;
        }
        
        var title = document.getElementById('workTitle').value.trim();
        var genre = document.getElementById('workGenre').value.trim();
        var status = document.getElementById('workStatus').value;
        var tags = document.getElementById('workTags').value;
        var description = document.getElementById('workDescription').value.trim();
        
        if (!title) {
            alert('Пожалуйста, введите название работы');
            return;
        }
        
        if (!description) {
            alert('Пожалуйста, напишите описание/аннотацию');
            return;
        }
        
        saveWork(title, genre, status, tags, description);
        alert('✅ Изменения сохранены! Количество глав: ' + chapters.length);
        window.location.href = 'profile.html';
    });
}

function init() {
    if (!checkAuth()) return;
    if (!loadWork()) return;
    fillForm();
    setupForm();
}

document.addEventListener('DOMContentLoaded', init);