# RPG Char Controller

App de fichas de personagem para jogadores de RPG de mesa. Suporta três sistemas — **D&D 5e**, **Pathfinder 2e** e **Daggerheart** — com fichas completas, edição inline, rastreamento de HP e busca de regras integrada.

> Projeto irmão do [Tracker](../Tracker-back_front), que é o app do mestre (gerenciamento de campanha e iniciativa). Este é o app do **jogador**.

---

## Sumário

1. [Stack](#stack)
2. [Como rodar](#como-rodar)
3. [Estrutura do projeto](#estrutura-do-projeto)
4. [Arquitetura geral](#arquitetura-geral)
5. [Design system](#design-system)
6. [Padrões de componente](#padrões-de-componente)
7. [Sistemas de RPG](#sistemas-de-rpg)
8. [API do backend](#api-do-backend)
9. [Persistência de dados](#persistência-de-dados)
10. [Busca de regras](#busca-de-regras)
11. [Adicionando um novo sistema](#adicionando-um-novo-sistema)

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 19 |
| Build | Vite | 8 |
| Estilos | Tailwind CSS | 3 |
| Roteamento | React Router | 7 |
| Janelas flutuantes | react-rnd | 10 |
| Renderização Markdown | react-markdown + remark-gfm | 10 / 4 |
| Ícones | lucide-react | 1 |
| Backend | Express.js | 5 |
| Runtime | Node.js | ≥ 18 |
| UUID | uuid | 14 |
| Orquestrador | concurrently | 9 |

Sem banco de dados externo. Os dados são persistidos em um arquivo `db.json` na pasta de dados do usuário do sistema operacional.

---

## Como rodar

### Pré-requisitos

- Node.js ≥ 18 (necessário para `fetch` nativo no backend)
- npm

### Instalação

```bash
# Na raiz do monorepo
npm install

# Instala dependências de ambos frontend e backend
npm install --prefix frontend
npm install --prefix backend
```

### Desenvolvimento

```bash
# Inicia backend (porta 3001) + frontend (porta 5174) juntos
npm run dev

# Separados (útil para depurar)
npm run dev:backend
npm run dev:frontend
```

Acesse: **http://localhost:5174**

### Build de produção

```bash
cd frontend
npm run build
# Output em frontend/dist/
```

---

## Estrutura do projeto

```
RPGCharController/
├── package.json              ← scripts do monorepo (dev, dev:backend, dev:frontend)
│
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── app.js            ← entrada Express, registra rotas e inicia DB
│   │   ├── data/
│   │   │   ├── db.js         ← leitura/escrita atômica do JSON
│   │   │   └── paths.js      ← caminhos do DB e dados bundled
│   │   ├── routes/
│   │   │   ├── sheets.js     ← CRUD REST de fichas
│   │   │   └── proxy.js      ← proxies para APIs externas
│   │   └── systems/
│   │       ├── dnd5eProxy.js      ← busca em dnd5eapi.co
│   │       ├── pf2eSearch.js      ← busca nos JSONs bundled
│   │       └── daggerheartProxy.js ← busca via GraphQL + fallback
│   └── data/
│       └── pf2e/             ← JSONs com dados do Pathfinder 2e
│           ├── spells.json
│           ├── items.json
│           ├── feats.json
│           └── actions.json
│
└── frontend/
    ├── package.json
    ├── vite.config.js        ← plugin React + proxy /api → localhost:3001
    ├── tailwind.config.js    ← paleta de cores e fontes customizadas
    ├── index.html            ← carrega fontes Google (Cinzel, EB Garamond)
    └── src/
        ├── main.jsx          ← entry point React
        ├── App.jsx           ← providers + BrowserRouter + rotas
        ├── index.css         ← CSS variables de tema + Tailwind directives
        │
        ├── pages/
        │   ├── HomePage.jsx        ← grid de fichas existentes
        │   ├── CreateSheetPage.jsx ← seleção de sistema + nome
        │   └── SheetPage.jsx       ← carrega ficha e renderiza componente do sistema
        │
        ├── components/
        │   ├── Header.jsx          ← barra superior fixa com navegação e toggle de tema
        │   ├── SheetCard.jsx       ← card resumido de ficha na home (nome, sistema, HP)
        │   ├── RulesWindow.jsx     ← janela flutuante arrastável com texto de regras
        │   ├── browsers/
        │   │   └── BrowserPanel.jsx ← painel lateral de busca (reutilizável por sistema)
        │   └── ui/                  ← componentes atômicos de UI
        │       ├── Card.jsx         ← container compound (Card.Header, Card.Body, Card.Footer)
        │       ├── Button.jsx       ← botão com variantes (primary, ghost, danger, gold)
        │       ├── Input.jsx        ← input com label opcional
        │       ├── Badge.jsx        ← badge colorido por "tom" (buff, debuff, magic…)
        │       ├── HPBar.jsx        ← barra de HP colorida por status
        │       └── StatBox.jsx      ← caixa de atributo com modificador calculado
        │
        ├── context/
        │   ├── ThemeContext.jsx       ← dark/light mode, persistido no localStorage
        │   └── RulesWindowContext.jsx ← gerencia janelas flutuantes abertas
        │
        ├── services/
        │   └── api.js               ← client HTTP para o backend local
        │
        ├── systems/
        │   ├── index.js             ← registry central dos sistemas
        │   ├── dnd5e/
        │   │   ├── schema.js        ← createDnd5eSheet(), constantes de skills/abilities
        │   │   ├── api.js           ← searchSpells, searchItems, searchFeats
        │   │   └── Dnd5eSheet.jsx   ← ficha completa D&D 5e (8 tabs)
        │   ├── pf2e/
        │   │   ├── schema.js        ← createPf2eSheet(), constantes PF2E_SKILLS, PF2E_RANKS
        │   │   ├── api.js           ← searchSpells, searchItems, searchFeats, searchActions
        │   │   └── Pf2eSheet.jsx    ← ficha completa PF2e (8 tabs)
        │   └── daggerheart/
        │       ├── schema.js        ← createDaggerheartSheet(), DH_TRAITS, DH_DOMAINS
        │       ├── api.js           ← searchCards, searchDomains
        │       └── DaggerheartSheet.jsx ← ficha completa Daggerheart (4 tabs)
        │
        └── utils/
            └── hpStatus.js          ← retorna "healthy" | "wounded" | "critical"
```

---

## Arquitetura geral

### Monorepo simples

Dois pacotes independentes (`frontend/`, `backend/`) coordenados por scripts na raiz. Sem workspace tools (Turborepo, Nx) — o `concurrently` já é suficiente para dois processos.

### Fluxo de dados

```
Jogador
  │
  ▼
React (porta 5174)
  │  fetch /api/*
  ▼
Vite dev proxy ──► Express (porta 3001)
                      │
                      ├── /api/sheets  →  db.json (APPDATA/RPGCharController/)
                      │
                      └── /api/proxy
                              ├── /dnd5e  →  dnd5eapi.co (REST externo)
                              ├── /pf2e   →  backend/data/pf2e/*.json (bundled)
                              └── /daggerheart → daggerheart-srd-api.vercel.app (GraphQL)
```

### Autosave com debounce

As fichas nunca têm botão "Salvar". Cada alteração chama `onUpdate(newData)`, que:
1. Atualiza o estado local **imediatamente** (UI responsiva)
2. Agenda um `PUT /api/sheets/:id` com debounce de **800 ms**

O indicador "Salvando..." aparece enquanto a requisição está em flight.

```jsx
// SheetPage.jsx
function handleUpdate(newData) {
  setSheet((prev) => ({ ...prev, data: newData }));
  clearTimeout(saveTimer.current);
  saveTimer.current = setTimeout(async () => {
    setSaving(true);
    await api.updateSheet(id, { data: newData });
    setSaving(false);
  }, 800);
}
```

### Lazy loading por sistema

Os três componentes de ficha são carregados sob demanda via `React.lazy()` + `<Suspense>` em `SheetPage.jsx`. O bundle do sistema D&D 5e (~21 kB) só é baixado quando o usuário abre uma ficha D&D, por exemplo.

---

## Design system

O design é inspirado no projeto Tracker e usa a metáfora visual de **"Papel & Tinta"** — pergaminho medieval com acentos em borgonha e dourado.

### Paleta de cores (CSS variables)

As cores são definidas como variáveis RGB em `src/index.css` e consumidas pelo Tailwind via `rgb(var(--color-X) / <alpha-value>)`, o que permite uso de opacidade arbitrária (`text-burgundy/60`, `bg-gold/10`).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `parchment` | `#f4ecd8` | `#1e1814` | Fundo geral |
| `parchment-deep` | `#e8dcc0` | `#161110` | Cards, painéis |
| `parchment-edge` | `#d9c9a3` | `#40322` | Bordas, divisores |
| `ink` | `#2a1f17` | `#e6dcc8` | Texto principal |
| `ink-muted` | `#6b5a48` | `#a89b86` | Labels, texto secundário |
| `ink-faded` | `#9b8b74` | `#7a6e5f` | Placeholders |
| `burgundy` | `#8b2e2e` | `#c85a5a` | Ações primárias, foco |
| `gold` | `#b8860b` | `#dcaa3c` | Estados ativos, destaques |
| `hp-healthy` | `#4a6b3a` | `#82b46e` | HP > 60% |
| `hp-wounded` | `#b5651d` | `#dc9650` | HP 30–60% |
| `hp-critical` | `#7a1f1f` | `#dc5a5a` | HP < 30% |

Tokens `cond-*` (buff, neutral, debuff, magic, burn) são usados para colorir badges de sistema e condições.

### Tipografia

| Fonte | Classe | Uso |
|---|---|---|
| EB Garamond | `font-serif` | Corpo de texto, listas, descrições |
| Cinzel | `font-display` | Labels, títulos, botões, headers |

As fontes são carregadas do Google Fonts no `index.html`. A hierarquia visual é: **Cinzel em uppercase + tracking-widest** para labels de campos, **EB Garamond** para o conteúdo.

### Textura de fundo

O `body` tem um padrão pontilhado sutil via `background-image: radial-gradient(...)` com `background-size: 4px 4px`, simulando a textura granulada do papel.

### Dark mode

Controlado pela classe `.dark` no `<html>` (padrão Tailwind). O `ThemeContext` alterna a classe e persiste a preferência no `localStorage`.

---

## Padrões de componente

### Card compound

`Card` segue o padrão *compound component*: `Card.Header`, `Card.Body` e `Card.Footer` são sub-componentes que ajustam padding e bordas automaticamente.

```jsx
<Card>
  <Card.Header>
    <p className="font-display text-xs uppercase tracking-widest text-ink-muted">Pontos de Vida</p>
  </Card.Header>
  <Card.Body>
    <HPBar current={60} max={100} />
  </Card.Body>
</Card>
```

### Button com variantes

```jsx
<Button variant="primary" size="md" icon={<Plus size={16} />}>Nova Ficha</Button>
<Button variant="ghost">Cancelar</Button>
<Button variant="danger">Excluir</Button>
<Button variant="gold">Ativo</Button>
```

### StatBox

Caixa de atributo de RPG: exibe o score editável e calcula o modificador automaticamente (`Math.floor((score - 10) / 2)`).

```jsx
<StatBox name="FOR" value={data.abilities.str} onChange={(v) => setAbility("str", v)} />
```

### HPBar

A cor da barra é determinada por `hpStatus(current, max)`:
- `> 60%` → verde (`hp-healthy`)
- `30–60%` → laranja (`hp-wounded`)
- `< 30%` → vermelho (`hp-critical`)

### BrowserPanel

Painel lateral reutilizável para busca de qualquer conteúdo de RPG. Recebe funções como props, não sabe nada sobre o sistema:

```jsx
<BrowserPanel
  open={browser === "spells"}
  onClose={() => setBrowser(null)}
  title="Buscar Magia (D&D 5e)"
  searchFn={dnd5eApi.searchSpells}      // async (query) => { results: [...] }
  renderResult={(r) => (
    <p className="text-xs text-ink-muted">Nível {r.level} · {r.school}</p>
  )}
  onAdd={(item) => addSpell(item)}
/>
```

O painel debounce a busca em 350 ms após cada tecla. Clicar em um resultado abre uma `RulesWindow` com o texto completo; clicar em "+" adiciona o item à ficha e fecha o painel.

### RulesWindow

Janela flutuante arrastável e redimensionável (`react-rnd`). Múltiplas janelas podem ser abertas simultaneamente. Gerenciadas pelo `RulesWindowContext`:

```jsx
const { openWindow } = useRulesWindow();
openWindow({ title: "Fireball", content: "## Fireball\n\n...", source: "D&D 5e SRD" });
```

O conteúdo é renderizado como Markdown via `react-markdown`.

---

## Sistemas de RPG

Cada sistema vive em `frontend/src/systems/<id>/` e segue a mesma estrutura:

| Arquivo | Responsabilidade |
|---|---|
| `schema.js` | `createXxxSheet(name)` — retorna o objeto inicial da ficha; constantes de skills/traits |
| `api.js` | Funções de busca que chamam `/api/proxy/<sistema>` |
| `XxxSheet.jsx` | Componente de ficha completa, recebe `{ data, onUpdate }` |

O registry em `frontend/src/systems/index.js` mapeia `id → { label, description, color, badge, createSheet }` e é a única fonte de verdade para o `CreateSheetPage` e o `SheetPage`.

### D&D 5e — `dnd5e`

8 tabs: **Identidade · Atributos · Combate · Ataques · Magias · Equipamento · Traços · Personalidade**

Destaques:
- 6 ability scores com modificador calculado (StatBox)
- Saving throws e 18 perícias com checkbox de proficiência + bônus calculado
- Sistema de slots de magia por nível (1–9) com contador de usados/total
- Magias por nível com checkbox "preparada" (exceto cantrips)
- Dados de morte com 3 checkboxes de sucesso e 3 de falha
- Inventário com flag "equipado" e campos de moeda (CP/SP/EP/GP/PP)
- Busca via **dnd5eapi.co** (REST, SRD, sem autenticação)

### Pathfinder 2e — `pf2e`

8 tabs: **Identidade · Atributos · Combate · Perícias · Ações · Magias · Inventário · Feats**

Destaques:
- Sistema de ranks de proficiência (Sem Treino → Treinado → Especialista → Mestre → Lendário) via `RankSelector` (5 bolinhas clicáveis)
- Bônus calculado automaticamente: `modificador + rankBonus(rank, level)`
- HP com campos **Ferido** e **Moribundo** (mecânica PF2e)
- Foco: pontos de foco (max/atual)
- Feats organizados em 5 categorias (Ancestralidade, Classe, Geral, Perícia, Bônus)
- Ações com tipo (Ação / Reação / Livre)
- Bulk em vez de peso por item
- Busca nos **JSONs bundled** em `backend/data/pf2e/`

### Daggerheart — `daggerheart`

4 tabs: **Personagem · Habilidades · Inventário · Notas**

Destaques:
- Recursos visuais com barras segmentadas clicáveis: **HP**, **Stress**, **Hope**, **Fear**
- **Slots de armadura** com marcação visual de slots usados
- 6 **Características** (Agilidade, Força, Finesse, Instinto, Presença, Conhecimento) com modificadores customizados (−3 a +5)
- **Experiências** — habilidades narrativas com bônus numérico
- **Domain Cards** em layout de grade, com badge de domínio colorido, tier (Foundation/Specialty/Mastery) e mecânica em itálico
- Traços de classe: Foundation, Specialty, Mastery (campos editáveis)
- Busca via **GraphQL** em `daggerheart-srd-api.vercel.app` com fallback para cards locais

---

## API do backend

Base URL: `http://localhost:3001`

### Fichas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/sheets` | Lista todas as fichas |
| `POST` | `/api/sheets` | Cria nova ficha `{ system, data }` |
| `GET` | `/api/sheets/:id` | Busca ficha por ID |
| `PUT` | `/api/sheets/:id` | Atualiza ficha `{ data }` |
| `DELETE` | `/api/sheets/:id` | Remove ficha |
| `GET` | `/api/health` | Health check `{ ok: true }` |

### Proxy de busca

| Rota | Parâmetros | Fonte |
|---|---|---|
| `GET /api/proxy/dnd5e` | `type=spells\|equipment\|features\|monsters`, `search=query` | dnd5eapi.co |
| `GET /api/proxy/pf2e` | `type=spells\|items\|feats\|actions`, `search=query` | JSON bundled |
| `GET /api/proxy/daggerheart` | `type=cards\|domains`, `search=query` | GraphQL / fallback local |

Todos retornam `{ results: [...] }`. Em caso de erro, retornam `{ error: "...", results: [] }` com status 500 — o frontend trata isso exibindo a mensagem de erro no painel, sem quebrar a ficha.

---

## Persistência de dados

### Localização do arquivo

O banco de dados é um único arquivo JSON com escrita atômica:

| SO | Caminho |
|---|---|
| Windows | `%APPDATA%\RPGCharController\db.json` |
| Linux/macOS | `~/.rpg-char-controller/db.json` |

Pode ser sobrescrito via variável de ambiente `RPG_DATA_DIR`.

### Estrutura do `db.json`

```json
{
  "sheets": [
    {
      "id": "uuid-v4",
      "system": "dnd5e",
      "createdAt": "2026-05-09T12:00:00.000Z",
      "updatedAt": "2026-05-09T12:30:00.000Z",
      "data": {
        "name": "Gandalf",
        "class": "Mago",
        "level": 20,
        "abilities": { "str": 10, "dex": 14, "con": 12, "int": 20, "wis": 18, "cha": 16 },
        "hp": { "max": 106, "current": 106, "temp": 0 }
      }
    }
  ]
}
```

### Escrita atômica

Para evitar corrupção se o processo morrer durante a escrita:

```js
async write() {
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(this.data, null, 2), "utf8");
  await fsp.rename(tmp, DB_PATH); // rename é atômico no mesmo volume
}
```

---

## Busca de regras

### D&D 5e

Usa a [D&D 5e API](https://www.dnd5eapi.co/) — REST público, sem autenticação, cobre o SRD completo.

O proxy em `backend/src/systems/dnd5eProxy.js` faz duas etapas:
1. Busca a lista de resultados por nome (`?name=<query>`)
2. Busca o detalhe dos 10 primeiros resultados em paralelo (`Promise.allSettled`)
3. Normaliza o shape dos dados para o formato comum `{ index, name, description, ... }`

### Pathfinder 2e

Os dados são servidos a partir de **JSONs bundled** em `backend/data/pf2e/`. Isso garante funcionamento offline e sem limites de rate.

Para substituir os dados de amostra pelos dados completos do Pf2eTools, baixe os arquivos do repositório [Pf2eToolsOrg/Pf2eTools](https://github.com/Pf2eToolsOrg/Pf2eTools/tree/master/data) e coloque em `backend/data/pf2e/`, renomeando conforme necessário. O `pf2eSearch.js` lê `spells.json`, `items.json`, `feats.json` e `actions.json`.

### Daggerheart

Usa o [Daggerheart SRD API](https://github.com/nategarrow/daggerheart-srd-api) — GraphQL público em `https://daggerheart-srd-api.vercel.app/graphql`. Se a API estiver indisponível, o `daggerheartProxy.js` retorna automaticamente um conjunto de cards de fallback definidos localmente.

---

## Adicionando um novo sistema

1. **Crie a pasta** `frontend/src/systems/<id>/`

2. **`schema.js`** — defina o objeto inicial e as constantes:
   ```js
   export function createMeuSistemaSheet(name = "Personagem") {
     return { name, /* ... campos do sistema */ };
   }
   ```

3. **`api.js`** — aponte para o proxy:
   ```js
   import { api } from "../../services/api.js";
   export const meuSistemaApi = {
     searchSpells: (q) => api.search("meusistema", "spells", q),
   };
   ```

4. **`MeuSistemaSheet.jsx`** — componente que recebe `{ data, onUpdate }`:
   ```jsx
   export default function MeuSistemaSheet({ data, onUpdate }) {
     // edição inline → chama onUpdate(novoData)
   }
   ```

5. **Registre** em `frontend/src/systems/index.js`:
   ```js
   import { createMeuSistemaSheet } from "./meusistema/schema.js";
   export const SYSTEMS = {
     // ...
     meusistema: {
       id: "meusistema",
       label: "Meu Sistema",
       description: "Descrição do sistema",
       color: "text-cond-buff",
       badge: "buff",
       createSheet: createMeuSistemaSheet,
     },
   };
   ```

6. **Backend proxy** — adicione uma rota em `backend/src/routes/proxy.js` e um módulo em `backend/src/systems/`.

O `CreateSheetPage` e o `SheetPage` detectam o novo sistema automaticamente via o registry.

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta do backend Express |
| `RPG_DATA_DIR` | `%APPDATA%/RPGCharController` | Diretório do `db.json` |
