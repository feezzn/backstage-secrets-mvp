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
- `mock-api/server.py`
  API local simples em Python para simular o fluxo de preview e apply.
- `mock-api/catalog_seed.json`
  Catalogo inicial com dados por sigla e ambiente.

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
# backstage-secrets-mvp
