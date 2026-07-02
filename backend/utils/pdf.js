const path = require('path');
const fs = require('fs');

let browserInstance = null;

async function getBrowser() {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const puppeteer = require('puppeteer');
  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });

  return browserInstance;
}

async function convertHtmlToPdf(htmlFilePath, pdfFilePath) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const fileUrl = `file://${path.resolve(htmlFilePath)}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.pdf({
      path: pdfFilePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    return pdfFilePath;
  } finally {
    await page.close();
  }
}

async function generateInvitationPdf(htmlFilePath, guestUuid) {
  const pdfFileName = `invitation-${guestUuid}.pdf`;
  const pdfFilePath = path.join(path.dirname(htmlFilePath), pdfFileName);

  await convertHtmlToPdf(htmlFilePath, pdfFilePath);

  if (!fs.existsSync(pdfFilePath)) {
    throw new Error('PDF generation failed — file not created');
  }

  return `/uploads/invitations/${pdfFileName}`;
}

async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

module.exports = {
  convertHtmlToPdf,
  generateInvitationPdf,
  closeBrowser,
};
