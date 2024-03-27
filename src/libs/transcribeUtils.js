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
        GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const uuid = require('uuid');
const variables = require("./variables.js");

// TranscriptionJobStatus:
//   readonly COMPLETED: "COMPLETED"
//   readonly FAILED: "FAILED";
//   readonly IN_PROGRESS: "IN_PROGRESS";
//   readonly QUEUED: "QUEUED";
//

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function transcribeJob(payload){

  const keyUuid = uuid.v4()
  var region = "eu-west-2";
  var transcriptionJob = "job-"+ keyUuid
  var s3key = payload['s3key'];
  var s3endpoint = payload['s3endpoint'];
  var s3ObjectUrl = "https://" + s3endpoint + "/" + s3key
  var jobStatusResult

  console.log("payload from transcribe")

  if (variables.environment == "dev"){
    var creds =  {
      accessKeyId: variables.accessKey,
      secretAccessKey: variables.secretAccessKey,
    }
  }

  const transcribeClient = new TranscribeClient({ 
    region: region,
    credentials: creds
  });

  const params = {
    TranscriptionJobName: transcriptionJob,
    LanguageCode: "en-GB",
    MediaFormat: "ogg",
    Media: {
      MediaFileUri: s3ObjectUrl,
    },
  };

  const transcribeJob = async () => {
    try {
      const data = await transcribeClient.send(
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

      const jobData = await transcribeClient.send(new GetTranscriptionJobCommand(params));
      const jobStatus = jobData.TranscriptionJob.TranscriptionJobStatus;

      if (jobStatus === "COMPLETED") {
        console.log("Job is " + jobStatus + ". Getting transcribe URL.");
        console.log("Transcribe URL:", jobData.TranscriptionJob.Transcript.TranscriptFileUri);

        await fetch(jobData.TranscriptionJob.Transcript.TranscriptFileUri)
          .then(async (response) => response.text())
          .then(async (body) => {
              console.log(body)
              response = JSON.parse(body);
              response.results.transcripts.forEach(async element => {
                console.log('Returning Transcribe job results ')
                jobStatusResult = element.transcript;
            })
        });
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
    return jobStatusResult;
  }

  const jobResults = await transcribeJob();
  console.log("transcribeJob " + jobResults);
  const jobResultsChecker = await transcribeJobResultChecker();
  console.log("jobResultsChecker " + jobResultsChecker)
  return jobResultsChecker;

}
module.exports = { transcribeJob };
