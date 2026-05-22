# Image to Link - TODO

## Funcionalidades Principais

- [x] Schema do banco de dados para imagens (tabela images com userId, url, fileKey, createdAt)
- [x] Procedimento tRPC para upload de imagem (recebe arquivo, faz upload em S3, salva no DB)
- [x] Procedimento tRPC para listar imagens do usuário autenticado
- [x] Procedimento tRPC para deletar imagem (apenas do próprio usuário)
- [x] Interface de upload com drag-and-drop
- [x] Exibição de link após upload com botão de copiar
- [x] Galeria pessoal mostrando todas as imagens do usuário
- [x] Botão de exclusão de imagens na galeria
- [x] Design elegante e sofisticado com tipografia refinada
- [x] Espaçamento generoso e atenção aos detalhes visuais
- [x] Responsividade mobile-first
- [x] Testes vitest para procedimentos tRPC
- [x] Botões de navegação (Ir e Voltar) em todas as páginas

## Bugs e Correções

(Nenhum no momento)

## Notas

- Usar S3 para armazenamento de imagens
- Cada usuário vê apenas suas próprias imagens
- Links públicos devem ser facilmente copiáveis
- Design deve transmitir qualidade e classe em cada interação
