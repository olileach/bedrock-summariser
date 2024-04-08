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

const variables = require("./variables.js");
const { BedrockRuntimeClient,
        InvokeModelCommand} = require("@aws-sdk/client-bedrock-runtime");
const { BedrockClient,
        ListFoundationModelsCommand,} = require("@aws-sdk/client-bedrock");

if (variables.environment == "dev"){
  var creds =  {
    accessKeyId: variables.accessKey,
    secretAccessKey: variables.secretAccessKey,
  }
}

// Create a new Bedrock Runtime client instance.
async function bedrockClient (){
  var client = new BedrockRuntimeClient({ 
    region: variables.bedrockRegion,
    credentials: creds
  });
  return client
}

// Function to invoke a Bedrock Model.
const invokeModel = async (text_input, modelId = "anthropic.claude-v2:1") => {

  console.log(modelId)
  var client = await bedrockClient();

  // var payload;

  // if (modelId.includes("amazon.")){
  //   console.log("Using Amazon mode inputs for " + modelId);
  //   payload = {
  //     modelId: modelId,
  //     contentType: "application/json",
  //     accept: "application/json",
  //     body: JSON.stringify({
  //       inputText: text_input,
  //     }),
  //   };

  // }

  // if (modelId.includes("anthropic.")){
  //   console.log("Using Amazon mode inputs for " + modelId);
  //   payload = {
  //     anthropic_version: "bedrock-2023-05-31",
  //     max_tokens: 4096,
  //     messages: [
  //       {
  //         role: "user",
  //         content: [{ type: "text", text: text_input }],
  //       },
  //     ],
  //   };
  // }
 
  // Prepare the payload for the Messages API request.
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: text_input }],
      },
    ],
  };

  // Invoke Claude with the payload and wait for the response.
  const command = new InvokeModelCommand({
    contentType: "application/json",
    body: JSON.stringify(payload),
    modelId,
  });

  //const command = new InvokeModelCommand(payload);
  
  try{

    const apiResponse = await client.send(command);
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    /** @type {MessagesResponseBody} */
    const responseBody = JSON.parse(decodedResponseBody);
    console.log(responseBody.content[0].text);
    return responseBody.content[0].text;
  }
  catch(err){

    console.log(err)
    return err
  }
}

async function listModels() {

  const client = new BedrockClient({
    region: variables.bedrockRegion,
  });
  
  // Configure input to only use TEXT and ON_DEMAND foundational models.
  const input = {
    // byProvider: "Anthropic",
    // byProvider: 'STRING_VALUE',
    // byCustomizationType: 'FINE_TUNING' || 'CONTINUED_PRE_TRAINING',
    byOutputModality: 'TEXT',
    byInferenceType: 'ON_DEMAND', // || 'PROVISIONED',
  };

  const command = new ListFoundationModelsCommand(input);

  const response = await client.send(command);

  var models = [];
  var providers = [];
  
  for (i in response['modelSummaries']){
    console.log((response['modelSummaries']))
    var model = response['modelSummaries'][i]['modelId'];
    var provider = response['modelSummaries'][i]['providerName']
    if (!providers.includes(provider)){
      providers.push(provider)
    }
    if (!models.includes(model)){
      models.push(model)
    }
  }
  console.log("List of available providers " + providers);
  console.log("List of available models " + models);
  return(models);
};

module.exports = { invokeModel, listModels };