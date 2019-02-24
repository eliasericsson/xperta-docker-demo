# Orkestrera container med kubernetes
## Installera server
I föregående delar har vi prövat att köra vår applikation på vår egna dator. För att börja denna del så ska vi demonstrera att applikationen fungerar även när den körs på server i Azure. Installera en Ubuntu 18.04-server i Azure (underliggande maskin måste stödja sk. nested virtualization). Anslut med SSH (se till att port 22 är öppnad) och Kör sedan dessa kommandon i ordning:

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

# Logout, and login again to be granted the new group membership
logout
ssh <USERNAME>@<SERVER-IP-ADDRESS>

# Install Docker Compose
sudo apt-get install docker-compose

# Run the docker hello-world example
docker run hello-world
```
## Applikationsdrift
### Klona repository med applikationen

```bash
git clone https://github.com/eliasericsson/xperta-docker-demo
cd xperta-docker-demo/05_orchestration_with_kubernetes
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
Då servern i Azure inte tillåter anslutningar till porten så kommer du få ett felmeddelande. Lägg därför till en nätverksregel för den virtuella maskinen i Azure Dashboard så att den tillåter anslutningar till port 3000. Pröva nu åter igen i webbläsaren och en webbsida bör nu visas.

I loggarna kan vi nu se att användare ansluter till de olika sidorna.

## Kubernetes
Vi ska nu använda kubernetes istället för Docker Compose för att orkestrera våra containers. För detta behöver vi `kubectl` och `minikube`.
### Installera kubectl
```bash
# Install kubectl with snap
sudo apt-get update && sudo apt-get install -y apt-transport-https
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubectl

# Check installed version
sudo kubectl version
```
### Installera minikube

```bash
# Download minikube
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

# Allow execution
chmod +x minikube

# Move minikube to bin
sudo mv minikube /usr/local/bin && rm minikube
```

### Installera virtualbox
minikube körs som ett mellanlager för att interagera med virtualiseringstekniken under, i detta fallet VirtualBox. Det är dock även supporterat att köra VMware eller Hyper-V istället, om operativet är kompatibelt. Default är dock VirtualBox, så vi behöver installera detta.
```bash
sudo apt-get install virtualbox
```

### Starta ett Kuberneteskluster
Starta minikube
```bash
sudo minikube start
```

## Starta en simpelt "Hello, World!" exempel
Kör ett Hello World exempel från Google Container Registry
```bash
kubectl run hello-world --replicas=5 --labels=run=load-balancer-example --image=gcr.io/google-samples/node-hello:1.0  --port=8080
```

Visa alla deployments med namnet *hello-world*
```bash
kubectl get deployments hello-world
```

Visa de replica sets som finns tillgängliga
```bash
kubectl get replicasets
```

Skapa en tjänst som exponerar din deployment
```bash
kubectl expose deployment hello-world --type=LoadBalancer --name=my-service
```

Använd minikube för att hitta klustrets IP-address
```bash
sudo minikube service my-service --url
```

Försök nå tjänsten med curl
```bash
curl http://192.168.99.100:31354; echo
```
Konsolen bör svara med `Hello Kubernetes!`

# Starta en egen deployment

## MongoDB
Skapa ett deployment
```bash
kubectl create -f k8s/mongo-deployment.yaml
```

Skapa en tjänst
```bash
kubectl create -f k8s/mongo-service.yaml
```
## API
Skapa ett deployment
```bash
kubectl create -f k8s/api-deployment.yaml
```

Testar man detta deployment med `kubectl get pods` så ser man att denna pod inte kan starta eftersom den inte kan ladda ner containern. Kubernetes bygger till skillnad får Docker-Compose inte containers utan laddar endast hem dessa från ett repository.
```bash
NAME                     READY   STATUS             RESTARTS   AGE
api-89f7cccfd-qjn4h      0/1     ImagePullBackOff   0          13m
mongo-8464d9bbf9-xjpk5   1/1     Running            0          45m
```

Städa upp lite med delete
```bash
kubectl delete deployment api
```

### Sätt upp lokalt registry
```bash
kubectl create -f k8s/kube-registry.yaml
```
Vi kan ansluta till minikube `sudo minikube ssh` och anropa localhost och bör då få svar från vårat registry `curl localhost:5000`.

### Docker Image
Peka Docker-klienten mot Minikubes Docker Daemon
```bash
eval $(minikube docker-env)
```

Då vi redan har en byggd avbildning så behöver den inte byggas, utan vi taggar den befintliga avbildningen *content-api* med vårat repository *localhost:5000*. Push'a tillsist denna avbildning till repositoriet.
```bash
docker tag content-api localhost:5000/content-api
docker push localhost:5000/content-api
```

Anslut till minikube och dra ned avbildningen
```bash
sudo minikube ssh
docker pull localhost:5000/content-api
```

### Starta deployment
```bash
kubectl create -f k8s/api-deployment.yaml
```

Nu startas en pods med våran container i: 
```bash
kubectl get pods
```

Läs loggarna, API ska nu ha anslutit till MongoDB
```bash
kubectl logs $(kubectl get pods | awk '/api/ {print $1;exit}')
```

## Web
### Docker Image
```bash
docker tag content-api localhost:5000/content-web
docker push localhost:5000/content-web
```

Anslut till minikube och dra ned avbildningen
```bash
sudo minikube ssh
docker pull localhost:5000/content-web
```

### Starta deployment
```bash
kubectl create -f k8s/web-deployment.yaml
```

Vi kan nu överblicka våra deployments med `kubectl get pods`:
```bash
NAME                     READY   STATUS    RESTARTS   AGE
api-79d7bfd784-dpwxh     1/1     Running   0          34s
mongo-8464d9bbf9-v5jkn   1/1     Running   0          42s
web-7585587d5-w7tc5      1/1     Running   0          25s
```

## Exponera tjänsten

Slutligen behöver vi exponera våran tjänst *web* för att den ska kunna kommunicera utanför klustret, vi gör detta med en lastbalancerare.
```bash
kubectl expose service web --type=LoadBalancer --port=3000 --target-port=3000 --name=my-service
```

I normalfallet, när inte använder minikube, så kan man använda `kubectl get services` för att identifiera den externa IP-addressen som lastbalanceraren tilldelas. Men med minikube så måste vi köra detta kommando istället:
```bash
sudo minikube service my-service --url
```

Kontrollera ifall websidan svarar
```bash
curl http://<EXTERNAL-IP>:<PORT>
```

# Slutsats
Det är fullt möjligt att köra Kubernetes på en egen server, oavsett om det är placerad i ett datacenter eller i molnet. Vi har dock ännu ansvaret att se till att de maskiner som vårat kluster körs ovanpå är skyddat mot intrång och driftstörningar. Att använda en hanterad tjänst från abstaherar undan denna hantering och låter dig köra dina deployments utan tillgång (eller ansvar) för underliggande hård- och mjukvara.

Här följer några exempel på hanterade tjänster för Kubernetes:
* Azure Kubernetes Service (AKS) från Microsoft Azure
* Elastic Kubernetes Service (EKS) från Amazon Web Services
* Google Kubernetes Engine (GKE) från Google Cloud Platform
