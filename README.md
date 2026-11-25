# Cadastro de Produtos - Mercado

Projeto simples em HTML, CSS e JavaScript com Supabase.

## 1. Configurar o Supabase

1. Abra o projeto Supabase.
2. Vá em **SQL Editor**.
3. Abra uma nova query.
4. Copie e execute o conteúdo de `supabase-schema.sql`.
5. A URL e a publishable key já estão configuradas no `script.js`.

## 2. Executar localmente

Abra a pasta no VS Code e use a extensão **Live Server** para abrir `index.html`.

## 3. Publicar na Vercel

1. Envie estes arquivos para um repositório GitHub.
2. Entre na Vercel e importe o repositório.
3. Framework Preset: **Other**.
4. Build Command: deixe vazio.
5. Output Directory: `.` (raiz do projeto).
6. Clique em Deploy.

O arquivo `vercel.json` já está incluído.

## Atenção sobre segurança

A política SQL incluída deixa o acesso aberto para facilitar o teste sem login. Isso significa que visitantes podem consultar, cadastrar, editar e excluir produtos. Para um sistema real, configure autenticação e políticas RLS restritas a usuários autorizados.

A publishable key pode ficar no frontend; nunca coloque uma `service_role` ou chave secreta no JavaScript do navegador.
