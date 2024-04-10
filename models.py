import boto3
import json

client = boto3.client('bedrock')


res= client.list_foundation_models()

for x in res['modelSummaries']:
    if 'IMAGE' in x['inputModalities']:
        print(x['modelName'])
        print(x['inputModalities'])
        print(x['modelId'])
