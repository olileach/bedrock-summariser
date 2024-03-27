FROM --platform=linux/amd64 node:latest
WORKDIR /app
COPY --chown=node:node . .
RUN npm install
EXPOSE 8080
CMD ["node","src/app.js"]