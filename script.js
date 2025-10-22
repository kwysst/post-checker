
document.addEventListener('DOMContentLoaded', function () {
    feather.replace();

    // Элементы DOM
    const textInput = document.getElementById('textInput');
    const checkBtn = document.getElementById('checkBtn');
    const applyBtn = document.getElementById('applyBtn');
    const statusDiv = document.getElementById('status');

    // Переменные для хранения состояния
    let currentProblems = {
        missingDot: [],
        lowercaseStart: [],
        noEmoji: false
    };

    // Новая функция проверки
    function checkText() {
        const text = textInput.value;

        resetState();
        currentProblems = {};
    
        validationRules.forEach(rule => {
            const result = rule.check(text);
            currentProblems[rule.id] = result;
        });

        console.log(currentProblems)
        
    
        applyBtn.classList.add('active')
        applyBtn.removeAttribute('disabled');
        updateStatus();
        highlightProblems();
    }

    function resetHighlight() {
        // Восстанавливаем чистый текст без подсветки
        textInput.innerHTML = escapeHtml(textInput.textContent);
    }

    function resetState() {
        statusDiv.innerHTML = '';
        statusDiv.className = '';
        textInput.classList.remove('good', 'warning', 'bad');
        currentProblems = {};
    }

   
    
    // Функция для объединения перекрывающихся диапазонов
    function mergeProblemRanges(problems) {
        if (problems.length === 0) return [];
        
        // Сортируем по начальной позиции
        const sorted = [...problems].sort((a, b) => a.start - b.start);
        const merged = [sorted[0]];
        
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];
            
            // Если текущий диапазон перекрывается или соприкасается с последним
            if (current.start <= last.end) {
                // Расширяем конечную позицию если нужно
                last.end = Math.max(last.end, current.end);
                // Объединяем сообщения
                if (current.message && !last.message.includes(current.message)) {
                    last.message += `; ${current.message}`;
                }
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    }
    
  
    
    // Функция экранирования HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Функция обновления статуса
    function updateStatus() {
        statusDiv.innerHTML = '';
        statusDiv.className = '';

        const problemsList = [];
        let autoFixableCount = 0;
        let unfixableCount = 0;

        // Собираем проблемы из всех правил
        validationRules.forEach(rule => {
            const problems = currentProblems[rule.id];

            if (problems && (
                (Array.isArray(problems) && problems.length > 0) ||
                (typeof problems === 'object' && problems.problem) ||
                (typeof problems === 'boolean' && problems)
            )) {
                if (rule.fix) {
                    autoFixableCount++;
                } else {
                    unfixableCount++;
                }

                if (Array.isArray(problems) && problems.length > 0) {
                    problemsList.push(rule.name);
                } else if (problems.message) {
                    problemsList.push(problems.message);
                } else {
                    problemsList.push(rule.name);
                }
            }
        });

        if (problemsList.length === 0) {
            showSuccessStatus();
        } else if (autoFixableCount > 0 && unfixableCount === 0) {
            showWarningStatus('Найдены проблемы, которые можно исправить автоматически:', problemsList);
        } else if (autoFixableCount === 0 && unfixableCount > 0) {
            showWarningStatus('Текст исправлен, но есть проблемы:', problemsList);
        } else {
            showErrorStatus('Найдены проблемы:', problemsList);
        }
    }

    function showSuccessStatus() {
        statusDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 10px;">🎉</div>
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Идеально!</div>
                <div>Текст соответствует всем требованиям</div>
            </div>
        `;
        statusDiv.classList.add('status-good');
        textInput.classList.add('good');
    }

    function showWarningStatus(title, problems) {
        statusDiv.innerHTML = `
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px;">${title}</div>
            <div class="problems-list">
                <ul>
                    ${problems.map(problem => `<li>${problem}</li>`).join('')}
                </ul>
            </div>
        `;
        statusDiv.classList.add('status-warning');
        textInput.classList.add('warning');
    }

    function showErrorStatus(title, problems) {
        statusDiv.innerHTML = `
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px;">${title}</div>
            <div class="problems-list">
                <ul>
                    ${problems.map(problem => `<li>${problem}</li>`).join('')}
                </ul>
            </div>
        `;
        statusDiv.classList.add('status-bad');
        textInput.classList.add('bad');
    }

    // Обработчики событий
    checkBtn.addEventListener('click', checkText);
    applyBtn.addEventListener('click', applyFixes);

    checkBtn.addEventListener('click', () => document.getElementsByClassName("header")[0].style.display = 'none');
    applyBtn.addEventListener('click', () => document.getElementsByClassName("header")[0].style.display = 'none');

    // Сброс статуса при изменении текста
    textInput.addEventListener('input', () => {
        resetState();
        statusDiv.innerHTML = '';
        statusDiv.className = '';
        applyBtn.classList.remove('active');
        applyBtn.setAttribute('disabled', 'true');
        textInput.classList.remove('good', 'warning', 'bad');
    });

    // Вспомогательная функция для экранирования HTML (оставлена для будущего использования)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    const copyBtn = document.getElementById('copyBtn');

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textInput.value)
            .then(() => {
                copyBtn.querySelector('.copy-icon').style.display = 'none';
                copyBtn.querySelector('.check-icon').style.display = 'block';
                copyBtn.classList.toggle('checked');

                setTimeout(() => {
                    copyBtn.classList.toggle('checked');
                    copyBtn.querySelector('.copy-icon').style.display = 'block';
                    copyBtn.querySelector('.check-icon').style.display = 'none';
                }, 2000);
            });
    });













function highlightProblems() {
    const text = textInput.value;
    const overlay = document.getElementById('highlightOverlay');
    
    let newHtml = escapeHtml(text);
    const allProblems = [];
    
    Object.values(currentProblems).forEach(problems => {
        if (Array.isArray(problems)) {
            allProblems.push(...problems);
        }
    });
    
    // Объединяем перекрывающиеся диапазоны
    const mergedProblems = mergeProblemRanges(allProblems);
    
    // Сортируем по убыванию (от большего индекса к меньшему)
    mergedProblems.sort((a, b) => b.start - a.start);
    console.log(mergedProblems, allProblems);
    mergedProblems.forEach(problem => {
        const before = newHtml.substring(0, problem.start);
        const errorText = newHtml.substring(problem.start, problem.end);
        const after = newHtml.substring(problem.end);
        
        newHtml = before + `<span class="highlight-error">${errorText}</span>` + after;
    });
    
    overlay.innerHTML = newHtml;
}

function applyFixes() {
    let text = textInput.value;
    
    validationRules.forEach(rule => {
        if (rule.fix && currentProblems[rule.id] && currentProblems[rule.id].length > 0) {
            text = rule.fix(text);
        }
    });
    
    textInput.value = text;
    checkText();
}

// Обновляем подсветку при скролле и ресайзе
textInput.addEventListener('scroll', () => {
    highlightOverlay.scrollTop = textInput.scrollTop;
});

textInput.addEventListener('input', () => {
    highlightOverlay.textContent = textInput.value;
});


});




