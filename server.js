const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000
const elasticsearch = require('elasticsearch')

var es = new elasticsearch.Client({
  host: process.env.ES_URL || 'http://localhost:9200',
  httpAuth: process.env.ES_HTTP_AUTH || ''
});

var index = process.env.ES_INDEX || 'json';

es.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: 3000
}, function (error) {
  if (error) {
    console.trace('ElasticSearch cluster is down!');
    process.exit(1); 
  } else {
    console.log('ElasticSearch cluster is reachable.');
  }
});

// create application/json parser
var jsonParser = bodyParser.json()

app.param(['MESSAGE','TO'], function (req, res, next, value) {
  console.log(`value: ${value}`)
  next()
});

app.get('/', (request, response) => {
  console.log('GET /')
  response.status(200).json({ success: true })
})

app.post('/', jsonParser, (request, response) => {
  console.log('POST /')
  console.log(request.body)

  var now = new Date()
  var yyyymmdd = now.toISOString().substring(0, 10);

  var payload = request.body;
  if(payload && ! payload.timestamp) {
    payload.timestamp = now;
  }

  var data = {
    index: `${index}-${yyyymmdd}`,
    type: 'webhook',
    id: `${now}`,
    body: request.body
  };

  es.index(data, function (err, resp) {
    if(err) {
      var pretty = JSON.stringify(resp, null, 4)
      console.log(`ElasticSearch create error: ${err}: ${pretty}: ${data}`)
      response.status(500).json({ success: false })
    } else {
      console.log(`ElasticSearch created: ${data}`)
      response.status(200).json({ success: true })
    }
  });

})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
