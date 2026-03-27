# Handoff

Guia rapido para levar este repositorio para um ambiente corporativo e continuar o experimento sem depender do contexto local do laboratorio.

## O que este repo contem

- `portal/`
  App Backstage com a pagina `Secrets`.
- `mock-api/`
  Broker mock em Python que hoje resolve conta, regiao e secret name a partir de um catalogo JSON.
- `docker-compose.yml`
  Dependencias locais opcionais para laboratorio.

## O que vale subir no Git

Suba:

- codigo do `portal/`
- codigo do `mock-api/`
- `README.md`
- `HANDOFF.md`
- `.nvmrc`
- `docker-compose.yml`

Nao suba:

- `node_modules`
- `dist-types`
- `__pycache__`
- arquivos `.env`

## Fluxo sugerido no ambiente do banco

1. Clonar o repo no ambiente corporativo.
2. Criar uma branch de laboratorio, por exemplo:

```bash
git checkout -b feat/backstage-secrets-sandbox
```

3. Validar se a rede permite baixar dependencias NPM e Python.
4. Se a rede bloquear:
   - usar mirror interno de pacotes
   - ou mover para build por container em registry interno
   - ou preparar imagem fora e levar para o registry da empresa
5. Rodar localmente ou em sandbox.
6. Se fizer sentido, levar para EKS por Helm + Argo.

## Sequencia minima de teste no banco

### 1. Broker mock

```bash
cd mock-api
python3 server.py
```

### 2. Backstage

```bash
cd portal
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
yarn install
yarn start
```

### 3. Acesso

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:7007`
- Tela: `http://localhost:3000/secrets`

## O que trocar para um teste mais real

### Catálogo

Hoje o catalogo vem de:

- [mock-api/catalog_seed.json](/home/felipe/Laboratorios/backstage-secrets-mvp/mock-api/catalog_seed.json)

No ambiente corporativo, o caminho natural e trocar isso por:

- Mongo
ou
- API interna
ou
- ConfigMap inicial no cluster

### Execucao

Hoje o apply e simulado.

Depois, o `mock-api/server.py` pode ser trocado por:

- chamada real para AWS Secrets Manager
- chamada para Lambda interna
- chamada para servico interno com `assume-role`

## Estrategia de deploy recomendada

Para o primeiro teste corporativo:

1. subir o repo em Git
2. clonar no ambiente do banco
3. testar localmente numa branch
4. empacotar em container
5. publicar imagem em registry acessivel pelo cluster
6. criar chart Helm
7. criar `Application` no ArgoCD

## Proximo corte recomendado

Antes de levar para Argo/Helm, vale fazer estes 3 ajustes:

1. parametrizar a URL do broker por variavel
2. permitir upload de JSON na tela
3. trocar o apply fake por um endpoint preparado para integracao real
