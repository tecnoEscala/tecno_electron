import fs from 'fs';
import fetch, { fileFromSync } from 'node-fetch';

async function pdfProtectInApi(filepath) {

    console.log('****** Start protect pdf process ******');

    let form = new FormData();

    form.append('fileInput', fileFromSync(filepath));
    form.append('ownerPassword', 'tecnotecno');
    form.append('password', 'tecnotecno');
    form.append('keyLength', '256');

    const headers = {
        'accept': '*/*',
        'X-API-KEY': 'a126298c-b5ff-435a-8824-b9b87e4c324d',
    }

    fetch('https://pdf.app.tecnoescala.com.ec/api/v1/security/add-password', {
        method: 'POST',
        headers: headers,
        body: form
    }).then(res => {
        const writableStream = fs.createWriteStream('report.pdf');
        res.body.on('data', (chunk) => {
            writableStream.write(chunk);
        });
    }).catch(err => {
        console.error(err);
    });

}

pdfProtectInApi("D:\\Amazon_card_sleeves.pdf");