const normalizeTranspositionKey = (shift) =>
    shift.toString().toUpperCase().replace(/[^\p{L}]/gu, '') || 'KEY';

const SDES_P10 = [3, 5, 2, 7, 4, 10, 1, 9, 8, 6];
const SDES_P8 = [6, 3, 7, 4, 8, 5, 10, 9];
const SDES_IP = [2, 6, 3, 1, 4, 8, 5, 7];
const SDES_IP_INV = [4, 1, 3, 5, 7, 2, 8, 6];
const SDES_EP = [4, 1, 2, 3, 2, 3, 4, 1];
const SDES_P4 = [2, 4, 3, 1];
const SDES_S0 = [
    [1, 0, 3, 2],
    [3, 2, 1, 0],
    [0, 2, 1, 3],
    [3, 1, 3, 2]
];
const SDES_S1 = [
    [0, 1, 2, 3],
    [2, 0, 1, 3],
    [3, 0, 1, 0],
    [2, 1, 0, 3]
];

const isValidSDESKey = (key) => /^[01]{10}$/.test(String(key));

const permute = (bits, positions) => positions.map(position => bits[position - 1]);
const xorBits = (left, right) => left.map((bit, index) => bit ^ right[index]);
const rotateLeft = (bits, count) => bits.slice(count).concat(bits.slice(0, count));
const bitsToNumber = (bits) => parseInt(bits.join(''), 2);
const numberToBits = (number, width) =>
    number.toString(2).padStart(width, '0').split('').map(Number);

const generateSDESSubkeys = (keyStr) => {
    if (!isValidSDESKey(keyStr)) {
        throw new Error('Ключ S-DES має містити рівно 10 бітів (0 або 1).');
    }

    const permutedKey = permute(keyStr.split('').map(Number), SDES_P10);
    let left = permutedKey.slice(0, 5);
    let right = permutedKey.slice(5);
    left = rotateLeft(left, 1);
    right = rotateLeft(right, 1);
    const key1 = permute(left.concat(right), SDES_P8);

    left = rotateLeft(left, 2);
    right = rotateLeft(right, 2);
    const key2 = permute(left.concat(right), SDES_P8);

    return [key1, key2];
};

const substitute = (bits, sBox) => {
    const row = bits[0] * 2 + bits[3];
    const column = bits[1] * 2 + bits[2];
    return numberToBits(sBox[row][column], 2);
};

const sdesRound = (block, subkey, shouldSwap) => {
    const left = block.slice(0, 4);
    const right = block.slice(4);
    const expanded = xorBits(permute(right, SDES_EP), subkey);
    const substituted = substitute(expanded.slice(0, 4), SDES_S0)
        .concat(substitute(expanded.slice(4), SDES_S1));
    const newLeft = xorBits(left, permute(substituted, SDES_P4));

    return shouldSwap ? right.concat(newLeft) : newLeft.concat(right);
};

const processSDESByte = (byte, subkeys) => {
    let block = permute(numberToBits(byte, 8), SDES_IP);
    block = sdesRound(block, subkeys[0], true);
    block = sdesRound(block, subkeys[1], false);
    return bitsToNumber(permute(block, SDES_IP_INV));
};

export const encryptSDES = (text, keyStr) => {
    const subkeys = generateSDESSubkeys(keyStr);
    const bytes = new TextEncoder().encode(text);

    return Array.from(bytes, byte => processSDESByte(byte, subkeys).toString(16).padStart(2, '0')).join('');
};

export const decryptSDES = (hexText, keyStr) => {
    const subkeys = generateSDESSubkeys(keyStr).reverse();
    if (hexText.length % 2 !== 0 || !/^[\da-f]*$/i.test(hexText)) {
        throw new Error('Зашифрований текст S-DES має бути коректним Hex-рядком.');
    }

    const bytes = new Uint8Array(hexText.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) ?? []);
    const decryptedBytes = Uint8Array.from(bytes, byte => processSDESByte(byte, subkeys));
    return new TextDecoder('utf-8', { fatal: true }).decode(decryptedBytes);
};

export const encryptMessage = (text, cipherType, shift = "3") => {
    if (!text) return '';
    if (cipherType === 'none') return text;
    if (cipherType === 'sdes') return encryptSDES(text, shift);
    
    if (cipherType === 'caesar') {
        const s = parseInt(shift, 10) || 0;
        return text.split('').map(char => String.fromCharCode(char.charCodeAt(0) + s)).join('');
    }

    if (cipherType === 'transposition') {
        let kw = normalizeTranspositionKey(shift);
        const payload = `SCL1:${kw}:${text}`;
        let cols = kw.length;
        
        // Визначаємо алфавітний порядок літер у ключі (наприклад ЛИС -> И(0), Л(1), С(2))
        let order = kw.split('').map((c, i) => ({c, i})).sort((a,b) => a.c.localeCompare(b.c)).map(x => x.i);

        let grid = Array.from({ length: cols }, () => "");
        
        for (let i = 0; i < payload.length; i++) {
            grid[i % cols] += payload[i];
        }
        
        // Зчитуємо стовпці у визначеному алфавітному порядку
        let result = "";
        for (let i = 0; i < cols; i++) {
            result += grid[order[i]];
        }
        return `T1:${result}`;
    }
    
    return text;
};

export const decryptMessage = (text, cipherType, shift = "3") => {
    if (!text) return '';
    if (cipherType === 'none') return text;
    if (cipherType === 'sdes') return decryptSDES(text, shift);
    
    if (cipherType === 'caesar') {
        const s = parseInt(shift, 10) || 0;
        return text.split('').map(char => String.fromCharCode(char.charCodeAt(0) - s)).join('');
    }

    if (cipherType === 'transposition') {
        const isVerifiedTransposition = text.startsWith('T1:');
        const payload = isVerifiedTransposition ? text.slice(3) : text;
        let kw = normalizeTranspositionKey(shift);
        let cols = kw.length;
        let order = kw.split('').map((c, i) => ({c, i})).sort((a,b) => a.c.localeCompare(b.c)).map(x => x.i);
        
        const rows = Math.ceil(payload.length / cols);
        const numLongCols = payload.length % cols === 0 ? cols : payload.length % cols;

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
            extractedCols[originalIndex] = payload.slice(currentIndex, currentIndex + len);
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
        if (isVerifiedTransposition) {
            const keyMarker = `SCL1:${kw}:`;
            if (!decrypted.startsWith(keyMarker)) return null;
            return decrypted.slice(keyMarker.length);
        }
        return decrypted;
    }
    
    return text;
};