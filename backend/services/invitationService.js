const { generateInvitationCard } = require('../utils/invitation');
const { generateInvitationPdf } = require('../utils/pdf');

async function createInvitation(guest, event, qrCodePath) {
  const { htmlPath, htmlFilePath } = await generateInvitationCard(guest, event, qrCodePath);

  let pdfPath = null;
  try {
    pdfPath = await generateInvitationPdf(htmlFilePath, guest.uuid);
  } catch (error) {
    console.error('PDF generation failed — HTML invitation saved:', error.message);
  }

  return {
    htmlPath,
    pdfPath,
    invitationPath: pdfPath || htmlPath,
  };
}

module.exports = { createInvitation };
