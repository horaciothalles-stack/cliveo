# Landing Pages Templates

Esta pasta é o lugar para adicionar os modelos de landing page que serão usados pela aplicação.

## Como adicionar novos templates

- Cada template pode ser representado como um objeto em `src/lib/landingPageTemplates.ts`.
- Se você tiver arquivos de design ou HTML, coloque-os em uma nova subpasta e importe os metadados no catálogo.
- O campo `template_id` deve ser exclusivo e pode ser usado para gerar a página com a identidade visual do cliente.

## Próxima etapa

Depois de inserir seus 50 modelos, podemos adaptar o catálogo para carregar automaticamente todos os templates disponíveis e mostrar preview mais rico.
