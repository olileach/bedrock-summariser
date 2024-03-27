import boto3

region = "eu-west-2"

transcribe_client = boto3.client('transcribe', region_name=region)

response = transcribe_client.list_transcription_jobs()

for job in response['TranscriptionJobSummaries']:
    job_id = job['TranscriptionJobName']
    print(f"Deleting {job}")
    transcribe_client.delete_transcription_job(TranscriptionJobName=job_id)
    print(f"Deleted {job_id}")