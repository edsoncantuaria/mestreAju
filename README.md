# MestreAju - Copiloto Supremo de Sandbox D&D 5e

Este é o seu assistente de mestre integrado com Firebase e GenAI (Gemini).

## Configuração Local

Para rodar este projeto na sua máquina após clonar do GitHub:

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente**:
   - Crie um arquivo chamado `.env` na raiz do projeto.
   - Adicione sua chave de API do Google Generative AI (Gemini):
     ```env
     GOOGLE_GENAI_API_KEY=sua_chave_aqui
     ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## Estrutura do Firebase

O projeto já vem configurado com Firebase Auth e Firestore. As chaves de configuração pública estão em `src/firebase/config.ts`. 

**Importante**: A segurança dos dados é garantida pelas Firestore Security Rules. Certifique-se de que as regras em `firestore.rules` estejam implantadas no seu console do Firebase se você estiver usando um projeto novo.

## Integração com Roll20

Este app foi desenhado para funcionar com a ficha "D&D 5E by Roll20".
- Use o botão de **Terminal** para macros de chat rápidas.
- Use o botão de **Download** (Importação) para comandos `!setattr` que preenchem a ficha automaticamente (requer script ChatSetAttr no Roll20).
