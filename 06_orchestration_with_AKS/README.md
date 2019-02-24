[# Orkestrering i Azure Kubernetes Serivce

## Anslut till Azure med Azure CLI
Se till att du har [Azure CLI](https://docs.microsoft.com/sv-se/cli/azure/install-azure-cli?view=azure-cli-latest) installerat innan du börjar. I BASH eller PowerShell, kör `az login` för att logga in. Det går inte att använda Azure Cloud Console till detta.

```bash
# List available subscriptions for your account
az account list

# Set the subscription that services should be used in
az account set --subscription <SUBSCRIPTION-ID>
```

## Skapa ett automationskonto
Vi behöver ett servicekonto som kan agera som identitet för att koppla samman Azure Kubernetes Service och Azure Container Registry.

Ta först reda på ditt prenumerations-ID med `az account show` (fältet "id"). Ersätt ID nedan med ditt prenumerations-ID och ge din sk. service principal ett unikt namn
```bash
az ad sp create-for-rbac --role="Contributor" --scopes="/subscriptions/<ID>" --name="medi-sp"
```
Resultat:
```json
{
  "appId": "02a4e0be-49cf-41f0-b174-33d8e8854da2",
  "displayName": "medi-sp",
  "name": "http://medi-sp",
  "password": "8fbec528-64b7-4226-bc41-74f021401237",
  "tenant": "097e338c-def1-4dd2-8cfd-6d5a1d663adf"
}
```

## Skapa Azure Kubernetes Service
1. Logga in i [Azure Portal](https://portal.azure.com/)
2. Skapa en Azure Kubernetes Service, se [mallen](./aks-template) för referens. I detta exempel är tjänsten döpt till *medi-kube* och resursgruppen till *medical-site*. I autentiseringsavsnittet är det **viktigt** att ange värdena för den *service pricipal/automatiseringskonto* du tidigare skapat.


## Anslut till Kubernetes
Visa Kubernetes grafiska gränssnitt, tryck `Ctrl+C` för att avsluta.
```bash
az aks browse --resource-group medical-site --name medi-kube
```

## Hämta inloggningsuppgifter
```bash
az aks get-credentials --resource-group medical-site --name medi-kube
```

## Installera CLI
Installera kubectl CLI med `az aks install-cli`

## Visa klusternoder
Default i Azure är att skapa ett kluster med tre noder, det är möjligt att ändra antalet noder i drift.
```bash
$:> kubectl get nodes
NAME                       STATUS    ROLES     AGE       VERSION
aks-agentpool-17240950-0   Ready     agent     23m       v1.10.9
aks-agentpool-17240950-1   Ready     agent     23m       v1.10.9
aks-agentpool-17240950-2   Ready     agent     23m       v1.10.9
```

# Hello Kubernetes
Vi startar ett deployment...
```bash
kubectl run hello-world --replicas=5 --labels=run=load-balancer-example --image=gcr.io/google-samples/node-hello:1.0  --port=8080
```
... och exponerar tjänsten *hello-world*
```bash
kubectl expose deployment hello-world --type=LoadBalancer --name=hello-world-lb
```

Vi kan nu med `kubectl get services hello-world` snart få fram den externa adressen.
```bash
NAME               TYPE           CLUSTER-IP     EXTERNAL-IP    PORT(S)          AGE
hello-world-lb   LoadBalancer   10.0.110.199   13.93.33.146   8080:31422/TCP   9m
```

Kontrollera med `curl <EXTERNAL-IP>:8080` eller gå till adressen i en webbläsare. Svaret ska vara `Hello Kubernetes!`.

Vi kan alltså använda samma kommandon i AKS som i tidigare delar. Det går även att använda webbgränssnittet för att utföra samma åtgärder.

### Städning
```bash
kubectl delete deployment hello-world
kubectl delete service hello-world
```

# Azure Container Registry (ACR)
Vi behöver ett ställe att hämta våra avbildningar från, så skapa därför ett Azure Container Registry genom Azure Portal. I detta exempel döpt till *medicr*.

## Tryck avbildningar till ACR
Visa alla ACR som finns i denna prenumeration med `az acr list -o table`. Notera att *ADMIN ENABLED* är *True*. Slå på Admin User i Azure Portal ifall det behövs.
```bash
NAME    RESOURCE GROUP    LOCATION    SKU       LOGIN SERVER       CREATION DATE         ADMIN ENABLED
------  ----------------  ----------  --------  -----------------  --------------------  ---------------
medicr  medical-site      westeurope  Standard  medicr.azurecr.io  2019-02-24T15:33:22Z  True
```

### Logga in
```bash
docker login medicr.azurecr.io -u medicr -p <PASSWORD>`.
```

### Lägg till tags
```bash
docker tag mongo medicr.azurecr.io/mongo
docker tag content-api medicr.azurecr.io/content-api
docker tag content-web medicr.azurecr.io/content-web
```

### Tryck upp
```bash
docker push medicr.azurecr.io/mongo
docker push medicr.azurecr.io/content-api
docker push medicr.azurecr.io/content-web
```

### Kontrollera
```bash
az acr repository list --name medicr
```

# MongoDB på AKS
I denna del är *mongo-deployment.yaml* ändrad enligt följande:
```bash
cat k8s/mongo-deployment.yaml | grep image

      - image: medicr.azurecr.io/mongo
```
Vi ber Kubernetes att hämta avbildningen från vårat privata registry istället för Docker Hub eller liknande.

Skapar vi dock ett deployment så kommer det att misslyckas då AKS inte kan autentisera sig mot ACR ännu.
```bash
# Create deployment
kubectl create -f k8s/mongo-deployment.yaml

# Check in on the pods
kubectl get pods

NAME                     READY     STATUS    RESTARTS   AGE
mongo-5d6766ddb4-wn6zv   1/1       Running   0          7s
```
Det är fullt möjligt att köra MongoDB i en container i ett Kubernetes-kluster, dock ställer det lite extra krav mer läsning om detta finns på [MongoDB Blog](https://www.mongodb.com/blog/post/running-mongodb-as-a-microservice-with-docker-and-kubernetes).

## CosmosDB
Ett enklare alternativ är att använda Azure CosmosDB. Skapa tjänsten:
```bash
az cosmosdb create --name medical-mongo --resource-group medical-site --kind MongoDB
```

För att Kubernetes ska kunna kommunicera med CosmosDB så ska vi skapa en hemlighet av anslutningssträngen.
1. Hämta och anpassa strängen
2. Konvertera till Base64-format
3. Skapa en hemlighet i Kubernetes

### Hämta strängen
Genom Azure Portal finner du sedan *medical-mongo* CosmosDB. Under *Snabbstart/Node.JS* går det sedan att finna en anslutningssträng.

Exempel:
```
mongodb://medical-mongo:<PASSWORD>@medical-mongo.documents.azure.com:10255/?ssl=true
```

Editera strängen enligt följande:

mongodb://medical-mongo:*PASSWORD*@medical-mongo.documents.azure.com:10255/ **contentdb** ?ssl=true **&replicaSet=globaldb**

Resultat:
```
mongodb://medical-mongo:<PASSWORD>@medical-mongo.documents.azure.com:10255/contentdb?ssl=true&replicaSet=globaldb
```

### Konvertera strängen
I en BASH-konsol ger oss `echo -n <CONNECTION-STRING> | base64 -w 0` en lång sträng med tecken. Kopiera denna!

### Skapa hemligheten
Öppna filen [mongo-secret.yaml](./k8s/mongo-secret.yaml) och ersätt ``<base64 encoded value>` med det du kopierade.

```yaml
apiVersion: v1
kind: Secret
metadata:
    name: mongodb
type: Opaque
data:
    db: <base64 encoded value>
```

Skapa med `kubectl`
```
kubectl create -f k8s/mongo-secret.yaml
```
## Justera API Deployment
För att containers/pods ska förstå att de ska använda Kubernetes-hemligheten så justerar vi miljövariablerna i `k8s/api-deployment.yaml`

Före
```yaml
containers:
  - env:
    - name: MONGODB_CONNECTION
      value: mongodb://mongo:27017/contentdb
    image: medicr.azurecr.io/content-api
```

Efter
```yaml
containers:
  - env:
    - name: MONGODB_CONNECTION
      valueFrom:
        secretKeyRef:
          name: mongodb
          key: db
    image: medicr.azurecr.io/content-api
```
