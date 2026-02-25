# MestreAju - Copiloto Supremo de Sandbox D&D 5e

O **MestreAju** é um assistente de mestre de última geração, focado em campanhas de mundo aberto (Sandbox) para Dungeons & Dragons 5ª Edição. Ele integra inteligência artificial generativa, regras oficiais do SRD e persistência em nuvem para oferecer uma experiência de mestragem fluida e profissional.

## 🌟 Funcionalidades Principais

### 1. Sessão Ativa (Mapa Mental Narrativo)
- **Narrativa Ramificável**: Crie uma linha do tempo da sua sessão que permite voltar a pontos anteriores e gerar novos caminhos.
- **Descobertas Contextuais**: Identifique NPCs e Locais durante a narração e "manifeste-os" instantaneamente no seu Grimório.
- **Orçamento de XP**: Cálculos automáticos de dificuldade de encontro (DMG) baseados no nível real do seu grupo.

### 2. O Grimório (Gestão de Mundo)
- **NPCs & Monstros**: Geração de fichas completas com estatísticas, backstory e segredos.
- **Facções & Política**: Gerencie organizações, suas agendas ocultas e níveis de influência.
- **Locais Sandbox**: Mapeie tavernas, cidades e masmorras com características marcantes e regras de ambiente.

### 3. Integração Roll20 (Automação de Fichas)
- **Comandos !setattr**: Gere comandos para o script *ChatSetAttr* que preenchem automaticamente todos os atributos da ficha no Roll20.
- **Macros de Chat**: Templates visuais ricos para consulta rápida e rolagens de mestre sem abrir fichas pesadas.

### 4. Consultoria de Regras & Análise
- **Rules Referee**: Busca em tempo real no SRD oficial para esclarecer mecânicas de combate, ambiente e condições.
- **Gerador de Consequências**: Projeções lógicas de impacto social, econômico e político para as ações dos jogadores.

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI**: Shadcn/UI (Radix Primitives) com tema customizado de fantasia dark.
- **Backend & Database**: Firebase (Auth & Firestore) para sincronização em tempo real.
- **IA**: Google Genkit com Gemini 2.5 Flash para processamento de contexto e regras.
- **APIs Externas**: D&D 5e API (SRD) e Open5e.

## 🚀 Como Rodar Localmente

1. **Instalação**:
   ```bash
   npm install
   ```

2. **Configuração de Variáveis**:
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   GOOGLE_GENAI_API_KEY=sua_chave_gemini_aqui
   ```

3. **Configuração Firebase**:
   As chaves públicas já estão em `src/firebase/config.ts`. Para usar seu próprio banco, atualize este arquivo com as credenciais do seu console Firebase e implante as regras de segurança presentes em `firestore.rules`.

4. **Desenvolvimento**:
   ```bash
   npm run dev
   ```

---
*MestreAju: Onde a narrativa encontra o sistema.*