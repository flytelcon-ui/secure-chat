export const encryptMessage = (text, cipherType, shift = "3") => {
    if (!text) return '';
    if (cipherType === 'none') return text;
    
    if (cipherType === 'caesar') {
        const s = parseInt(shift, 10) || 0;
        return text.split('').map(char => String.fromCharCode(char.charCodeAt(0) + s)).join('');
    }

    if (cipherType === 'transposition') {
        // Очищаємо слово від пробілів та цифр, робимо великими літерами
        let kw = shift.toString().toUpperCase().replace(/[^А-ЯІЇЄҐA-Z]/g, '') || "KEY";
        let cols = kw.length;
        
        // Визначаємо алфавітний порядок літер у ключі (наприклад ЛИС -> И(0), Л(1), С(2))
        let order = kw.split('').map((c, i) => ({c, i})).sort((a,b) => a.c.localeCompare(b.c)).map(x => x.i);

        let grid = Array.from({ length: cols }, () => "");
        
        for (let i = 0; i < text.length; i++) {
            grid[i % cols] += text[i];
        }
        
        // Зчитуємо стовпці у визначеному алфавітному порядку
        let result = "";
        for (let i = 0; i < cols; i++) {
            result += grid[order[i]];
        }
        return result;
    }
    
    return text;
};

export const decryptMessage = (text, cipherType, shift = "3") => {
    if (!text) return '';
    if (cipherType === 'none') return text;
    
    if (cipherType === 'caesar') {
        const s = parseInt(shift, 10) || 0;
        return text.split('').map(char => String.fromCharCode(char.charCodeAt(0) - s)).join('');
    }

    if (cipherType === 'transposition') {
        let kw = shift.toString().toUpperCase().replace(/[^А-ЯІЇЄҐA-Z]/g, '') || "KEY";
        let cols = kw.length;
        let order = kw.split('').map((c, i) => ({c, i})).sort((a,b) => a.c.localeCompare(b.c)).map(x => x.i);
        
        const rows = Math.ceil(text.length / cols);
        const numLongCols = text.length % cols === 0 ? cols : text.length % cols;

        let colLengths = Array(cols).fill(rows);
        for (let i = numLongCols; i < cols; i++) {
            colLengths[i] = rows - 1;
        }

        let extractedCols = [];
        let currentIndex = 0;
        
        // Відновлюємо стовпці з урахуванням алфавітного порядку
        for (let i = 0; i < cols; i++) {
            let originalIndex = order[i];
            let len = colLengths[originalIndex];
            extractedCols[originalIndex] = text.slice(currentIndex, currentIndex + len);
            currentIndex += len;
        }

        let decrypted = "";
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (extractedCols[c] && extractedCols[c][r]) {
                    decrypted += extractedCols[c][r];
                }
            }
        }
        return decrypted;
    }
    
    return text;
};