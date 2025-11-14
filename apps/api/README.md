# API Gateway (apps/api)

- Sirve endpoints REST/WebSocket para wallets, chains y alertas.
- Consume casos de uso del indexer para exponer balances y actividad reciente.
- ValidarÃ¡ inputs con esquemas estrictos y aplicarÃ¡ rate limiting.
- DependerÃ¡ de `packages/config` y `apps/indexer`.
- Futuro: autenticaciÃ³n, caching y documentaciÃ³n OpenAPI.
