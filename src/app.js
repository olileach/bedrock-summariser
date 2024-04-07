// loading libraries
const express = require('express');
const cookieParser = require("cookie-parser");
const s3Utils = require("./libs/s3Utils.js");
const transcribeUtils = require("./libs/transcribeUtils.js");
const bedrockUtils = require("./libs/bedrockUtils.js");
const variables = require("./libs/variables.js");

// configure express
const path = __dirname + '/';
const app = express();

// app configuration
app.use(express.static(path));
app.set('view engine', 'ejs');
app.set('views', './src/assets/views/');
app.use(cookieParser());
const cors = require('cors')

// CORS config
app.use(cors(), function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(cors());

// express header config
app.use(
  express.raw({
    inflate: true,
    limit: '2000mb',
    type: () => true, // this matches all content types
  })
);

// express routes

// this route returns the index HTML page
app.get('/', function(req,res){
  res.render('recorder', {test: ""});
});

app.get('/question', function(req,res){
  res.render('question', {test: ""});
});

app.post('/api/question', async function (req, res) {

  var modelId = req.headers['x-model-name'];
  var questionInput = (req.body.toString());
  console.log("Using th4e following modelId: " + modelId);
  console.log("Got the following question: " +questionInput);
  
  if (!questionInput){
    res.send("I didn't get any text to summarise. Did you enter anything? Perhaps, try that again.");
  }
  else{
    const bedrockSummary = await bedrockUtils.invokeModel(questionInput, modelId);
    console.log("Value returned by Bedrock: " + bedrockSummary)
  } 
  
  if (bedrockSummary.stack) {
    res.send("We've hit this error message - try another model, e.g. anthropic.claude-v2 \n\n" 
    + bedrockSummary.message )
  }
  else { 
    res.send(bedrockSummary);
  };
});

app.get('/models', async function(req,res){
  res.render('models');
});

app.post('/api/models', async function(req,res){
  const models = await bedrockUtils.listModels();
  res.send(models);
});

app.post('/api/transcribe', express.raw({type: "*/*", limit: '2000mb'}), async function (req, res) {

  console.log(req.headers['x-model-name']);

  try {
    const s3response = await s3Utils.s3upload(req.body);
    const transcribeText = await transcribeUtils.transcribeJob(s3response);

    // If not response from Transcribe has returned, pass back a message to the client to try again.
    if (!transcribeText['jobTextResult']){
      res.send("I didn't get any text to summarise. Did you say anything? Perhaps, try that again.");
    }

    const bedrockSummary = await bedrockUtils.invokeModel(transcribeText['jobTextResult'],req.headers['x-model-name']);

    // check if transcribeText is not empty otherwise return a message

    if (bedrockSummary.name == "AccessDeniedException") {
      console.log("Model access is denied by Bedrock: " + (bedrockSummary.name + " " + bedrockSummary.message);
      res.send
        ("AccessDeniedException: You don't have access to the model with the specified model ID. "+
        "Speak to the website developer or try another model, e.g. anthropic.claude-v2.")
    } else if (bedrockSummary.stack) {
      console.log("Bedrock Stacktrace hit : " + bedrockSummary.stack)
      res.send("We've hit this error message - try another model, e.g. anthropic.claude-v2 \n\n" 
      + bedrockSummary.message )
    } else {
      console.log("Value returned by Bedrock: " + bedrockSummary)
      res.send(bedrockSummary) 
    }

    // Clean up s3 objects, tarnscript jobs etc..
    s3Utils.s3deleteObject(s3response);
    console.log(transcribeText['jobName'])
    transcribeUtils.deleteJob(transcribeText);

  }
  catch(err) {
    res.send("Oops - something went wrong. Try that again.");
  }
});

// server port & listener config
const port = 8080;

const server = app.listen(port, function () {
  console.log('Voice recorder app listening on port 8080')

  if (process.env.ENV == "dev"){
    variables.environment = "dev"
    variables.accessKey  = process.env.AWS_ACCESS_KEY_ID
    variables.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    console.log("Running in a Dev Environment in Docker.")
  }
});

process.on('SIGTERM', () => {
    process.debug('SIGTERM signal received: closing HTTP server')
    server.close(() => {
    process.debug('HTTP server closed')
  })
})
