# FROM iron/node
FROM node:latest
WORKDIR /app
COPY . /app

# ENV TASK_QUEUE_URL
# ENV AWS_REGION

ENTRYPOINT [ "node", "hello-worker.js" ]
