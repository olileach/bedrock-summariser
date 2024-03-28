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

app.use(cors(), function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(cors());

// express routes

// this route returns the index HTML page
app.get('/', function(req,res){
  res.render('recorder', {test: ""});
});

app.get('/texter', function(req,res){
  res.render('recorder', {test: ""});
});

app.post('/api/transcribe', express.raw({type: "*/*", limit: '2000mb'}), async function (req, res) {

  try {
      const s3response = await s3Utils.s3upload(req.body);
      const transcribeText = await transcribeUtils.transcribeJob(s3response);
      // check if transcribeText is not empty otherwise return a message
      if (transcribeText){
        const bedrockSummary = await bedrockUtils.invokeModel(transcribeText);
        console.log("this is the value " + bedrockSummary)
        res.send(bedrockSummary);
      } else {
        res.send("I didn't get any text to summarise. Did you say anything? Perhaps, try that again.");
      }
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
    console.log("Running in a Dev Environment")
  }
});

process.on('SIGTERM', () => {
    process.debug('SIGTERM signal received: closing HTTP server')
    server.close(() => {
    process.debug('HTTP server closed')
  })
})
