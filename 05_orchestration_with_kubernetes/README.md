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

## Start a basic "Hello, World!" type deployment
Run the Hello World example from Google Container Registry
```bash
kubectl run hello-world --replicas=5 --labels=run=load-balancer-example --image=gcr.io/google-samples/node-hello:1.0  --port=8080
```

List the deployments named hello-world
```bash
kubectl get deployments hello-world
```

List the replica sets
```bash
kubectl get replicasets
```

Create a service that exposes the deployment
```bash
kubectl expose deployment hello-world --type=LoadBalancer --name=my-service
```

Use minikube to find the IP-address of the cluster
```bash
sudo minikube service my-service --url
```

Try to access the service with curl
```bash
curl http://192.168.99.100:31354; echo
```
The response should be `Hello Kubernetes!`


# Rest

Display the service information
```bash
kubectl get services my-service
```
The external IP is initially shown as *pending*.

Display more details about the service
```bash
kubectl describe services my-service
```

The individual pods have internal addresses, as shown here:
```bash
kubectl get pods --output=wide
```
