# Medição pública CognixHub — 31/10/2026

Pedido de Nuno: um píxel por projeto, Parenting partilhado entre idiomas, com consentimento e exclusão de áreas privadas. Não criar campanhas nem alterar projetos de clientes.

Contagens próprias automáticas apenas de visitas e cliques de entrada públicos: totais por dia UTC, projeto e tipo, sem cookies, IP, URL ou identificadores de visitante guardados, conservados por 400 dias e com possibilidade de desativação. Endpoint metrics.cognixhub.com recebe apenas projeto e tipo. Somente PageView Meta público, depois de consentimento explícito, guardado 180 dias por projeto/origem. Global Privacy Control impede Meta. Google analytics exige escolha separada onde já existia. A nova versão de consentimento não reaproveita autorizações antigas. Sem correspondência avançada, eventos automáticos, noscript ou CAPI servidor. Sem nomes, e-mails, respostas ou resultados. Query strings são aceites apenas para parâmetros de campanha conhecidos e removidas antes de carregar terceiros; ligações privadas ou referrers com parâmetros são excluídos.

Mindwink: homes anónimas PT/EN. Parenting: landing principal de cada idioma; nenhum SDK nas páginas de formulário, compra, confirmação ou downloads. Foco, Lê Comigo e Saldo: página autónoma `/sobre/`, destinada à divulgação; a aplicação mantém-se sem píxel. Os links para a aplicação fazem navegação de documento completo, sem referrer. A retirada revoga o consentimento, remove cookies acessíveis e recarrega o documento. Falha de armazenamento mantém terceiros desligados.

Os identificadores de cada píxel são públicos e estão no atributo data-pixel. Dataset criado no portefólio CognixHub 355092597116478 e associado apenas à conta CognixHub 1927346598642064. LeadShortcut e MeuCurso (cliente Santander) não são alterados.

## 01/11/2026 — Ordem do consentimento Meta

A verificação posterior detetou que o SDK carregava sem enviar PageView: `revoke` colocado antes de `init` bloqueava a fila que continha o próprio `grant`. A concessão passa a anteceder a inicialização, apenas dentro do ramo que já exige escolha publicitária explícita e ausência de GPC. A retirada continua a revogar e recarregar o documento. Não há carregamento nem concessão antes da escolha. A versão do URL do script força a atualização de cópias em cache.

Regressão reproduzida com o SDK e configuração públicos oficiais da Meta num DOM isolado, intercetando todos os pedidos: antes, fila bloqueada com 4 comandos e nenhum PageView; depois, fila vazia e pedido PageView a /tr/. Testes de ausência de consentimento, GPC, exclusão de áreas privadas e retirada preservados.
