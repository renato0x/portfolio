import Image from "next/image";
import { Activity, ArrowDown, ArrowUpRight, Github, Headphones, Radio, Sparkles } from "lucide-react";
import { SpotifyCard } from "@/components/SpotifyCard";
import { Reveal } from "@/components/Reveal";

type Repository = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
};

async function getProjects(): Promise<Repository[]> {
  try {
    const response = await fetch("https://api.github.com/users/renato0x/repos?sort=updated&per_page=30", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const repos = (await response.json()) as Repository[];
    return repos.filter((repo) => !repo.fork && repo.name.toLowerCase() !== "portfolio").slice(0, 3);
  } catch {
    return [];
  }
}

function StarField() {
  return <div aria-hidden="true" className="star-field" />;
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <main>
      <StarField />
      <div className="nebula nebula-one" aria-hidden="true" />
      <div className="nebula nebula-two" aria-hidden="true" />

      <div className="shell">
        <header className="topbar">
          <a className="wordmark" href="#home" aria-label="Renato, início">
            <span className="wordmark-mark">R<span>.</span></span>
            <span>RENATO MONTEIRO</span>
          </a>
          <nav aria-label="Navegação principal">
            <a href="#projetos">Projetos</a>
            <a href="#som">O som</a>
            <a className="nav-contact" href="https://github.com/renato0x" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14} /></a>
          </nav>
        </header>

        <section id="home" className="hero">
          <Reveal className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> PORTFÓLIO PESSOAL <span className="eyebrow-line" /> 2026</div>
            <h1>Olá, eu sou<br /><span>Renato.</span></h1>
            <p className="hero-lede">Gosto de transformar ideias em experiências digitais — com curiosidade, código e atenção aos detalhes.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#projetos">Explorar projetos <ArrowDown size={16} /></a>
              <a className="button button-quiet" href="https://github.com/renato0x" target="_blank" rel="noreferrer"><Github size={17} /> GitHub <ArrowUpRight size={14} /></a>
            </div>
            <div className="hero-footnote"><Sparkles size={13} /> FEITO COM CALMA, NO MEU CANTO DO UNIVERSO</div>
          </Reveal>

          <Reveal delay={0.16} className="portrait-stage">
            <div className="orbit orbit-a" />
            <div className="orbit orbit-b" />
            <div className="portrait-halo" />
            <div className="portrait-frame">
              <Image src="/profile.png" alt="Imagem de perfil ilustrada de Renato" fill priority sizes="(max-width: 760px) 72vw, 360px" />
              <div className="portrait-shade" />
              <div className="portrait-caption"><span>RENATO OX</span><span>ONLINE <i /></span></div>
            </div>
            <div className="float-chip chip-location"><span className="chip-icon"><Radio size={15} /></span><span><small>MEU CANTO DA WEB</small><b>renatoox.vercel.app</b></span></div>
            <div className="float-chip chip-mood"><span className="mood-pulse" /><span><small>AGORA</small><b>Construindo algo novo</b></span></div>
          </Reveal>
        </section>

        <div className="section-divider"><span>01 / FREQUÊNCIA ATUAL</span><span className="divider-star">✳</span><span>UMA PÁGINA PEQUENA, UM UNIVERSO INTEIRO</span></div>

        <section className="music-section" id="som">
          <Reveal className="section-intro">
            <div className="eyebrow"><Headphones size={14} /> ENQUANTO ISSO, NO FONE</div>
            <h2>Trilha sonora<br />do momento<span>.</span></h2>
            <p>Um pouco do que toca por aqui enquanto as ideias ganham forma.</p>
          </Reveal>
          <SpotifyCard />
        </section>

        <section className="projects-section" id="projetos">
          <div className="projects-heading">
            <Reveal>
              <div className="eyebrow"><Activity size={14} /> SINAIS DE VIDA</div>
              <h2>Feito até aqui<span>.</span></h2>
            </Reveal>
            <a className="all-projects" href="https://github.com/renato0x?tab=repositories" target="_blank" rel="noreferrer">Todos os repositórios <ArrowUpRight size={15} /></a>
          </div>
          <div className="project-grid">
            {projects.length ? projects.map((repo, index) => (
              <Reveal key={repo.html_url} delay={index * 0.08} className="project-card">
                <div className="project-top"><span className="project-index">0{index + 1}</span><ArrowUpRight size={16} /></div>
                <h3><a href={repo.html_url} target="_blank" rel="noreferrer">{repo.name.replaceAll("-", " ")}</a></h3>
                <p>{repo.description || "Um projeto em desenvolvimento no GitHub."}</p>
                <div className="project-meta"><span><i />{repo.language || "Código aberto"}</span><span>★ {repo.stargazers_count}</span></div>
              </Reveal>
            )) : (
              <Reveal className="project-card project-empty">
                <div className="project-top"><span className="project-index">∞</span><Github size={17} /></div>
                <h3>O próximo capítulo</h3>
                <p>Os projetos públicos aparecem aqui conforme forem ganhando forma.</p>
                <a className="project-link" href="https://github.com/renato0x" target="_blank" rel="noreferrer">Acompanhar no GitHub <ArrowUpRight size={14} /></a>
              </Reveal>
            )}
          </div>
        </section>

        <footer className="footer">
          <a className="wordmark" href="#home"><span className="wordmark-mark">R<span>.</span></span><span>ATÉ A PRÓXIMA ÓRBITA</span></a>
          <span>© 2026 RENATO MONTEIRO</span>
          <a href="https://github.com/renato0x" target="_blank" rel="noreferrer">MANDE UM SINAL <ArrowUpRight size={13} /></a>
        </footer>
      </div>
    </main>
  );
}
