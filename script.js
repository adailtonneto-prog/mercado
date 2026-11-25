
// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================

const SUPABASE_URL = "https://fdblcifewnsdydjmlcjf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bH16BTyi5aN4DA3xO9troA_6z-MSZh0";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ==========================================
// INICIAR SISTEMA
// ==========================================

function iniciarSistema() {

    // Elementos HTML
    const form = document.querySelector("#form-produto");
    const campoId = document.querySelector("#produto-id");
    const campoCodigo = document.querySelector("#codigo");
    const campoNome = document.querySelector("#nome");
    const campoCategoria = document.querySelector("#categoria");
    const campoQuantidade = document.querySelector("#quantidade");
    const campoPreco = document.querySelector("#preco");

    const lista = document.querySelector("#lista-produtos");
    const pesquisa = document.querySelector("#pesquisa");
    const total = document.querySelector("#total");

    const statusBanco = document.querySelector("#status");
    const tituloForm = document.querySelector("#titulo-form");
    const btnSalvar = document.querySelector("#btn-salvar");
    const btnCancelar = document.querySelector("#btn-cancelar");

    // Criar mensagem automaticamente caso ela não exista no HTML
    let mensagem = document.querySelector("#mensagem");

    if (!mensagem) {
        mensagem = document.createElement("span");
        mensagem.id = "mensagem";
        mensagem.className = "mensagem";
        mensagem.setAttribute("role", "status");

        const areaBotoes = document.querySelector(".acoes-form");

        if (areaBotoes) {
            areaBotoes.appendChild(mensagem);
        } else {
            form.appendChild(mensagem);
        }
    }

    // Verificar elementos principais
    if (!form || !lista || !campoId || !btnSalvar) {
        console.error("Erro: verifique os IDs dos elementos no HTML.");
        return;
    }

    let produtos = [];

    // ==========================================
    // MENSAGENS
    // ==========================================

    function mostrarMensagem(texto, erro = false) {
        if (!mensagem) return;

        mensagem.textContent = texto;
        mensagem.classList.toggle("erro", erro);
    }

    function mostrarStatus(texto, erro = false) {
        if (!statusBanco) return;

        statusBanco.textContent = texto;
        statusBanco.classList.toggle("erro", erro);
    }

    // ==========================================
    // FUNÇÕES AUXILIARES
    // ==========================================

    function formatarPreco(valor) {
        return Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function limparFormulario() {
        form.reset();

        campoId.value = "";

        campoQuantidade.value = "0";

        tituloForm.textContent = "Cadastrar produto";

        btnSalvar.textContent = "Cadastrar produto";

        btnCancelar?.classList.add("oculto");

        mostrarMensagem("");
    }

    // ==========================================
    // CONSULTAR PRODUTOS
    // ==========================================

    async function carregarProdutos() {

        mostrarStatus("Conectando ao banco...");

        try {

            const { data, error } = await supabaseClient
                .from("produtos")
                .select("*")
                .order("nome", { ascending: true });

            if (error) {
                throw error;
            }

            produtos = data || [];

            mostrarStatus("Banco conectado");

            renderizarProdutos();

        } catch (error) {

            console.error("Erro ao carregar produtos:", error);

            mostrarStatus("Erro no banco", true);

            total.textContent = "Não foi possível carregar os produtos.";

            lista.innerHTML = `
                <tr>
                    <td colspan="6" class="vazio">
                        Erro ao carregar produtos. Verifique o Supabase.
                    </td>
                </tr>
            `;
        }
    }

    // ==========================================
    // MOSTRAR PRODUTOS NA TABELA
    // ==========================================

    function renderizarProdutos() {

        const termo = pesquisa?.value.trim().toLocaleLowerCase("pt-BR") || "";

        const filtrados = produtos.filter((produto) => {

            return [
                produto.codigo,
                produto.nome,
                produto.categoria
            ].some((campo) =>
                String(campo ?? "")
                    .toLocaleLowerCase("pt-BR")
                    .includes(termo)
            );

        });

        if (total) {
            total.textContent = `${filtrados.length} produto(s) encontrado(s)`;
        }

        if (filtrados.length === 0) {

            lista.innerHTML = `
                <tr>
                    <td colspan="6" class="vazio">
                        Nenhum produto encontrado.
                    </td>
                </tr>
            `;

            return;
        }

        lista.innerHTML = filtrados.map((produto) => `

            <tr>
                <td>${escaparHTML(produto.codigo)}</td>

                <td>${escaparHTML(produto.nome)}</td>

                <td>${escaparHTML(produto.categoria || "—")}</td>

                <td>${Number(produto.quantidade).toLocaleString("pt-BR")}</td>

                <td>${formatarPreco(produto.preco)}</td>

                <td>
                    <button
                        class="acao"
                        type="button"
                        data-editar="${produto.id}">
                        Editar
                    </button>

                    <button
                        class="acao excluir"
                        type="button"
                        data-excluir="${produto.id}">
                        Excluir
                    </button>
                </td>
            </tr>

        `).join("");
    }

    // ==========================================
    // CADASTRAR E EDITAR PRODUTOS
    // ==========================================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        mostrarMensagem("");

        const editando = campoId.value !== "";

        const produto = {

            codigo: campoCodigo.value.trim(),

            nome: campoNome.value.trim(),

            categoria: campoCategoria.value.trim() || null,

            quantidade: Number(campoQuantidade.value),

            preco: Number(campoPreco.value)

        };

        // Verificar informações
        if (!produto.codigo || !produto.nome) {

            mostrarMensagem(
                "Preencha o código e o nome do produto.",
                true
            );

            return;
        }

        if (
            produto.quantidade < 0 ||
            produto.preco < 0 ||
            !Number.isFinite(produto.quantidade) ||
            !Number.isFinite(produto.preco)
        ) {

            mostrarMensagem(
                "Informe valores válidos para quantidade e preço.",
                true
            );

            return;
        }

        btnSalvar.disabled = true;

        btnSalvar.textContent = "Salvando...";

        try {

            let resultado;

            if (editando) {

                // Atualizar produto
                resultado = await supabaseClient
                    .from("produtos")
                    .update(produto)
                    .eq("id", campoId.value);

            } else {

                // Cadastrar produto
                resultado = await supabaseClient
                    .from("produtos")
                    .insert([produto]);

            }

            if (resultado.error) {
                throw resultado.error;
            }

            limparFormulario();

            await carregarProdutos();

            mostrarMensagem(
                editando
                    ? "Produto atualizado com sucesso!"
                    : "Produto cadastrado com sucesso!"
            );

        } catch (error) {

            console.error("Erro ao salvar:", error);

            if (error.code === "23505") {

                mostrarMensagem(
                    "Este código já está cadastrado.",
                    true
                );

            } else {

                mostrarMensagem(
                    `Erro ao salvar: ${error.message}`,
                    true
                );

            }

        } finally {

            btnSalvar.disabled = false;

            btnSalvar.textContent = campoId.value
                ? "Salvar alterações"
                : "Cadastrar produto";

        }

    });

    // ==========================================
    // BOTÕES EDITAR E EXCLUIR
    // ==========================================

    lista.addEventListener("click", async (event) => {

        const botaoEditar = event.target.closest("[data-editar]");

        const botaoExcluir = event.target.closest("[data-excluir]");

        // EDITAR
        if (botaoEditar) {

            const id = botaoEditar.dataset.editar;

            const produto = produtos.find(
                (item) => String(item.id) === id
            );

            if (!produto) return;

            campoId.value = produto.id;

            campoCodigo.value = produto.codigo;

            campoNome.value = produto.nome;

            campoCategoria.value = produto.categoria || "";

            campoQuantidade.value = produto.quantidade;

            campoPreco.value = produto.preco;

            tituloForm.textContent = "Editar produto";

            btnSalvar.textContent = "Salvar alterações";

            btnCancelar?.classList.remove("oculto");

            mostrarMensagem("Edite os campos e salve as alterações.");

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }

        // EXCLUIR
        if (botaoExcluir) {

            const id = botaoExcluir.dataset.excluir;

            const produto = produtos.find(
                (item) => String(item.id) === id
            );

            if (!produto) return;

            const confirmar = confirm(
                `Deseja realmente excluir o produto "${produto.nome}"?`
            );

            if (!confirmar) return;

            try {

                const { error } = await supabaseClient
                    .from("produtos")
                    .delete()
                    .eq("id", id);

                if (error) {
                    throw error;
                }

                if (campoId.value === id) {
                    limparFormulario();
                }

                await carregarProdutos();

                mostrarMensagem("Produto excluído com sucesso!");

            } catch (error) {

                console.error("Erro ao excluir:", error);

                mostrarMensagem(
                    `Erro ao excluir: ${error.message}`,
                    true
                );

            }
        }

    });

    // ==========================================
    // CANCELAR EDIÇÃO
    // ==========================================

    btnCancelar?.addEventListener("click", () => {

        limparFormulario();

    });

    // ==========================================
    // BARRA DE PESQUISA
    // ==========================================

    pesquisa?.addEventListener("input", () => {

        renderizarProdutos();

    });

    // ==========================================
    // CARREGAR PRODUTOS AO ABRIR O SITE
    // ==========================================

    carregarProdutos();

}

// Esperar o HTML carregar antes de executar o JavaScript
if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", iniciarSistema);

} else {

    iniciarSistema();

}
