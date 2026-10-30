# Portfólio — Renato Monteiro

Portfólio pessoal de uma página, feito com Next.js, React, TypeScript, Tailwind CSS e Motion.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Verificação e produção

```bash
npm run typecheck
npm run build
npm start
```

O cartão consulta a faixa atual pela Spotify Web API e exibe “heart pt. 6”, de Kendrick Lamar, quando não há reprodução ativa.

## Conectar o Spotify

1. No painel do Spotify Developer, adicione esta Redirect URI ao app:

   ```text
   http://127.0.0.1:3000/callback
   ```

2. Confirme que a conta do Spotify que autoriza é a conta cuja reprodução deve aparecer no portfólio.
3. Com a CLI da Vercel autenticada e este diretório ligado ao projeto `portfolio`, execute:

   ```bash
   npm run spotify:connect
   ```

O fluxo PKCE salva o refresh token como variável de produção sensível na Vercel, mantém uma cópia local ignorada pelo Git e publica uma nova implantação. O app solicita somente a permissão `user-read-currently-playing`. O refresh token do Spotify expira após seis meses; execute o comando novamente para reautorizar quando necessário.
