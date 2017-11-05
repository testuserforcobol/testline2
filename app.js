'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const cobolscript = require('cobolscript');

const hookConsoleLog = (logs) => {
    console.log = (d) => logs.push(d);
};


const defaultAccessToken = 'defaultValue';
const defaultSecret = 'defaultValue';

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
  channelSecret: process.env.CHANNEL_SECRET || defaultSecret,
};

const client = new line.Client(config);

const app = express();

process.on('unhandledRejection', console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  var webclient = require('request');
  webclient.post({
    url: 'https://api.a3rt.recruit-tech.co.jp/talk/v1/smalltalk',
    form: { apikey: process.env.a3rt_talk_apikey, query: event.message.text },
    json: true
  }, function (err, response, body) {
    var logs = [];
    var program = cobolscript.compileProgramFile('./hello.cob');
    hookConsoleLog(logs);
    program.run(cobolscript.getRuntime());

    var a3rtMsg;
    if (body.status == 0) {
        a3rtMsg = body.results[0].reply;
    } else {
        a3rtMsg = event.message.text;
    }
    var msgtext = a3rtMsg + '\n' + logs.join('\n');
    const echo = { type: 'text', text: msgtext };
    return client.replyMessage(event.replyToken, echo);
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
