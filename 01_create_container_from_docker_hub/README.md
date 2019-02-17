# Skapa  en container från Docker Hub
Se till att du har docker installerat på din maskin.

1. I en konsol (som BASH eller PowerShell) skriver du `docker run hello-world` och du bör få följande resultat:
```bash
Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (arm32v7)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```
2. Låt oss vara ambitiösa, kör `docker run -it ubuntu bash`. Ubuntu-containern kommer nu att hämtas från Docker Hub, continern startas och streamas till din konsol. Du har nu en virtuell ubuntu-maskin att interagera med. Notera att du nu är root@<container-id>, för att verifiera skriv `hostname`, `whoami`, eller `cat /etc/issue` för att se systeminformation. Skriv `exit` för att gå ur containern, continern kommer nu att stängas av och tas bort.
3. Vi har nu startat två olika containers från två olika avbildningar (images). Avbildningarna är återanvändningsbara och vi kan visa dessa med kommandot `docker image ls`. Vi kan här se att ubuntu är en klart större image, och tog därmed en längre tid att ladda ner.
```bash
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
ubuntu              latest              18c3ad7dcb72        9 days ago          68.9MB
hello-world         latest              618e43431df9        6 weeks ago         1.64kB
```
4. Om vi haft några containers ännu körts så använder man kommandot `docker container ls` för att visa dessa.

Vi har nu avropat två olika containers från Docker Hub och kört kommandon i den ena. När containerns syfte uppfyllts har den stängts av och tagits bort för att frigöra resurser.
