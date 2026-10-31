```text
+------------------------------+
| renato0x                     |
| projetos / estudos / testes  |
+------------------------------+
```

Site pessoal com uma breve apresentação, projetos e links de contato. Também é um espaço para testar ideias de interface e explorar uma estética de que gosto.

[Visitar o site ↗](https://renatoox.vercel.app/)

---

## ASCII e movimento

A referência ASCII vem de uma preferência pessoal. O visual combina fundo escuro, tons de cinza e tipografia monoespaçada nos detalhes, seguindo uma proposta mais minimalista.

O fundo é desenhado em canvas, com caracteres que formam ondas lentas e deixam um rastro ao passar o cursor. O Motion suaviza o deslocamento do fundo conforme o mouse se move, criando um leve efeito de parallax.

Nos cards, uma iluminação acompanha o cursor. Na troca entre português e inglês, os textos passam por um efeito de caracteres embaralhados antes de formar o novo conteúdo.

## Música com Spotify e Discord

O cartão de música usa a API oficial do Spotify para mostrar o que estou ouvindo, com nome da faixa, artista e capa. Se a consulta falhar, tenta buscar essa informação pela presença do Spotify no Discord, via Lanyard.

Quando não há reprodução ativa, o cartão pode mostrar a última faixa ouvida. A última faixa válida também fica salva para continuar aparecendo quando as consultas estiverem indisponíveis.

## Projetos e dados do GitHub

Cada projeto tem uma breve descrição e um link para seu repositório. Os cards consultam a API do GitHub para exibir as estrelas e a quantidade de commits meus em cada um deles.
