FROM node:20-alpine AS BUILD

WORKDIR /app
COPY . /app
RUN npm install
RUN npm run build
RUN cp ./package*.json ./dist/
WORKDIR /app/dist
RUN npm install --omit=dev

FROM node:20-alpine
COPY --from=BUILD /app/dist ./app
WORKDIR /app
RUN touch database.sqlite logs.log

CMD node index.js
