// Массив правил
const validationRules = [
    // missingDot Отсутствуют точки в конце абзацев
    {
        id: 'missingDot',
        name: 'Отсутствуют точки в конце абзацев',
        check: (text) => {
            const problems = [];
            const paragraphs = text.split('\n');
            let charIndex = 0;
        
            paragraphs.forEach(paragraph => {
                if (paragraph.trim() === '') {
                    charIndex += 1;
                    return;
                }
        
                const trimmed = paragraph.trim();
                const lastChar = trimmed[trimmed.length - 1];
                const endsWithLetter = /[a-zA-Zа-яА-Я0-9]$/.test(lastChar);
                
                // Проверяем, не является ли последнее слово хештегом
                const lastWord = trimmed.split(/\s+/).pop();
                const isHashtag = lastWord.startsWith('#');
    
                if (endsWithLetter && !isHashtag) {
                    problems.push({
                        start: charIndex + paragraph.length - 1,
                        end: charIndex + paragraph.length,
                        message: 'Абзац заканчивается буквой - добавьте пунктуацию или эмодзи'
                    });
                }
        
                charIndex += paragraph.length + 1;
            });
        
            return problems;
        },
        fix: (text) => {
            return text.split('\n').map(paragraph => {
                if (paragraph.trim() === '') return paragraph;
                
                const trimmed = paragraph.trim();
                const lastChar = trimmed[trimmed.length - 1];
                const endsWithLetter = /[a-zA-Zа-яА-Я0-9]$/.test(lastChar);
                
                const lastWord = trimmed.split(/\s+/).pop();
                const isHashtag = lastWord.startsWith('#');
                
                if (endsWithLetter && !isHashtag) {
                    return trimmed + '.';
                }
                return paragraph;
            }).join('\n');
        }
    }
    // lowercaseStart Предложения начинаются с маленькой буквы
    , {
        id: 'lowercaseStart', 
        name: 'Предложения начинаются с маленькой буквы',
        check: (text) => {
            const problems = [];
            const paragraphs = text.split('\n');
            let charIndex = 0;
    
            paragraphs.forEach(paragraph => {
                if (paragraph.trim() === '') {
                    charIndex += 1;
                    return;
                }
    
                // Находим первую букву в абзаце (игнорируя эмодзи и пробелы в начале)
                const firstLetterMatch = paragraph.match(/[a-zA-Zа-яА-Я]/);
                if (firstLetterMatch) {
                    const firstLetterIndex = firstLetterMatch.index;
                    const firstLetter = firstLetterMatch[0];
                    
                    if (/[a-zа-я]/.test(firstLetter)) {
                        problems.push({
                            start: charIndex + firstLetterIndex,
                            end: charIndex + firstLetterIndex + 1,
                            message: 'Первая буква абзаца должна быть заглавной'
                        });
                    }
                }
    
                charIndex += paragraph.length + 1;
            });
    
            return problems;
        },
        fix: (text) => {
            return text.split('\n').map(paragraph => {
                if (paragraph.trim() === '') return paragraph;
                
                // Находим первую букву и делаем её заглавной (игнорируя // и другие не-буквы в начале)
                return paragraph.replace(/^([^a-zA-Zа-яА-Я]*)([a-zа-я])/u, (match, prefix, letter) => {
                    return prefix + letter.toUpperCase();
                });
            }).join('\n');
        }
    }
    // noEmoji Отсутствуют смайлики
    , {
        id: 'noEmoji',
        name: 'Отсутствуют смайлики',
        check: (text) => {
            const emojiRegex = /\p{Emoji_Presentation}/u;
            return !emojiRegex.test(text);
        },
        fix: null // Не исправляется автоматически
    }
    // emojiRatio Мало смайликов в тексте
    , {
        id: 'emojiRatio',
        name: 'Мало смайликов в тексте',
        check: (text) => {
            const emojiRegex = /\p{Emoji_Presentation}/gu;
            const emojis = text.match(emojiRegex) || [];
            const textWithoutEmojis = text.replace(emojiRegex, '');
            const textLength = textWithoutEmojis.replace(/\s/g, '').length; // длина текста без пробелов и эмодзи
            
            // Хотим 1 смайлик на каждые 150 символов
            const requiredEmojis = Math.ceil(textLength / 150);
            const currentEmojis = emojis.length;
            
            if (currentEmojis < requiredEmojis) {
                return {
                    problem: true,
                    message: `Добавьте ещё ${requiredEmojis - currentEmojis} смайликов (сейчас ${currentEmojis}, нужно ~ ${requiredEmojis})`
                };
            }
            
            return { problem: false };
        },
        fix: null // Не исправляется автоматически
    }
   // emojiAtStart Смайлики в начале абзаца
    , {
        id: 'emojiAtStart',
        name: 'Смайлики в начале абзаца',
        check: (text) => {
            const problems = [];
            const paragraphs = text.split('\n');
            let charIndex = 0;
    
            // Находим группы подряд идущих абзацев с эмодзи
            const emojiGroups = [];
            let currentGroup = [];
            
            paragraphs.forEach((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (trimmed) {
                    const firstSymbol = Array.from(trimmed)[0];
                    const isEmojiAtStart = /\p{Emoji_Presentation}/u.test(firstSymbol);
                    
                    if (isEmojiAtStart) {
                        currentGroup.push(index);
                    } else {
                        if (currentGroup.length > 1) {
                            emojiGroups.push([...currentGroup]);
                        }
                        currentGroup = [];
                    }
                } else {
                    if (currentGroup.length > 1) {
                        emojiGroups.push([...currentGroup]);
                    }
                    currentGroup = [];
                }
            });
            
            // Добавляем последнюю группу
            if (currentGroup.length > 1) {
                emojiGroups.push([...currentGroup]);
            }
    
            paragraphs.forEach((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (trimmed === '') {
                    charIndex += 1;
                    return;
                }
    
                const firstSymbol = Array.from(trimmed)[0];
                const isEmojiAtStart = /\p{Emoji_Presentation}/u.test(firstSymbol);
                
                // Исключение: только если это часть группы подряд идущих эмодзи-абзацев
                const isList = emojiGroups.some(group => group.includes(index));
                
                if (isEmojiAtStart && !isList) {
                    const emojiIndex = paragraph.indexOf(firstSymbol);
                    problems.push({
                        start: charIndex + emojiIndex,
                        end: charIndex + emojiIndex + firstSymbol.length,
                        message: 'Уберите смайлик из начала абзаца'
                    });
                }
    
                charIndex += paragraph.length + 1;
            });
    
            return problems;
        },
        fix: (text) => {
            const paragraphs = text.split('\n');
            
            // Находим группы подряд идущих эмодзи-абзацев для фикса
            const emojiGroups = [];
            let currentGroup = [];
            
            paragraphs.forEach((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (trimmed) {
                    const firstSymbol = Array.from(trimmed)[0];
                    const isEmojiAtStart = /\p{Emoji_Presentation}/u.test(firstSymbol);
                    
                    if (isEmojiAtStart) {
                        currentGroup.push(index);
                    } else {
                        if (currentGroup.length > 1) {
                            emojiGroups.push([...currentGroup]);
                        }
                        currentGroup = [];
                    }
                } else {
                    if (currentGroup.length > 1) {
                        emojiGroups.push([...currentGroup]);
                    }
                    currentGroup = [];
                }
            });
            
            if (currentGroup.length > 1) {
                emojiGroups.push([...currentGroup]);
            }
    
            return paragraphs.map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (trimmed === '') return paragraph;
                
                const firstSymbol = Array.from(trimmed)[0];
                const isEmojiAtStart = /\p{Emoji_Presentation}/u.test(firstSymbol);
                const isList = emojiGroups.some(group => group.includes(index));
                
                if (isEmojiAtStart && !isList) {
                    // Экранируем специальные символы в эмодзи для regex
                    const escapedSymbol = firstSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    return paragraph.replace(new RegExp(`^\\s*${escapedSymbol}`), '').trim();
                }
                
                return paragraph;
            }).join('\n');
        }
    }
    // emojiSpacing Эмодзи должны быть отделены пробелами от текста
    , {
        id: 'emojiSpacing',
        name: 'Эмодзи должны быть отделены пробелами от текста',
        check: (text) => {
            const problems = [];
            const emojiRegex = /\p{Emoji_Presentation}/gu;
            let match;
            
            while ((match = emojiRegex.exec(text)) !== null) {
                const emoji = match[0];
                const index = match.index;
                
                // Проверяем символ перед эмодзи
                const charBefore = text[index - 1];
                const hasTextBefore = charBefore && /\S/.test(charBefore);
                const needsSpaceBefore = hasTextBefore && charBefore !== ' ' && charBefore !== '\n';
                
                // Проверяем символ после эмодзи
                const charAfter = text[index + emoji.length];
                const hasTextAfter = charAfter && /\S/.test(charAfter);
                const needsSpaceAfter = hasTextAfter && charAfter !== ' ' && charAfter !== '\n';
                
                if (needsSpaceBefore || needsSpaceAfter) {
                    problems.push({
                        start: index,
                        end: index + emoji.length,
                        message: `Добавьте пробелы вокруг эмодзи`
                    });
                }
            }
            
            return problems;
        },
        fix: (text) => {
            const emojiRegex = /\p{Emoji_Presentation}/gu;
            
            return text.replace(emojiRegex, (emoji, index) => {
                const charBefore = text[index - 1];
                const charAfter = text[index + emoji.length];
                
                const hasTextBefore = charBefore && /\S/.test(charBefore);
                const needsSpaceBefore = hasTextBefore && charBefore !== ' ' && charBefore !== '\n';
                
                const hasTextAfter = charAfter && /\S/.test(charAfter);
                const needsSpaceAfter = hasTextAfter && charAfter !== ' ' && charAfter !== '\n';
                
                let result = emoji;
                if (needsSpaceBefore) result = ' ' + result;
                if (needsSpaceAfter) result = result + ' ';
                
                return result;
            });
        }
    }
    // stuckPunctuation Знаки препинания должны быть отделены пробелами
    , {
        id: 'punctuationSpacing',
        name: 'Знаки препинания должны быть правильно отделены пробелами',
        check: (text) => {
            const problems = [];
            
            // 1. Проверяем обычные знаки препинания (прилипли к тексту)
            const punctRegex = /[a-zA-Zа-яА-Я0-9]([.,:;!?])(?=[a-zA-Zа-яА-Я0-9])/g;
            let match;
            
            while ((match = punctRegex.exec(text)) !== null) {
                const punctChar = match[1];
                const index = match.index + 1;
                
                problems.push({
                    start: index,
                    end: index + 1,
                    message: `Добавьте пробел после знака "${punctChar}"`
                });
            }
            
            // 2. Проверяем тире (—) без пробелов вокруг
            const dashRegex = /[a-zA-Zа-яА-Я0-9]—|—[a-zA-Zа-яА-Я0-9]/g;
            
            while ((match = dashRegex.exec(text)) !== null) {
                const index = match.index;
                const found = match[0];
                
                if (/[a-zA-Zа-яА-Я0-9]—/.test(found)) {
                    problems.push({
                        start: index,
                        end: index + found.length,
                        message: 'Добавьте пробел перед тире'
                    });
                } else {
                    problems.push({
                        start: index,
                        end: index + found.length,
                        message: 'Добавьте пробел после тире'
                    });
                }
            }
            
            return problems;
        },
        fix: (text) => {
            return text
                // Исправляем обычные знаки препинания
                .replace(/([a-zA-Zа-яА-Я0-9])([.,:;!?])(?=[a-zA-Zа-яА-Я0-9])/g, '$1$2 ')
                // Исправляем тире
                .replace(/([a-zA-Zа-яА-Я0-9])—/g, '$1 —')
                .replace(/—([a-zA-Zа-яА-Я0-9])/g, '— $1');
        }
    }
    // spelling Орфографические ошибки
    , {
        id: 'spelling',
        name: 'Орфографические ошибки',
        check: (text) => {
            const problems = [];
            const words = text.match(/[a-zA-Zа-яА-ЯёЁ]{3,}/g) || []; // только слова от 3 букв
            
            // Ограничиваем количество проверяемых слов
            const wordsToCheck = words.slice(0, 100);
            
            wordsToCheck.forEach(word => {
                try {
                    if (!dictionary.check(word)) {
                        const index = text.indexOf(word);
                        if (index !== -1) {
                            problems.push({
                                start: index,
                                end: index + word.length,
                                message: `Возможная ошибка: "${word}"`
                            });
                        }
                    }
                } catch (e) {
                    // Игнорируем ошибки проверки
                    console.warn('Ошибка проверки слова:', word, e);
                }
            });
            
            return problems;
        },
        fix: null // Отключаем автозамену - она слишком тяжелая
    }
    // extraSpaces Лишние пробелы
    , {
        id: 'extraSpaces',
        name: 'Лишние пробелы',
        check: (text) => {
            const problems = [];
            
            // Лишние пробелы
            const doubleSpaces = / {2,}/g;
            let match;
            
            while ((match = doubleSpaces.exec(text)) !== null) {
                problems.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    message: 'Уберите лишние пробелы'
                });
            }
            
            // Пробелы перед знаками препинания
            const spaceBeforePunct = / [.,!?;:)]/g;
            while ((match = spaceBeforePunct.exec(text)) !== null) {
                problems.push({
                    start: match.index,
                    end: match.index + 1,
                    message: 'Уберите пробел перед знаком препинания'
                });
            }
            
            return problems;
        },
        fix: (text) => {
            return text
                .replace(/ {2,}/g, ' ') // Убираем двойные пробелы
                .replace(/ ([.,!?;:)])/g, '$1'); // Убираем пробелы перед пунктуацией
        }
    }
    // quoteMarks Неправильные кавычки
    , {
        id: 'quoteMarks',
        name: 'Неправильные кавычки',
        check: (text) => {
            const problems = [];
            
            // Ищем неправильные кавычки (например, английские вместо русских)
            const wrongQuotes = /["']/g;
            let match;
            
            while ((match = wrongQuotes.exec(text)) !== null) {
                problems.push({
                    start: match.index,
                    end: match.index + 1,
                    message: 'Замените кавычки на «ёлочки» или „лапки“'
                });
            }
            
            return problems;
        },
        fix: (text) => {
            // Простая замена прямых кавычек на ёлочки
            return text
                .replace(/"([^"]+)"/g, '«$1»')
                .replace(/'([^']+)'/g, '«$1»');
        }
    }
];