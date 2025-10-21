// Массив правил
// 😝 текст. 
// 😝 текст 2123
// текстик

const validationRules = [
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
        
                const lastChar = paragraph[paragraph.length - 1];
                const endsWithLetter = /[a-zA-Zа-яА-Я0-9]$/.test(lastChar);

                if (endsWithLetter) {
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
                
                const lastChar = paragraph[paragraph.length - 1];
                const endsWithLetter = /[a-zA-Zа-яА-Я0-9]$/.test(lastChar);
                
                if (endsWithLetter)
                    return paragraph + '.';
                return paragraph;
            }).join('\n');
        }
    }
    
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
    
    , {
        id: 'noEmoji',
        name: 'Отсутствуют смайлики',
        check: (text) => {
            const emojiRegex = /\p{Emoji}/u;
            return !emojiRegex.test(text);
        },
        fix: null // Не исправляется автоматически
    }
    
    , {
        id: 'emojiRatio',
        name: 'Мало смайликов в тексте',
        check: (text) => {
            const emojiRegex = /\p{Emoji}/gu;
            const emojis = text.match(emojiRegex) || [];
            const textWithoutEmojis = text.replace(emojiRegex, '');
            const textLength = textWithoutEmojis.replace(/\s/g, '').length; // длина текста без пробелов и эмодзи
            
            // Хотим 1 смайлик на каждые 150 символов
            const requiredEmojis = Math.ceil(textLength / 150);
            const currentEmojis = emojis.length;
            
            if (currentEmojis < requiredEmojis) {
                return {
                    problem: true,
                    message: `Добавьте ещё ${requiredEmojis - currentEmojis} смайликов (сейчас ${currentEmojis}, нужно ${requiredEmojis})`
                };
            }
            
            return { problem: false };
        },
        fix: null // Не исправляется автоматически
    }
   
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
                    const isEmojiAtStart = /\p{Emoji}/u.test(firstSymbol);
                    
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
                const isEmojiAtStart = /\p{Emoji}/u.test(firstSymbol);
                
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
                    const isEmojiAtStart = /\p{Emoji}/u.test(firstSymbol);
                    
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
                const isEmojiAtStart = /\p{Emoji}/u.test(firstSymbol);
                const isList = emojiGroups.some(group => group.includes(index));
                
                if (isEmojiAtStart && !isList) {
                    return paragraph.replace(new RegExp(`^\\s*${firstSymbol}`), '').trim();
                }
                
                return paragraph;
            }).join('\n');
        }
    }

];