# Orkestrera container med kubernetes
## Installera server
I föregående delar har vi prövat att köra vår applikation på vår egna dator. För att börja denna del så ska vi demonstrera att applikationen fungerar även när den körs på server i Azure. Installera en Ubuntu 18.04-server i Azure och anslut med SSH. Kör sedan dessa kommandon i ordning:

```bash
# Install updates
sudo apt-get update

# Install dependencies for docker
sudo apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common

# Download and add the docker GPG-key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# Add the repository for docker
sudo apt-add-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Install docker components
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose

# Add the current user to the docker users group
sudo usermod -a -G docker $USER

# Run the docker hello-world example
docker run hello-world
```
## Applikationsdrift
### Klona repository med applikationen

```bash
git clone https://github.com/eliasericsson/xperta-docker-demo
cd xperta-docker-demo/05_orchestration_with_minikube
```

### Kör applikationen
```bash
docker-compose -f docker-compose.init.yml -f docker-compose.yml up -d
```

### Beskåda loggarna
```bash
docker-compose logs --follow
```

### Testa applikationen
Använd en webbläsare och gå nu till den IP-address som din virtuella server i Azure fick sig tilldelad, lägg till ":3000" i slutet för att specifiera port.
```bash
<SERVER-IP-ADDRESS>:3000
```
Då servern i Azure inte tillåter anslutningar till porten så kommer du få ett felmeddelande. Lägg därför till en nätverksregel för den virtuella maskinen som tillåter anslutningar till port 3000. Pröva nu åter igen i webbläsaren och en webbsida bör nu visas.

I loggarna kan vi nu se att användare ansluter till de olika sidorna.

