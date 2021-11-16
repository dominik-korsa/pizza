FROM node:17
WORKDIR /app
ADD package.json /tmp/app/
RUN cd /tmp/app && npm install
RUN mv /tmp/app/node_modules /app
COPY . /app
EXPOSE 80
CMD ["npm", "run", "start"]
