# MeFinance Angular

Front-end moderno em Angular para o backend `mefinance` em Spring Boot.

## O que já vem pronto

- Angular standalone components.
- Tela de login integrada ao OAuth2 Password Grant em `/oauth2/token`.
- Interceptor JWT Bearer.
- Layout moderno responsivo.
- Dashboard com resumo de gastos.
- CRUD de gastos em `/gastos`.
- Configuração centralizada em `src/environments/environment.ts`.

## Como rodar

```bash
npm install
npm start
```

Acesse:

```text
http://localhost:4200
```

## Configurar API

Edite `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  oauthTokenPath: '/oauth2/token',
  oauthClientId: 'myclientid',
  oauthClientSecret: 'myclientsecret'
};
```

Ajuste `oauthClientId` e `oauthClientSecret` conforme estiver no seu backend.

## Endpoints assumidos

Pelo nome das classes encontradas no backend, este front assume:

- `POST /oauth2/token`
- `GET /gastos`
- `GET /gastos/resumo`
- `POST /gastos`
- `PUT /gastos/{id}`
- `DELETE /gastos/{id}`

Caso seu `GastoController` use paths diferentes, altere `src/app/core/services/gasto.service.ts`.

## Modelo assumido para GastoDTO

```ts
interface Gasto {
  id?: number;
  descricao: string;
  valor: number;
  data: string;
  situacao: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  categoria?: string;
  observacao?: string;
}
```

Se o DTO do backend tiver nomes diferentes, ajuste `src/app/core/models/gasto.models.ts` e o formulário em `expenses.component.ts`.
