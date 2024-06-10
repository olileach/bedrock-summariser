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

const { S3Client, 
        PutObjectCommand,
        DeleteObjectCommand } = require("@aws-sdk/client-s3");
const res = require("express/lib/response");
const uuid = require('uuid');
const variables = require("./variables.js");

async function s3client(){

  var region = variables.region;
  var creds = variables.creds;
  const s3Client = new S3Client({
    region: region,
    credentials: creds
  });
  return s3Client
}

async function s3deleteObject(payload){

  const client = await s3client()

  var s3bucket = payload['s3bucket'];
  var s3key = payload['s3key'];

  console.log("Deleting S3 object - " + s3key + " in bucket " + s3bucket)

  const command = new DeleteObjectCommand({
    Bucket: s3bucket,
    Key: s3key,
  });

  try {
    const response = await client.send(command);
    console.log("Success - deleted S3 object " + JSON.stringify(response));
  } catch (err) {
    console.error(err);
  };
};

async function s3upload(blob){

  const keyUuid = uuid.v4()
  var region = variables.region;
  var bucketName = "account-bucket-" + region;
  var endpoint = bucketName + ".s3." + region + ".amazonaws.com";
  var key = "blob/" + keyUuid + ".ogg";
  var tag = ("blob=%s", keyUuid);

  if (variables.environment == "dev"){
    var creds =  {
      accessKeyId: variables.accessKey,
      secretAccessKey: variables.secretAccessKey,
    }
  }

  const client = await s3client()

  const input = {
    "Body": blob,
    "Region": region,
    "Endpoint": endpoint,
    "Bucket": bucketName,
    "Key": key,
    "ServerSideEncryption": "AES256",
    "Tagging": "blob="+tag,
  };

  const command = new PutObjectCommand(input);
  
  try{
    const response = await client.send(command);
    var resonseObj = {
      "response":response, 
      "s3key":key, 
      "s3endpoint":endpoint,
      "s3bucket":bucketName
    }
    console.log(resonseObj);
    return (resonseObj);
  }
  catch(err){
    console.log(err);
  }
}

module.exports = { s3upload , s3deleteObject};