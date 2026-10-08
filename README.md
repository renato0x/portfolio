# Renato Monteiro — Portfólio

Landing page pessoal em Next.js, com projetos públicos do GitHub e painel de atividade musical do Spotify.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Spotify

O cartão funciona sem credenciais e mostra um estado de espera. Para exibir a faixa atual ou a última reprodução, configure `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` e `SPOTIFY_REFRESH_TOKEN` no ambiente de produção. O app Spotify precisa do escopo `user-read-currently-playing` e `user-read-recently-played`; os segredos ficam somente no servidor.

No modo de desenvolvimento do Spotify, a conta proprietária do app precisa ter Premium. Veja os requisitos atuais no [guia de modo de desenvolvimento](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide).
