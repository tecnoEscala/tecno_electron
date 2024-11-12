import fs from 'fs';
import os from 'os';
import fetch, { fileFromSync } from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function pdfProtectInApi(filepath) {

    console.log('****** Start protect pdf process ******');

    let form = new FormData();
    // var f = new File([filepath], fileName, { type: "application/pdf" });

    // var binaryData = fs.readFileSync(filepath);
    // var file =new File(fs.readFileSync(filepath), fileName, { type: "application/pdf" });

    let file = fileFromSync(filepath);

    form.append('fileInput', file); // application/pdf
    // form.append('fileInput', f);
    form.append('ownerPassword', 'tecnotecno');
    form.append('password', 'tecnotecno');
    form.append('keyLength', '256');

    const headers = {
        'accept': '*/*',
        'X-API-KEY': 'a126298c-b5ff-435a-8824-b9b87e4c324d',
        // 'Content-Type': `multipart/form-data`
    }

    // let res = await fetch('https://pdf.app.tecnoescala.com.ec/api/v1/security/add-password', {
    //     method: 'POST',
    //     headers: headers,
    //     body: form
    // });

    // console.log(await res.text());

    fetch('https://pdf.app.tecnoescala.com.ec/api/v1/security/add-password', {
        method: 'POST',
        headers: headers,
        body: form
    }).then(res => {
        console.log('stirlingResponse');
        // if (response.status >= 400) { throw new Error("Bad response from server"); }
        console.log(res.body.toString());
        // fs.writeFileSync('D:\\upload.pdf', typeof res.body);

        // console.log(response.status);
    }).catch(err => {
        console.error(err);
    });



    // axios.post('https://pdf.app.tecnoescala.com.ec/api/v1/security/add-password', form, { headers: headers })
    //   .then(function (response) {
    //     createFileInSystem(filepath, response, context);
    //     console.log('stirlingResponse');
    //   })
    //   .catch(function (error) {
    //     console.log('stirlingError', error.message);
    //     clipboard.writeText(error.toString());
    //   });
}

pdfProtectInApi("D:\\Amazon_card_sleeves.pdf");