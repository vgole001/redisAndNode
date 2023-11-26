FROM node:18

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

EXPOSE 8080
CMD ["npm", "start"]