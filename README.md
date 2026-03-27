# Backstage Secrets MVP

MVP local para desenhar um portal de self-service de secrets com Backstage.

O foco desta primeira etapa e:

- organizar a arquitetura
- subir dependencias locais basicas
- simular a API que o Backstage vai consumir
- validar o fluxo `sigla + ambiente -> preview -> create/update`

## Arquitetura inicial

Neste MVP, o Backstage entra como portal de entrada. A regra de negocio fica fora dele.

```text
Developer
  -> Backstage UI
  -> Secrets Broker API
  -> Catalog DB (Mongo)
  -> AWS Secrets Manager
```

## Componentes desta pasta

- `docker-compose.yml`
  Sobe `postgres`, `mongo` e `mongo-express` para laboratorio local.
- `portal/`
  App real do Backstage gerada com o scaffold oficial.
- `mock-api/server.py`
  API local simples em Python para simular o fluxo de preview e apply.
- `mock-api/catalog_seed.json`
  Catalogo inicial com dados por sigla e ambiente.

## Toolchain usada

- Node.js `22`
- Yarn `4.4.1`
- Docker Compose
- Minikube e Helm disponiveis na maquina para a proxima etapa

## Fluxo alvo

1. DEV informa `sigla`, `ambiente`, `secret_base_name` e os dados.
2. API consulta o catalogo.
3. API devolve um preview com:
   - conta AWS
   - regiao
   - servico
   - nome padrao do secret
   - acao esperada: `create` ou `update`
4. DEV confirma.
5. API executa a criacao/atualizacao na AWS via identidade tecnica.

## Como rodar a API mock

```bash
cd /home/felipe/Laboratorios/backstage-secrets-mvp
python3 mock-api/server.py
```

A API sobe em `http://localhost:8081`.

## Como rodar o Backstage localmente

```bash
cd /home/felipe/Laboratorios/backstage-secrets-mvp/portal
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
yarn start
```

No primeiro start, o Backstage costuma subir:

- frontend em `http://localhost:3000`
- backend em `http://localhost:7007`

## Como subir as dependencias locais

```bash
cd /home/felipe/Laboratorios/backstage-secrets-mvp
docker compose up -d
```

Servicos expostos:

- Postgres: `localhost:5432`
- Mongo: `localhost:27017`
- Mongo Express: `http://localhost:8082`

## Endpoints disponiveis

### Healthcheck

```bash
curl http://localhost:8081/health
```

### Preview

```bash
curl -X POST http://localhost:8081/preview \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "dtlk",
    "ambiente": "hml",
    "secret_base_name": "documentdb/app-config",
    "fields": {
      "username": "svc_dtlk",
      "password": "trocar-antes-de-usar"
    }
  }'
```

### Apply

```bash
curl -X POST http://localhost:8081/apply \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "dtlk",
    "ambiente": "hml",
    "secret_base_name": "documentdb/app-config",
    "fields": {
      "username": "svc_dtlk",
      "password": "trocar-antes-de-usar"
    }
  }'
```

## Como usar este MVP para chegar no Backstage

### Fase 1

Validar naming, payload e comportamento da API.

### Fase 2

Scaffoldar o Backstage e criar uma tela/plugin simples que:

- chama `/preview`
- mostra conta, regiao e secret name
- pede confirmacao
- chama `/apply`

### Fase 3

Trocar o catalogo mock por Mongo de verdade.

### Fase 4

Trocar a implementacao fake de apply por integracao real:

- Azure DevOps pipeline
ou
- API com `assume-role` na AWS

## Minha recomendacao para o teu caso

No inicio:

- use o Backstage so como portal
- mantenha a logica de negocio numa API separada
- deixe a execucao AWS numa identidade tecnica

Isso te da mais controle, menos acoplamento e fica muito mais facil de evoluir.

## Ordem recomendada a partir daqui

1. Subir `mongo` e `postgres` com `docker compose up -d`.
2. Rodar o Backstage local em `portal/`.
3. Rodar a API mock em outro terminal.
4. Criar a primeira tela do Backstage para chamar `/preview`.
5. So depois pensar em Docker image e Minikube.

## Levar para outro ambiente

Se voce for mover este repo para outro ambiente ou empresa, use [HANDOFF.md](/home/felipe/Laboratorios/backstage-secrets-mvp/HANDOFF.md) como roteiro rapido.

O resumo e:

1. subir o repo no Git
2. clonar no ambiente alvo
3. abrir uma branch de laboratorio
4. validar rede e dependencias
5. testar localmente
6. depois empacotar para Helm/Argo

## Quando usar Minikube

Minikube faz sentido quando voce quiser validar:

- deployment do Backstage em Kubernetes
- service e ingress
- configuracao por secret/configmap
- comportamento mais proximo do cluster real

Para desenvolvimento de plugin e tela, local continua sendo o melhor caminho.
# backstage-secrets-mvp
