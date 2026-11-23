export const DH_P = 101n;
export const DH_G = 5n;

export const modPow = (base, exponent, modulus) => {
    let result = 1n;
    let b = BigInt(base) % BigInt(modulus);
    let e = BigInt(exponent);
    const m = BigInt(modulus);
    while (e > 0n) {
        if (e & 1n) result = (result * b) % m;
        e >>= 1n;
        b = (b * b) % m;
    }
    return result;
};

export const generatePrivateKey = () => {
    const randomBytes = new Uint8Array(2);
    window.crypto.getRandomValues(randomBytes);
    const randomValue = 100 + (((randomBytes[0] << 8) | randomBytes[1]) % 900);
    return String(randomValue);
};

export const computePublicKey = privateKeyStr =>
    modPow(DH_G, BigInt(privateKeyStr), DH_P).toString();

export const computeSharedSecret = (otherPublicKeyStr, myPrivateKeyStr) =>
    modPow(BigInt(otherPublicKeyStr), BigInt(myPrivateKeyStr), DH_P).toString();

const EMOJI_64 = [
    '🦊','🔑','⚡','🛡️','🚀','💎','🌿','🌙','⭐','🔥','🐢','🌊','🍀','🦉','🌸','🧩','🎃','🎯','🎲','🪐','🐺','🦁','🐼','🐯','🦋','🐙','🦀','🐝','🦄','🐲','👑','🌈','❄️','☀️','🌵','🍄','🎸','🎨','📚','🧭','🗝️','🏆','🎁','📡','⏳','🧊','🪶','🌴','🌋','🌺','🍇','🥨','🥕','🍯','🥝','🧿','🔮','🪩','🫐','🌻','🍓','🧁','🎮','🪁'
];

export const generateEmojiFingerprint = sharedSecret => {
    let value = BigInt(sharedSecret);
    const emojis = [];
    for (let i = 0; i < 4; i++) {
        value = (value * 1103515245n + 12345n) % DH_P;
        emojis.push(EMOJI_64[Number(value % 64n)]);
    }
    return emojis;
};

export const deriveSDESKey = sharedSecret =>
    (BigInt(sharedSecret) % 1024n).toString(2).padStart(10, '0');

export const deriveCaesarShift = sharedSecret => {
    const shift = Number(BigInt(sharedSecret) % 32n);
    return shift === 0 ? 32 : shift;
};
