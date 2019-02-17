# Skapa slimmade containers
Som vi kan se med `docker image ls` så är en del containers onödigt stora. Speciellt när applikationen/koden som containern kör skrivits med komplierade språk som t ex. GO, C, C++. Det som krävs för att applikationen ska kunna köras är koden och de bibliotek som den refererar till, resten av operativsystemet används inte och är därmed onödigt och kan skalas bort.

## Grundupplägg
Vi utgår från en stor Node.JS image som bygger på Debian eller Ubuntu:
```Dockerfile
FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Copy package file and install dependencies
COPY ./app/package.json ./
RUN npm install

# Bundle app source
COPY ./app .

EXPOSE 8080
CMD [ "npm", "start" ]
```
Våran applikation ligger i app-katalogen, denna kopierar vi in till /usr/src/app, vi installerar sedan beroenden med `npm install` och exponerar port 8080. Slutligen kör vi kommandot `npm start` vilket är definerat i package.json-filen i app-katalogen.

Bygg containern med `docker build -t <namn>/<applikationsnamn> .`

Det tar en god stund att bygga denna container för att den innehåller mer än vad vi drar nytta av.
`docker image ls elias/node` ger oss följande:
```bash
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
elias/node          latest              a4dce96c9d74        5 minutes ago       730MB
```
Vi startar containern med `docker run -it -p 8080:8080 elias/node` där -p talar om att vi vill mappa port 8080 på våran värdmaskin till port 8080 på våran container.
```bash
> docker_hello_world@1.0.0 start /usr/src/app
> node index.js

Running on http://0.0.0.0:8080
```
Applikationen körs nu och kan inspekteras med en webbläsare genom att gå till länken.

## Optimering med Alpine Linux
Våran applikation är ytterst minimal, men våran image för att köra den är hela 730MB. Så varje gång som vår applikation ska köras på en server där den inte startats förr så måste 730MB laddas ner, vilket tar både tid och utnyttjar plats i onödan. Ett första steg för att optimera detta är att byta våran bas-image `node:8` till `node:alpine` vilket ger oss följande resultat:

Bygg:
`docker build -t elias/node-alpine .`
Kör:
`docker run -it -p 8080:8080 elias/node-alpine`

```bash
docker image ls elias/node-alpine
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
elias/node-alpine   latest              753dd73d5d07        3 minutes ago       72.1MB
```

