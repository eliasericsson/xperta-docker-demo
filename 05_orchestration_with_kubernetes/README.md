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

### Workaround - Skapa ett lokalt repository
Vi kan med hjälp av docker köra ett repository lokalt på våran server
```bash
# Run a detached container on port 5000
docker run -d -p 5000:5000 --restart=always --name registry registry:2
```
Lista avbildningar med `docker image ls` och tagga den image som byggdes av Docker-Compose som localhost:5000/*avbildningsnamn* och push'a denna till registryt
```bash
docker tag content-api localhost:5000/content-api
docker push localhost:5000/content-api
```

Försöker vi skapa ett nytt deployment kommer även det att fallera, då våran deployment-fil (k8s/api-deployment.yml) hänvisar till `image: content-api`. Vi ändrar detta till `image: localhost:5000/content-api`.
```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  annotations:
    kompose.cmd: kompose -f docker-compose.yml -f docker-compose.init.yml convert
      -o k8s/
    kompose.version: 1.17.0 (a74acad)
  creationTimestamp: null
  labels:
    io.kompose.service: api
  name: api
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: api
    spec:
      containers:
      - env:
        - name: MONGODB_CONNECTION
          value: mongodb://mongo:27017/contentdb
        image: content-api
        name: api
        ports:
        - containerPort: 3001
        resources: {}
      restartPolicy: Always
status: {}
```


Skapa en tjänst
```bash
kubectl create -f k8s/api-service.yaml
```
## Web
Skapa ett deployment
```bash
kubectl create -f k8s/web-deployment.yaml
```

Skapa en tjänst
```bash
kubectl create -f k8s/web-service.yaml
```






```bash
kubectl create -f k8s/init-deployment.yaml
```

