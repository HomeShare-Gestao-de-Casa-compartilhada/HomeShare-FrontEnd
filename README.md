# HomeShare - Front-end

JavaScript puro (HTML + CSS + JS), sem build. Mobile-first, tema escuro (cores do YouTube) e claro com alternador (botão ◐).

## Rodar
1. Suba o back-end (`homeshare`, porta 8080).
2. Nesta pasta: `npx serve -s -l 3000` (a porta 3000 já está liberada no CORS do back-end; `-s` faz o link do e-mail `/confirmar-cadastro?token=...` funcionar).
3. Abra http://localhost:3000. Outra URL de API: edite `js/config.js`.

## Telas do protótipo -> rotas do back-end
| Tela | Rotas |
|---|---|
| 1 Cadastro/Entrar | `POST /api/auth/register`, `/confirm`, `/login` |
| 2 Entrar/criar casa | `GET /api/convites/{codigo}`, `POST /api/convites/{codigo}/entrar`, `POST /api/casas`, `GET /api/casas` |
| 3 Início | `tarefas/minhas`, `eventos`, `avisos`, `gastos?mes=` |
| 4-6 Tarefas | `tarefas`, `tarefas/minhas`, `tarefas/historico`, `PUT/DELETE tarefas/{id}`, `POST tarefas/{id}/concluir` |
| 7 Reservas | `espacos`, `espacos/{id}/reservas`, `reservas` |
| 8-9 Eventos | `eventos` (CRUD) |
| 10 Casa | `PUT /api/casas/{id}`, `POST /api/casas/{id}/sair` |
| 11 Avisos/Regras | `avisos`, `regras` |
| 12 Gastos | `gastos`, `gastos/parcelas/{id}/pagamento` |
| 13 Contatos | `contatos` |
| 14 Moradores/convites | `membros`, `lideranca`, `convites` |
| 15 Compras | `itens`, `itens/{id}/comprar` |

(todas sob `/api/casas/{casaId}/...`, exceto auth e convites por código)
