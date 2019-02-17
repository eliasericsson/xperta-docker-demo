# Komponera containers, eller hur man kopplar ihop flera komponenter
Applikationer består sällan av bara en image utan ofta flera som fyller olika roller. Ett exempel är t ex. applikationer som bygger på den sk. "MEAN"-stacken.

**M** = MongoDB (DocumentDB, databas utan definerat schema)
**E** = Express.JS (Node.JS middleware framework)
**A** = Angular.JS (Front-end web application framework)
**N** = Node.JS (JavaScript runtime byggt på Chrome's V8 JavaScript Engine)

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
Navigera till content-api -katalogen och bygg containern
```bash
cd app/content-api
docker build -t <namn>/content-api .
```

