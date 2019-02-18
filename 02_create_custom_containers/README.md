# Skapa egna containers
#### Tid: 20 min
Innan du börjar, se till att din konsol är i katalogen *02_create_custom_containers*.
```bash
$> cd ../02_create_custom_containers/
$> pwd
../xperta-docker-demo/02_create_custom_containers
```
Egna containers skapar man med en sk. Dockerfile som definierar beroenden och konfiguration. Nedan följer ett exempel:

`Dockerfile`
```Dockerfile
FROM ubuntu:latest
ENTRYPOINT ["/bin/bash"]
```
Filen ska inte ha någon filändelse. Skapa en `Dockerfile` enligt ovan.

Vi bygger här en container med senaste releasen av Ubuntu som bas och när containern startas så vill vi att standardkommandot är att starta en BASH-konsol. I din konsol, ställ dig i den katalog som denna Dockerfile finns i. Kör sedan `docker build .`, punkten referar till den relativa sökvägen.

Docker kommer nu bygga alla steg vi definerat:
	Sending build context to Docker daemon   5.12kB

	Step 1/2 : FROM ubuntu:latest
	 ---> 18c3ad7dcb72
	Step 2/2 : ENTRYPOINT ["/bin/bash"]
	 ---> Using cache
	 ---> b9015f609f80
	Successfully built b9015f609f80

Vi kan åter igen köra `docker image ls` för att se våra avbildningar:
```bash
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
<none>              <none>              b9015f609f80        1 minutes ago       68.9MB
ubuntu              latest              18c3ad7dcb72        9 days ago          68.9MB
hello-world         latest              618e43431df9        6 weeks ago         1.64kB
```
Notera att våran image saknar både REPOSITORY och TAG, så vi måste referera till den med IMAGE ID:
`docker run -it b9015f609f80` ger oss våran ubuntu-konsol.

Bygg nu avbildningen igen, men denna gången med `docker build -t <namn>/ubuntu .`:

Sending build context to Docker daemon  5.632kB

	Step 1/2 : FROM ubuntu:latest
	 ---> 18c3ad7dcb72
	Step 2/2 : ENTRYPOINT ["/bin/bash"]
	 ---> Using cache
	 ---> b9015f609f80
	Successfully built b9015f609f80
	Successfully tagged elias/ubuntu:latest

`docker image ls` ger nu följande:
```bash
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
elias/ubuntu        latest              b9015f609f80        2 hours ago         68.9MB
ubuntu              latest              18c3ad7dcb72        9 days ago          68.9MB
hello-world         latest              618e43431df9        6 weeks ago         1.64kB
```
Containern kan nu startas med `docker run -it elias/ubuntu`. Skriv `exit` i konsolen för att avsluta. Fram tills nu har vi utgått från interaktiva (-it) containers. Vi kan dock starta dessa bortkopplade från konsollen genom att ersätta -it med -d:
```bash
docker run -d elias/ubuntu
```
För att inspektera containern, `docker container ls`:
```bash
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
fd44d28dfa34        elias/ubuntu        "/bin/bash"         5 minutes ago       Up 5 minutes                            dreamy_galileo
```
För att ansluta till containern, `docker exec -it fd44d28dfa34 /bin/bash` ger dig tillgång till BASH-konsolen. Terminera containern med `docker kill fd44d28dfa34` så att den inte körs i onödan.
