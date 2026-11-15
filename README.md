# HomeShare - Front-end

Interface web do HomeShare em **HTML, CSS e JavaScript puro** (sem build, sem Node para compilar). Mobile-first, com tema **escuro** (cores do YouTube) e **claro**, alternados pelo botão ◐ (a escolha fica salva).

## Requisitos
- Back-end HomeShare rodando (http://localhost:8080)
- Node.js só para o servidor estático (`npx serve`), ou qualquer outro servidor estático

## Como rodar
1. Suba o back-end.
2. Nesta pasta: `npx serve -s -l 3000`
3. Abra http://localhost:3000

Use a porta **3000** (ou 5173): são as liberadas no CORS do back-end (`CORS_ALLOWED_ORIGINS`). O `-s` é necessário para os links de e-mail e de convite abrirem direto na tela certa.

Outra URL de API: edite `js/config.js`.

## Estrutura
```
index.html        página única
css/styles.css    tema escuro/claro e layout
js/config.js      URL da API
js/app.js         telas, rotas e chamadas ao back-end
```

## Como usar
1. **Criar conta:** informe nome, e-mail e senha. Um código chega por e-mail (em modo teste, no e-mail configurado no back-end). Cole o código em *Confirmar e-mail* (ou abra o link do e-mail). Depois, entre.
2. **Criar casa:** quem cria vira o líder (GESTOR).
3. **Convidar alguém (líder):** aba **Casa > Gerar link de convite**. Copie o link ou envie pelo WhatsApp.
4. **Entrar por convite:** a pessoa abre o link, entra ou cria a conta e aceita o convite. O link vale para uma pessoa e expira (48 h por padrão). Também dá para colar o código em *Entrar com convite*.
5. Use as abas **Início, Tarefas, Agenda e Casa** (avisos, regras, gastos, contatos, moradores e lista de compras).

## Telas e rotas do back-end
| Tela | Rotas |
|---|---|
| Entrar / cadastro | `POST /api/auth/register`, `/confirm`, `/login` |
| Convite e casas | `GET /api/convites/{codigo}`, `POST /api/convites/{codigo}/entrar`, `POST/GET /api/casas` |
| Início | `tarefas/minhas`, `eventos`, `avisos`, `gastos?mes=` |
| Tarefas | `tarefas`, `tarefas/minhas`, `tarefas/historico`, `PUT/DELETE tarefas/{id}`, `POST tarefas/{id}/concluir` |
| Agenda | `eventos` (CRUD), `espacos`, `espacos/{id}/reservas`, `reservas` |
| Casa | `PUT /api/casas/{id}`, `POST /api/casas/{id}/sair`, `PUT .../lideranca` |
| Avisos e regras | `avisos`, `regras` |
| Gastos | `gastos`, `gastos/parcelas/{id}/pagamento` |
| Contatos | `contatos` |
| Moradores e convites | `membros`, `convites`, `DELETE .../membros/{id}` |
| Compras | `itens`, `itens/{id}/comprar` |

(todas sob `/api/casas/{casaId}/...`, exceto auth e convites por código)

## Tema
Escuro: fundo `#0f0f0f`, superfícies `#212121`, hover/chips `#272727`, texto `#F1F1F1`/`#AAAAAA`, links `#3EA6FF`. A logo usa um azul mais suave (`#5a9fe0`).

## Problemas comuns
| Sintoma | Causa |
|---|---|
| "Failed to fetch" / erro de CORS | back-end desligado, ou front fora das portas 3000/5173 |
| Link de convite/e-mail dá "Cannot GET" | rode com `npx serve -s` |
| Redirecionado para o login | token expirou (2 h): entre de novo |
| Convite "expirou ou já foi usado" | peça um novo link ao líder |
