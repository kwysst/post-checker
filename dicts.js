let dictionary = null;
let timer = null;

async function loadDictionary() {
    const [affResponse, dicResponse] = await Promise.all([
        fetch('./dicts/ru_RU.aff'),
        fetch('./dicts/ru_RU.dic')
    ]);
    
    const affData = await affResponse.text();
    const dicData = await dicResponse.text();
    
    return new Typo('ru_RU', affData, dicData);
}

async function initDicts() {
    showLoading();

    try {
        dictionary = await loadDictionary();
    } catch (error) {
        console.error('Ошибка загрузки словарей:', error);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    timer = setTimeout(() => {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }, 500);
}

function hideLoading() {
    clearTimeout(timer);
    document.getElementById('loadingOverlay').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', initDicts);