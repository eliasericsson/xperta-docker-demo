# Komponera containers, eller hur man kopplar ihop flera komponenter
Applikationer består sällan av bara en image utan ofta flera som fyller olika roller. Ett exempel är t ex. applikationer som bygger på den sk. "MEAN"-stacken.

- **M** = MongoDB (DocumentDB, databas utan definerat schema)
- **E** = Express.JS (Node.JS middleware framework)
- **A** = Angular.JS (Front-end web application framework)
- **N** = Node.JS (JavaScript runtime byggt på Chrome's V8 JavaScript Engine)

I detta kapitel ska vi titta på en applikation som har tre delar; en webbfront, ett API-mellanlager, och en databas. Vi kommer att börja bakifrån, med databasen. Men först ska vi definera ett nätverk som dessa ska få kommunicera genom.

## Nätverk
Skapa nätverket *medical* med `docker network create medical`.

## Databas, MongoDB
Då det redan finns en image för MongoDB på Docker Hub för många processorarkitekturer så kommer vi inte att definiera en egen, utan endast köra `docker run --name mongo --net medical -p 27017:27017 -d mongo`.

Vi kan sedan kontrollera att en instans av databasen körs:
```bash
docker container list
docker logs mongo
```
## API, Node.JS + Express.JS
Navigera till katalogen *content-api* och bygg containern:
```bash
cd app/content-api
docker build -t <namn>/content-api .
```

## Web, Node.JS + Angular.JS
Navigera till katalogen *content-web* och bygg containern:
```bash
cd app/content-web
docker build -t <namn>/content-web .
```

## Populera databasen
Navigera till katalogen *content-init* och bygg containern:
```bash
cd app/content-init
docker build -t <namn>/content-init .
```

## Starta containers
Vi kan nu starta containers och ansluta de till nätverket. Med *-e* flaggan kan vi specificera miljövariabler.

DB
```bash
docker run --name mongo --net medical -P -d mongo
```

API
```bash
docker run --name api --net medical -P -e MONGODB=http://mongo:27017/contentdb -d elias/content-api
```

Web
```bash
docker run --name web --net medical -P -e CONTENT_API_URL=http://api:3001 -d elias/content-web
```
Slutligen gå tillbaka till huvudkatalogen
```bash
cd ../../
```

Detta är inte ett speciellt effektivt sätt att arbeta. Med hjälp av Docker Compose kan vi definera relationen mellan containerna och sedan starta alla i ordning.

## Docker Compose
Vi definierar först ett nätverk, och sedan tre olika tjänster. Alla tjänsterna har varsin *image* eller *build* som vi referar till med en relativ sökväg, här till en *Dockerfile* som beskriver hur vardera container byggs. Vi definierar även beroendena mellan de olika containrarna, så att de startar i den ordningen.

Alla tjänsterna är anslutna till nätverket *medical*. Tjänsterna behöver *inte* definieras i den ordning de ska startas i.

`docker-compose.yml`

```Dockerfile
version: '3.4'
networks:
  medical:
    driver: bridge

services:
  mongo:
    image: library/mongo
    networks: 
     - medical
    ports:
     - "27017:27017"
    restart: always
    volumes:
     - ./data:/data/db
  
  api:
    build: ./app/content-api/
    image: content-api
    networks:
     - medical
    ports:
     - "3001:3001"
    depends_on:
     - mongo
    environment:
      MONGODB_CONNECTION: mongodb://mongo:27017/contentdb

  web:
    build: ./app/content-web/
    image: content-web
    networks: 
     - medical
    ports:
     - "3000:3000"
    depends_on:
     - api
    environment:
      CONTENT_API_URL: http://api:3001
```
Vi kan nu starta alla containers med `docker-compose up` eller `docker-compose up -d` för att frigöra konsolen.
```bash
Creating 04_composing_containers_mongo_1 ... done
Creating 04_composing_containers_api_1   ... done
Creating 04_composing_containers_web_1   ... done
```

För att populera databasen så skapar vi även en compose-fil för detta:

`docker-compose.init.yml`
```Dockerfile
version: '3.4'

services:
  init:
    build: ./app/content-init/
    networks:
     - medical
    depends_on:
     - mongo
    environment:
      MONGODB_CONNECTION: mongodb://mongo:27017/contentdb
```
Slutligen så startar vi tjänsterna med:
```bash
docker-compose -f docker-compose.yml -f docker-compose.init.yml up -d
```