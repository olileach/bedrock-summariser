// MIT License

// Copyright (c) 2024 Oli Leach

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const { StartTranscriptionJobCommand,
        TranscribeClient,
        GetTranscriptionJobCommand,
        DeleteTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const uuid = require('uuid');
const variables = require("./variables.js");

if (variables.environment == "dev"){
  var creds =  {
    accessKeyId: variables.accessKey,
    secretAccessKey: variables.secretAccessKey,
  }
}
// Sleeep function for retry purposes

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Transcribe client
async function transcribeClient (){
  var client = new TranscribeClient({ 
    region: variables.region,
    credentials: creds
  });
  return client
}

// Delete a transcribe job
async function deleteJob(payload){

  this.jobName = payload['jobName'];
  this.client = await transcribeClient();

  const params = {
    TranscriptionJobName: this.jobName, // Required. For example, 'transciption_demo'
  };

  try {
    const data = await this.client.send(
      new DeleteTranscriptionJobCommand(params)
    );
    console.log("Success - deleted job " + this.jobName);
    return data; // For unit tests.
  } catch (err) {
    console.log("Error", err);
  }
}

// Transcribe a job and wait for the results
async function transcribeJob(payload){

  const keyUuid = uuid.v4()
  var transcriptionJob = "job-"+ keyUuid
  var s3key = payload['s3key'];
  var s3endpoint = payload['s3endpoint'];
  var s3ObjectUrl = "https://" + s3endpoint + "/" + s3key;
  this.client = await transcribeClient();

  console.log("payload from transcribe")

  if (variables.environment == "dev"){
    var creds =  {
    accessKeyId: variables.accessKey,
    secretAccessKey: variables.secretAccessKey,
    }
  }

  const params = {
    TranscriptionJobName: transcriptionJob,
    LanguageCode: "en-GB",
    MediaFormat: "ogg",
    Media: {
    MediaFileUri: s3ObjectUrl,
    },
  };

  const transcribeJob = async () => {

    this.responseObj = {};

    try {
      const data = await this.client.send(
      new StartTranscriptionJobCommand(params)
    );
      console.log("Success - transcription job started. Getting results.");
      return data.TranscriptionJob.TranscriptionJobStatus;
    } 
    catch (err) {
      console.log("Error getting transcribe job results", err);
    }
  };

  const transcribeJobResultChecker = async () => {

    try{

      const jobData = await this.client.send(new GetTranscriptionJobCommand(params));
      const jobStatus = jobData.TranscriptionJob.TranscriptionJobStatus;

    if (jobStatus === "COMPLETED") {
      console.log("Job is " + jobStatus + ". Getting transcribe URL.");
      console.log("Transcribe URL:", jobData.TranscriptionJob.Transcript.TranscriptFileUri);

      await fetch(jobData.TranscriptionJob.Transcript.TranscriptFileUri)
        .then(async (response) => response.text())
        .then(async (body) => {
          console.log(body)
          response = JSON.parse(body);
          this.responseObj = {
            "jobTextResult":response.results.transcripts[0].transcript, 
            "jobName":transcriptionJob
          };
        }
      );
    }

    else if (jobStatus === "FAILED") {
      console.log("Failed:", data.TranscriptionJob.FailureReason);
      jobStatusResult = jobStatus;
    }

    else {
      console.log("Job is " + jobStatus + ". Rechecking job status.");
      await sleep(2000);
      await transcribeJobResultChecker();
    }
  } 
  catch (err) {
      console.log("Error", err);
      jobStatusResult = err;
  }
  return this.responseObj;
  }

  const jobResults = await transcribeJob();
  console.log("transcribeJob " + jobResults);
  const jobResultsChecker = await transcribeJobResultChecker();
  console.log("jobResultsChecker " + JSON.stringify(jobResultsChecker))
  return jobResultsChecker;

}

module.exports = { transcribeJob, deleteJob };
