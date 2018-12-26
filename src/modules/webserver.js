// const http = require('http');
const app = reqiure('express')();
const jwt = require('express-jwt');
const mime = require('mime');
const url = require('url');
const fs = require('fs');
const moment = require('moment');
const config = require('../config');
const threads = require('../data/threads');
const attachments = require('../data/attachments');
const useragent = require('useragent');

const {
  THREAD_MESSAGE_TYPE
} = require('../data/constants');

function genError(err) {
  const e = new Error();
  e.name = err;
  return e;
}

function checkAccess(req, res, next) {
  if (req.user.acc >= process.env.REQUIRED_ACCESS) {
    next();
  } else {
    throw genError('UnauthorizedError');
  }
}

module.exports = () => {
  // const server = http.createServer((req, res) => {
  //   const parsedUrl = url.parse(`http://${req.url}`);
  //   const pathParts = parsedUrl.path.split('/').filter(v => v !== '');

  //   if (parsedUrl.path.startsWith('/logs/')) {
  //     serveLogs(res, pathParts);
  //   } else if (parsedUrl.path.startsWith('/attachments/')) {
  //     serveAttachments(res, pathParts);
  //   } else {
  //     notfound(res);
  //   }
  // });
  app.use((err, req, res, next) => {
    switch (err.name) {
      case 'UnauthorizedError':
        const ua = useragent.is(req.headers['user-agent']);
        if (Object.values(ua).filter(v => typeof v === 'boolean').some(v => v)) res.redirect('https://google.com');
        else res.status(401).send('Invalid token');
        break;
      case 'NotFound':
        res.status(404).send('Not found');
        break;
      default:
        res.status(500).send('Internal error')
        break;
    }
  });

  app.get('/logs/:id', jwt({
    secret: process.env["256B_KEY"]
  }), checkAccess, async (req, res) => {
    const threadId = req.params.id;
    if (threadId.match(/^[0-9a-f\-]+$/) === null) throw genError('NotFound');

    const thread = await threads.findById(threadId);
    if (! thread) throw genError('NotFound');

    const threadMessages = await thread.getThreadMessages();
    const lines = threadMessages.map(message => {
      // Legacy messages are the entire log in one message, so just serve them as they are
      if (message.message_type === THREAD_MESSAGE_TYPE.LEGACY) {
        return message.body;
      }

      let line = `[${moment.utc(message.created_at).format('DD-MM-YYYY HH:mm:ss')} UTC] `;

      if (message.message_type === THREAD_MESSAGE_TYPE.SYSTEM) {
        // System messages don't need the username
        line += message.body;
      } else if (message.message_type === THREAD_MESSAGE_TYPE.FROM_USER) {
        line += `[ОТ ПОЛЬЗОВАТЕЛЯ] ${message.user_name}: ${message.body}`;
      } else if (message.message_type === THREAD_MESSAGE_TYPE.TO_USER) {
        line += `[К ПОЛЬЗОВАТЕЛЮ] ${message.user_name}: ${message.body}`;
      } else {
        line += `${message.user_name}: ${message.body}`;
      }

      return line;
    });

    // re
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.end(lines.join('\n'));
  })

  app.get('/attachments/:id', jwt({
    secret: process.env["256B_KEY"]
  }), checkAccess, async (req, res) => {
    const desiredFilename = req.params.id;
    const id = pathParts[pathParts.length - 2];

    if (id.match(/^[0-9]+$/) === null) throw genError('NotFound');
    if (desiredFilename.match(/^[0-9a-z._-]+$/i) === null) throw genError('NotFound');

    const attachmentPath = attachments.getPath(id);
    fs.access(attachmentPath, (err) => {
      if (err) throw genError('NotFound');

      const filenameParts = desiredFilename.split('.');
      const ext = (filenameParts.length > 1 ? filenameParts[filenameParts.length - 1] : 'bin');
      const fileMime = mime.getType(ext);

      res.setHeader('Content-Type', fileMime);

      const read = fs.createReadStream(attachmentPath);
      read.pipe(res);
    })
  })

  // TODO: some web archive with folders

  app.on('error', err => {
    console.log('[WARN] Web server error:', err.message);
  });

  app.listen(config.port);
};
