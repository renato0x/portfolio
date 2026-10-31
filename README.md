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

O cartão consulta a Spotify Web API; se ela estiver indisponível, tenta a presença do Discord via Lanyard. A última faixa válida — incluindo a capa — é mantida no Vercel Blob. Se ainda não houver nenhuma faixa registrada, o cartão permanece vazio.

## Conectar o Spotify

1. No painel do Spotify Developer, confirme que esta Redirect URI está cadastrada no app:

   ```text
   http://127.0.0.1:3000/callback
   ```

2. Confirme que a conta do Spotify que autoriza é a conta cuja reprodução deve aparecer no portfólio.
3. Com a CLI da Vercel autenticada e este diretório ligado ao projeto `portfolio`, execute:

   ```bash
   npm run spotify:connect
   ```

O fluxo PKCE salva o refresh token como variável de produção sensível na Vercel, mantém uma cópia local ignorada pelo Git e publica uma nova implantação. O app solicita as permissões `user-read-currently-playing` e `user-read-recently-played`. O access token se renova automaticamente. A presença do Discord continua como alternativa. Execute o comando novamente se a autorização for revogada ou se for necessário conceder novos escopos.

## Persistir a última faixa

No projeto da Vercel, abra **Storage**, crie um banco **Blob** com acesso **Public** e conecte-o ao projeto. A Vercel adicionará `BLOB_READ_WRITE_TOKEN` automaticamente às variáveis de ambiente.

A rota salva em `portfolio/spotify-last-track.json` somente o título, artista e URL HTTPS da capa. Quando Spotify e Discord não tiverem uma reprodução disponível, ela devolve esse registro persistido. Para testar localmente, execute `vercel env pull` após criar o Blob.
