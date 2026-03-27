# [Backstage](https://backstage.io)

App Backstage gerada para o laboratorio `backstage-secrets-mvp`.

## Rodando localmente

Antes de iniciar, carregue o Node instalado via `nvm`:

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
```

Depois rode:

```sh
yarn install
yarn start
```

## Enderecos esperados

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:7007`

## Objetivo desta app

Esta app vai virar o portal de self-service para secrets AWS.

O fluxo previsto e:

1. usuario informa `sigla` e `ambiente`
2. Backstage consulta a API broker
3. API devolve conta, regiao e secret name
4. usuario confirma a execucao
5. API executa `create` ou `update` com identidade tecnica
