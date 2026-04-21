const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const uploadToAzure = async (file) => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(
        process.env.AZURE_CONTAINER_NAME
    );

    // Buat nama file unik agar tidak bentrok
    const blobName = Date.now() + "-" + file.originalname;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Unggah file dari buffer (RAM)
    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    // Kembalikan URL publik file tersebut
    return blockBlobClient.url;
};

module.exports = { uploadToAzure };