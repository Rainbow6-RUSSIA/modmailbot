const fs = require('fs');
const https = require('https');
const config = require('../config');
const {promisify} = require('util');

const getUtils = () => require('../utils');

const access = promisify(fs.access);
const readFile = promisify(fs.readFile);

const attachmentDir = config.attachmentDir || `${__dirname}/../../attachments`;

const attachmentSavePromises = {};

function getPath(attachmentId) {
  return `${attachmentDir}/${attachmentId}`;
}

async function saveAttachment(attachment) {
  if (attachmentSavePromises[attachment.id]) {
    return attachmentSavePromises[attachment.id];
  }

  const filepath = getPath(attachment.id);
  try {
    // If the file already exists, resolve immediately
    await access(filepath);
    return;
  } catch (e) {}

  attachmentSavePromises[attachment.id] = saveAttachmentInner(attachment);
  attachmentSavePromises[attachment.id]
    .then(() => {
      delete attachmentSavePromises[attachment.id];
    }, () => {
      delete attachmentSavePromises[attachment.id];
    });

  return attachmentSavePromises[attachment.id];
}

function saveAttachmentInner(attachment, tries = 0) {
  return new Promise((resolve, reject) => {
    if (tries > 3) {
      console.error('Attachment download failed after 3 tries:', attachment);
      reject('Attachment download failed after 3 tries');
      return;
    }

    const filepath = getPath(attachment.id);
    const writeStream = fs.createWriteStream(filepath);

    https.get(attachment.url, (res) => {
      res.pipe(writeStream);
      writeStream.on('finish', () => {
        writeStream.end();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath);
      console.error('Error downloading attachment, retrying');
      resolve(saveAttachmentInner(attachment, tries++));
    });
  });
}

function saveAttachmentsInMessage(msg) {
  if (! msg.attachments || msg.attachments.length === 0) return Promise.resolve();
  return Promise.all(msg.attachments.map(saveAttachment));
}

function getUrl(attachmentId, desiredName = null) {
  if (desiredName == null) desiredName = 'file.bin';
  return getUtils().getSelfUrl(`attachments/${attachmentId}/${desiredName}`);
}

async function attachmentToFile(attachment) {
  await saveAttachment(attachment);
  const data = await readFile(getPath(attachment.id));
  return {attachment: data, name: attachment.filename};
}

module.exports = {
  getPath,
  saveAttachment,
  saveAttachmentsInMessage,
  getUrl,
  attachmentToFile
};
