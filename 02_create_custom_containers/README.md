# Skapa egna containers

Egna containers skapar man med en sk. Dockerfile som definierar beroenden och konfiguration. Nedan följer ett exempel:

```Dockerfile
FROM ubuntu:latest
ENTRYPOINT ["/bin/bash"]
```
Filen ska inte ha någon filändelse.

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

REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
<none>              <none>              b9015f609f80        1 minutes ago       68.9MB
ubuntu              latest              18c3ad7dcb72        9 days ago          68.9MB
hello-world         latest              618e43431df9        6 weeks ago         1.64kB

Notera att våran image saknar både REPOSITORY och TAG, så vi måste referera till den med IMAGE ID:
`docker run -it b9015f609f80` ger oss våran ubuntu-konsol.
