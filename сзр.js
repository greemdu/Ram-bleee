// ========== РАБОТА С ФОРМОЙ СОЗДАНИЯ ==========

// Функция проверки авторизации (используем глобальные переменные из auth.js)
function checkAuth() {
    const authStatus = document.getElementById('editorAuthStatus');
    
    if (!currentUser) {
        if (authStatus) {
            authStatus.innerHTML = '<span style="color:#e085b0;">⚠️ Вы не авторизованы. <a href="index.html" style="color:#b07ad9;">Войдите</a> чтобы создать историю</span>';
        }
        const publishBtn = document.getElementById('publishBtn');
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.style.opacity = '0.5';
            publishBtn.style.cursor = 'not-allowed';
        }
        return false;
    } else {
        if (authStatus) {
            authStatus.innerHTML = '<span>✓ Вы вошли как <strong>' + currentUser.username + '</strong></span>';
        }
        const publishBtn = document.getElementById('publishBtn');
        if (publishBtn) {
            publishBtn.disabled = false;
            publishBtn.style.opacity = '1';
            publishBtn.style.cursor = 'pointer';
        }
        return true;
    }
}

// Добавление работы (используем глобальный массив works из auth.js)
function addWorkAndSave(title, genre, status, tags, description, content) {
    if (!currentUser) return false;
    
    var newWork = {
        id: Date.now(),
        title: title,
        genre: genre,
        status: status,
        tags: tags ? tags.split(',').map(function(t) { return t.trim(); }) : [],
        description: description,
        content: content || '',
        authorId: currentUser.id,
        authorName: currentUser.username,
        likes: [],
        createdAt: new Date().toISOString(),
        chapters: 1
    };
    
    // Добавляем в глобальный массив works (который из auth.js)
    works.push(newWork);
    // Сохраняем в localStorage
    localStorage.setItem('works', JSON.stringify(works));
    return newWork;
}

// Настройка формы
function setupForm() {
    var form = document.getElementById('workForm');
    if (!form) return;
    
    var cancelBtn = document.getElementById('cancelBtn');
    var descTextarea = document.getElementById('workDescription');
    var descCounter = document.getElementById('descCounter');
    
    // Счётчик символов
    if (descTextarea && descCounter) {
        descTextarea.addEventListener('input', function() {
            descCounter.textContent = descTextarea.value.length + ' / 500';
        });
    }
    
    // Кнопка отмены
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Вы уверены? Несохранённые данные будут потеряны.')) {
                window.location.href = 'index.html';
            }
        });
    }
    
    // Отправка формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('⚠️ Чтобы добавить историю, нужно войти в аккаунт!');
            window.location.href = 'index.html';
            return;
        }
        
        var title = document.getElementById('workTitle').value.trim();
        var genre = document.getElementById('workGenre').value.trim();
        var status = document.getElementById('workStatus').value;
        var tags = document.getElementById('workTags').value;
        var description = document.getElementById('workDescription').value.trim();
        var content = document.getElementById('workContent').value;
        
        if (!title) {
            alert('Пожалуйста, введите название работы');
            return;
        }
        
        if (!description) {
            alert('Пожалуйста, напишите описание/аннотацию');
            return;
        }
        
        addWorkAndSave(title, genre, status, tags, description, content);
        alert('✅ Работа "' + title + '" успешно опубликована!');
        
        // Перенаправляем на главную
        window.location.href = 'index.html';
    });
}

// Запуск
function init() {
    checkAuth();
    setupForm();
}

document.addEventListener('DOMContentLoaded', init);