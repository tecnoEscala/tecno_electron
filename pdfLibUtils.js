const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

/**
 * Example function to modify a PDF using pdf-lib
 * @param {string} inputPath - Path to the input PDF
 * @param {string} outputPath - Path to save the modified PDF
 */
async function modifyPdf(inputPath, outputPath) {
    try {
        const existingPdfBytes = fs.readFileSync(inputPath);

        // Load a PDFDocument from the existing PDF bytes
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Embed the Helvetica font
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Get the first page of the document
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Get the width and height of the first page
        const { width, height } = firstPage.getSize();

        // Draw a string of text diagonally across the first page
        firstPage.drawText('This text was added with pdf-lib!', {
            x: 5,
            y: height / 2 + 300,
            size: 50,
            font: helveticaFont,
            color: rgb(0.95, 0.1, 0.1),
            rotate: { type: 'degrees', angle: 45 },
        });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();

        // Write the bytes to a file
        fs.writeFileSync(outputPath, pdfBytes);
        console.log(`PDF modified and saved to ${outputPath}`);
    } catch (err) {
        console.error('Error modifying PDF:', err);
        throw err;
    }
}

/**
 * Example function to encrypt a PDF using pdf-lib
 * This can replace parts of qpdf functionality
 * @param {string} inputPath - Path to the input PDF
 * @param {string} outputPath - Path to save the encrypted PDF
 * @param {string} password - User password
 * @param {string} ownerPassword - Owner password
 */
async function encryptPdfLib(inputPath, outputPath, password, ownerPassword) {
    try {
        const existingPdfBytes = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Encrypt the PDF
        // permissions options allow you to restrict printing, copying, etc.
        pdfDoc.encrypt({
            userPassword: password,
            ownerPassword: ownerPassword,
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: true,
                fillingForms: true,
                contentAccessibility: false,
                documentAssembly: false,
            },
        });

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);
        console.log(`PDF encrypted and saved to ${outputPath}`);
    } catch (err) {
        console.error('Error encrypting PDF:', err);
    }
}

const forge = require('node-forge');

/**
 * Example function to sign a PDF (conceptually) using node-forge for crypto operations.
 * NOTE: pdf-lib does not support digitally signing PDFs directly (placing the signature dict).
 * You usually need a library like `node-signpdf` for the final step.
 * However, we can use node-forge to extract the PrivateKey and Certificate from a .p12 file.
 * 
 * @param {string} p12Path - Path to the .p12 certificate file
 * @param {string} password - Password for the .p12 file
 */
function extractCertFromP12(p12Path, password) {
    try {
        const p12Buffer = fs.readFileSync(p12Path);
        const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

        // Get the private key
        // In a real P12, you'd iterate bags to find the right one. 
        // This is a simplified example assuming typical structure.
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const bag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
        const privateKey = bag.key;

        // Get the certificate
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = certBags[forge.pki.oids.certBag][0];
        const certificate = certBag.cert;

        console.log('Successfully extracted private key and certificate from P12.');
        return {
            privateKey,
            certificate
        };
    } catch (err) {
        console.error('Error extracting from P12:', err);
        throw err;
    }
}

const signer = require('node-signpdf').default;
const { plainAddPlaceholder } = require('@signpdf/placeholder-plain');

/**
 * Sign a PDF file using a .p12 certificate and password
 * @param {string} pdfPath - Path to the PDF to sign
 * @param {string} p12Path - Path to the P12 certificate
 * @param {string} password - Password for the P12 certificate
 * @param {string} outputPath - Path to save the signed PDF (optional, defaults to overwriting or a new file)
 */
async function signPdf(pdfPath, p12Path, password, outputPath) {
    try {
        const pdBuffer = fs.readFileSync(pdfPath);
        const p12Buffer = fs.readFileSync(p12Path);

        // Add a placeholder signature
        // The plainAddPlaceholder function adds a visual signature placeholder (invisible or visible usually)
        // and prepares the PDF for signing.
        const pdfWithPlaceholder = plainAddPlaceholder({
            pdfBuffer: pdBuffer,
            reason: 'Digital Signature',
            contactInfo: 'tecnoescala',
            name: 'Tecnoescala',
            location: 'Quito, Ecuador',
        });

        // Sign the PDF
        // node-signpdf v3 takes a buffer and returns a signed buffer.
        // It expects the P12 buffer and the password options.
        const signedPdfBuffer = signer.sign(pdfWithPlaceholder, p12Buffer, { passphrase: password });

        const finalOutput = outputPath || pdfPath.replace('.pdf', '_signed.pdf');
        fs.writeFileSync(finalOutput, signedPdfBuffer);
        console.log(`PDF successfully signed and saved to ${finalOutput}`);
    } catch (err) {
        console.error('Error signing PDF:', err);
        throw err;
    }
}

module.exports = {
    modifyPdf,
    encryptPdfLib,
    extractCertFromP12,
    signPdf
};
