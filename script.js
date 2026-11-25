// Configuração do seu projeto Supabase
const SUPABASE_URL = "https://fdblcifewnsdydjmlcjf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bH16BTyi5aN4DA3xO9troA_6z-MSZh0";

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
const mensagem = document.querySelector("#mensagem");
const statusBanco = document.querySelector("#status");
const tituloForm = document.querySelector("#titulo-form");
const btnSalvar = document.querySelector("#btn-salvar");
const btnCancelar = document.querySelector("#btn-cancelar");

let produtos = [];

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.classList.toggle("erro", erro);
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function limparFormulario() {
  form.reset();
  campoId.value = "";
  campoQuantidade.value = "0";
  tituloForm.textContent = "Cadastrar produto";
  btnSalvar.textContent = "Cadastrar produto";
  btnCancelar.classList.add("oculto");
  mostrarMensagem("");
}

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function carregarProdutos() {
  statusBanco.textContent = "Miguel Prime";
  try {
    const { data, error } = await supabaseClient
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    produtos = data || [];
    statusBanco.textContent = "";
    statusBanco.classList.remove("erro");
    renderizarProdutos();
  } catch (error) {
    console.error(error);
    statusBanco.textContent = "Erro no banco";
    statusBanco.classList.add("erro");
    total.textContent = "Não foi possível carregar os produtos.";
    lista.innerHTML = '<tr><td colspan="6" class="vazio">Verifique a configuração do Supabase e as políticas RLS.</td></tr>';
  }
}

function renderizarProdutos() {
  const termo = pesquisa.value.trim().toLocaleLowerCase("pt-BR");
  const filtrados = produtos.filter((produto) => {
    return [produto.codigo, produto.nome, produto.categoria]
      .some((campo) => String(campo ?? "").toLocaleLowerCase("pt-BR").includes(termo));
  });

  total.textContent = `${filtrados.length} produto(s) encontrado(s)`;

  if (filtrados.length === 0) {
    lista.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum produto encontrado.</td></tr>';
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
        <button class="acao" type="button" data-editar="${produto.id}">Editar</button>
        <button class="acao excluir" type="button" data-excluir="${produto.id}">Excluir</button>
      </td>
    </tr>
  `).join("");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  mostrarMensagem("");

  const produto = {
    codigo: campoCodigo.value.trim(),
    nome: campoNome.value.trim(),
    categoria: campoCategoria.value.trim() || null,
    quantidade: Number(campoQuantidade.value),
    preco: Number(campoPreco.value)
  };

  if (!produto.codigo || !produto.nome) {
    mostrarMensagem("Preencha o código e o nome do produto.", true);
    return;
  }

  if (produto.quantidade < 0 || produto.preco < 0 ||
      !Number.isFinite(produto.quantidade) || !Number.isFinite(produto.preco)) {
    mostrarMensagem("Quantidade e preço devem ser valores válidos e não negativos.", true);
    return;
  }

  const estavaEditando = Boolean(campoId.value);
  btnSalvar.disabled = true;
  btnSalvar.textContent = "Salvando...";

  try {
    let resultado;

    if (estavaEditando) {
      resultado = await supabaseClient
        .from("produtos")
        .update(produto)
        .eq("id", campoId.value);
    } else {
      resultado = await supabaseClient
        .from("produtos")
        .insert([produto]);
    }

    if (resultado.error) throw resultado.error;

    limparFormulario();
    await carregarProdutos();
    mostrarMensagem(estavaEditando ? "Produto atualizado!" : "Produto cadastrado!");
  } catch (error) {
    console.error(error);
    mostrarMensagem(error.code === "23505"
      ? "Este código já está cadastrado."
      : `Erro ao salvar: ${error.message}`, true);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = campoId.value ? "Salvar alterações" : "Cadastrar produto";
  }
});

lista.addEventListener("click", async (event) => {
  const botaoEditar = event.target.closest("[data-editar]");
  const botaoExcluir = event.target.closest("[data-excluir]");

  if (botaoEditar) {
    const produto = produtos.find((item) => String(item.id) === botaoEditar.dataset.editar);
    if (!produto) return;

    campoId.value = produto.id;
    campoCodigo.value = produto.codigo;
    campoNome.value = produto.nome;
    campoCategoria.value = produto.categoria || "";
    campoQuantidade.value = produto.quantidade;
    campoPreco.value = produto.preco;

    tituloForm.textContent = "Editar produto";
    btnSalvar.textContent = "Salvar alterações";
    btnCancelar.classList.remove("oculto");
    mostrarMensagem("Edite os campos e salve.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (botaoExcluir) {
    const id = botaoExcluir.dataset.excluir;
    const produto = produtos.find((item) => String(item.id) === id);
    if (!produto) return;

    if (!confirm(`Deseja excluir o produto "${produto.nome}"?`)) return;

    try {
      const { error } = await supabaseClient
        .from("produtos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (campoId.value === id) limparFormulario();
      await carregarProdutos();
      mostrarMensagem("Produto excluído.");
    } catch (error) {
      console.error(error);
      mostrarMensagem(`Erro ao excluir: ${error.message}`, true);
    }
  }
});

btnCancelar.addEventListener("click", limparFormulario);
pesquisa.addEventListener("input", renderizarProdutos);

carregarProdutos();
