// ========== ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ==========

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let works = JSON.parse(localStorage.getItem('works')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || [];

// ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========

function checkAuth() {
    if (!currentUser) {
        alert('⚠️ Чтобы просматривать профиль, нужно войти в аккаунт!');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
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
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('works', JSON.stringify(works));
    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// ========== ПОДСЧЁТ СТАТИСТИКИ ==========

function getUserWorksCount() {
    var count = 0;
    for (var i = 0; i < works.length; i++) {
        if (works[i].authorId === currentUser.id) count++;
    }
    return count;
}

function getUserTotalLikes() {
    var total = 0;
    for (var i = 0; i < works.length; i++) {
        if (works[i].authorId === currentUser.id && works[i].likes) {
            total += works[i].likes.length;
        }
    }
    return total;
}

function getUserTotalComments() {
    var count = 0;
    for (var i = 0; i < comments.length; i++) {
        if (comments[i].authorId === currentUser.id) count++;
    }
    return count;
}

// ========== ЗАПОЛНЕНИЕ ИНФОРМАЦИИ ПРОФИЛЯ ==========

function fillProfileInfo() {
    var usernameEl = document.getElementById('profileUsername');
    var emailEl = document.getElementById('profileEmail');
    var registeredEl = document.getElementById('profileRegistered');
    var worksCountEl = document.getElementById('worksCount');
    var likesCountEl = document.getElementById('likesCount');
    var commentsCountEl = document.getElementById('commentsCount');

    if (usernameEl) usernameEl.textContent = currentUser.username;
    if (emailEl) emailEl.textContent = currentUser.email;

    if (registeredEl) {
        if (currentUser.registeredAt) {
            registeredEl.textContent = '📅 Зарегистрирован(а): ' + formatDate(currentUser.registeredAt);
        } else {
            registeredEl.textContent = '📅 Дата регистрации неизвестна';
        }
    }

    if (worksCountEl) worksCountEl.textContent = getUserWorksCount();
    if (likesCountEl) likesCountEl.textContent = getUserTotalLikes();
    if (commentsCountEl) commentsCountEl.textContent = getUserTotalComments();
}

// ========== РЕДАКТИРОВАНИЕ РАБОТЫ (ОТКРЫВАЕТ СТРАНИЦУ РЕДАКТОРА) ==========

function editWork(workId) {
    window.location.href = 'edit_work.html?id=' + workId;
}

// ========== УДАЛЕНИЕ РАБОТЫ ==========

function deleteWork(workId) {
    var confirmDelete = confirm('🗑️ Вы уверены, что хотите удалить эту работу? Это действие нельзя отменить.\n\nВсе комментарии к этой работе также будут удалены.');
    if (!confirmDelete) return;

    // Находим индекс работы
    var workIndex = -1;
    for (var i = 0; i < works.length; i++) {
        if (works[i].id === workId) {
            workIndex = i;
            break;
        }
    }

    if (workIndex !== -1 && works[workIndex].authorId === currentUser.id) {
        // Удаляем работу
        works.splice(workIndex, 1);
        
        // Удаляем все комментарии к этой работе
        for (var j = comments.length - 1; j >= 0; j--) {
            if (comments[j].workId === workId) {
                comments.splice(j, 1);
            }
        }
        
        saveAllData();
        renderUserWorks();
        fillProfileInfo();
        alert('✅ Работа удалена');
    } else {
        alert('❌ Ошибка: работа не найдена или у вас нет прав');
    }
}

// ========== ОТОБРАЖЕНИЕ СПИСКА РАБОТ ==========

function renderUserWorks() {
    var container = document.getElementById('userWorksList');
    if (!container) return;

    // Собираем работы автора
    var userWorks = [];
    for (var i = 0; i < works.length; i++) {
        if (works[i].authorId === currentUser.id) {
            userWorks.push(works[i]);
        }
    }

    if (userWorks.length === 0) {
        container.innerHTML = '<div class="empty-works">📖 У вас пока нет ни одной истории. Нажмите «➕ Добавить историю» на главной странице!</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < userWorks.length; i++) {
        var work = userWorks[i];
        
        // Считаем комментарии к этой работе
        var commentsCount = 0;
        for (var j = 0; j < comments.length; j++) {
            if (comments[j].workId === work.id) commentsCount++;
        }
        
        var statusText = '';
        if (work.status === 'in-progress') statusText = '🔄 В процессе';
        else if (work.status === 'completed') statusText = '✅ Завершено';
        else if (work.status === 'frozen') statusText = '❄️ Заморожено';
        else statusText = '📖 Опубликовано';

        html += `
            <div class="work-item" data-work-id="${work.id}">
                <div class="work-info">
                    <div class="work-title">${escapeHtml(work.title)}</div>
                    <div class="work-meta">
                        <span>🏷️ ${escapeHtml(work.genre || 'Без жанра')}</span>
                        <span>${statusText}</span>
                        <span>❤️ ${work.likes ? work.likes.length : 0} лайков</span>
                        <span>💬 ${commentsCount} комментариев</span>
                        <span>📅 ${formatDate(work.createdAt)}</span>
                    </div>
                </div>
                <div class="work-actions">
                    <button class="edit-work-btn" data-id="${work.id}" title="Редактировать">✏️ Редактировать</button>
                    <button class="delete-work-btn" data-id="${work.id}" title="Удалить">🗑️ Удалить</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Навешиваем обработчики на кнопки
    var editButtons = document.querySelectorAll('.edit-work-btn');
    for (var i = 0; i < editButtons.length; i++) {
        editButtons[i].addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.getAttribute('data-id'));
            editWork(id);
        });
    }

    var deleteButtons = document.querySelectorAll('.delete-work-btn');
    for (var i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.getAttribute('data-id'));
            deleteWork(id);
        });
    }
}

// ========== ЗАПУСК СТРАНИЦЫ ==========

function init() {
    if (!checkAuth()) return;
    fillProfileInfo();
    renderUserWorks();
}

init();