/**
 * Converts an IPv4 address from its dotted-quad string representation to a 32-bit number.
 * @param {string} a - The IPv4 address in dotted-quad format (e.g., "192.168.1.1").
 * @returns {number} The numeric representation of the IPv4 address.
 */
function inetAton(a) {
    const octets = a.split('.').map(Number);
    if (octets.length !== 4 || octets.some(octet => isNaN(octet) || octet < 0 || octet > 255)) {
        throw new Error('Invalid IPv4 address format');
    }
    return (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];
}

/**
 * Converts a 32-bit number to its dotted-quad string representation as an IPv4 address.
 * @param {number} n - The numeric representation of the IPv4 address.
 * @returns {string} The IPv4 address in dotted-quad format.
 */
function inetNtoa(n) {
    if (isNaN(n) || n < 0 || n > 0xFFFFFFFF) {
        throw new Error('Invalid numeric IPv4 address');
    }
    return `${(n >>> 24)}.${(n >> 16) & 0xFF}.${(n >> 8) & 0xFF}.${n & 0xFF}`;
}

/**
 * Compares two Buffer objects for equality.
 * @param {Buffer} a - The first buffer.
 * @param {Buffer} b - The second buffer.
 * @returns {boolean} True if the buffers are equal, false otherwise.
 */
function bufferCompare(a, b) {
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b) || a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

module.exports = {
    inetAton,
    inetNtoa,
    bufferCompare
};
