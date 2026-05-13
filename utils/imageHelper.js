const sharp = require('sharp');

/**
 * Compresses an image buffer and returns a base64 data URI.
 * @param {Object} file - The file object from multer (memoryStorage)
 * @returns {Promise<string|null>}
 */
const compressImage = async (file) => {
    if (!file || !file.buffer) return null;
    try {
        const buffer = await sharp(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer();
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error('compressImage error:', error);
        return null;
    }
};

module.exports = { compressImage };
