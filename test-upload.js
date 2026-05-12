const fs = require('fs');
// Removed node-fetch require
// The environment is Node 24.14.1, so fetch is native!

async function testUpload() {
    try {
        const formData = new FormData();
        formData.append('coin_id', '9999');
        formData.append('coin_name', 'TestCoin');
        formData.append('wallet_network', 'TestNet');
        formData.append('coin_symbol', 'TST');
        formData.append('wallet_address', '0xTestAddress');
        
        // Create dummy file blobs
        const dummyImage = new Blob(['dummy image content'], { type: 'image/png' });
        formData.append('coin_logo', dummyImage, 'logo.png');
        formData.append('documents', dummyImage, 'qr.png');

        const response = await fetch('http://localhost:5000/api/v1/wallets', {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', text);
    } catch (e) {
        console.error(e);
    }
}

testUpload();
