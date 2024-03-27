aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 565692740138.dkr.ecr.eu-west-2.amazonaws.com
docker build -t bedrocksummariser .
docker tag bedrocksummariser:latest 565692740138.dkr.ecr.eu-west-2.amazonaws.com/bedrocksummariser:latest
docker push 565692740138.dkr.ecr.eu-west-2.amazonaws.com/bedrocksummariser:latest
aws ecs update-service --cluster eu-west-2-ecs --service bedrock-summariser --force-new-deployment --region eu-west-2