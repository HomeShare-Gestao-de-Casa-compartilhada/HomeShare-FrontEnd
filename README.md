# HomeShare (front-end)

A parte visual do HomeShare. É só HTML, CSS e JavaScript, sem framework e sem build, então não tem `npm install` nem nada pra compilar. Funciona bem no celular e tem tema escuro (nas cores do YouTube) e claro. O botão ◐ no topo troca, e ele lembra da sua escolha.

## Pra rodar

Primeiro sobe o back-end (porta 8080). Depois, aqui dentro desta pasta:

```
apenas clique para abrir no navegador e já ira funcionar
```

E abre http://localhost:3000.

Precisa ser na porta 3000 (ou 5173), porque são as que o back-end libera no CORS. O `-s` também importa: é ele que faz os links de convite e de confirmação de e-mail abrirem direto na tela certa em vez de dar "Cannot GET".

Se o back-end estiver em outro endereço, muda o valor em `js/config.js`.

## Usando

1. **Criar conta:** nome, e-mail e senha. Um código vai pro e-mail (se o back-end estiver no modo de teste, o código aparece no console dele). Cola o código na aba "Confirmar e-mail" e depois entra.
2. **Criar a casa:** quem cria vira o líder, que aparece com a etiqueta GESTOR.
3. **Chamar os outros:** o líder vai na aba Casa e clica em "Gerar link de convite". Dá pra copiar o link ou mandar direto pelo WhatsApp.
4. **Entrar por convite:** a pessoa abre o link, faz login ou cria a conta, e aparece uma tela perguntando se quer entrar na casa. Cada link serve pra uma pessoa e vale 48 horas. Também dá pra colar só o código na tela "Entrar com convite".
5. Daí é usar as abas de baixo: Início, Tarefas, Agenda e Casa. Dentro de Casa ficam avisos, regras, gastos, contatos, moradores e lista de compras.

## O que tem em cada pasta

- `index.html`: a página única
- `css/styles.css`: cores e layout
- `js/config.js`: endereço da API
- `js/app.js`: as telas e as chamadas ao back-end

## Quais rotas cada tela usa

Tudo fica embaixo de `/api/casas/{casaId}/...`, menos login e convite por código.

- **Login e cadastro:** `/api/auth/register`, `/confirm` e `/login`
- **Entrar numa casa:** `GET /api/convites/{codigo}` e `POST /api/convites/{codigo}/entrar`
- **Início:** `tarefas/minhas`, `eventos`, `avisos` e `gastos?mes=`
- **Tarefas:** `tarefas`, `tarefas/minhas`, `tarefas/historico` e `tarefas/{id}/concluir`
- **Agenda:** `eventos`, `espacos`, `espacos/{id}/reservas` e `reservas`
- **Casa:** `PUT` na casa, `sair` e `lideranca`
- **Avisos e regras:** `avisos` e `regras`
- **Gastos:** `gastos` e `gastos/parcelas/{id}/pagamento`
- **Contatos:** `contatos`
- **Moradores e convites:** `membros` e `convites`
- **Compras:** `itens` e `itens/{id}/comprar`

## Se der problema

- **"Failed to fetch" ou erro de CORS:** o back-end está desligado, ou o front está rodando numa porta diferente de 3000 ou 5173.
- **Link de convite dá "Cannot GET":** faltou o `-s` no `npx serve`.
- **Voltou pra tela de login do nada:** o token expirou (dura 2 horas). É só entrar de novo.
- **Convite "expirou ou já foi usado":** pede um link novo pro líder da casa.

## Cores do tema escuro

Fundo `#0f0f0f`, superfícies `#212121`, hover e chips `#272727`, texto `#F1F1F1` e `#AAAAAA`, links `#3EA6FF`. A logo usa um azul mais fraquinho, `#5a9fe0`.


