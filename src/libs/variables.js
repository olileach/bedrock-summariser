const region = 'eu-west-2';
const bucketName = "account-bucket-"+region;
const bedrockRegion = 'us-east-1'

var accessKey
var secretAccessKey
var environment

module.exports={
    region,
    accessKey,
    secretAccessKey,
    bucketName,
    environment,
    bedrockRegion
}