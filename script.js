
const hostname = window.location.hostname;
const API = window.location.protocol === "file:" || hostname === "" || hostname === "localhost" || hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://isf-e74s.onrender.com";

async function autenticarAdministrador(event) {
    event.preventDefault();
    const senha = document.getElementById("senha").value

    if (!senha) {
        alert("Por favor, informe a senha de administrador.");
        return;
    }

    try {
        const resposta = await fetch(`${API}/admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        sessionStorage.setItem("admin_logado", "true");
        verificar();
    } catch (erro) {
        console.error("Erro ao conectar com o servidor:", erro);
        alert("Erro ao conectar com o servidor. Verifique se o backend está rodando em http://localhost:3000");
    }
}

function verificar() {
    const loginAdmin = document.getElementById("LoginAdmin");
    const conteudoAdmin = document.getElementById("conteudoAdmin");

    if (!loginAdmin || !conteudoAdmin) return;

    if (sessionStorage.getItem("admin_logado") === "true") {
        loginAdmin.style.display = "none";
        conteudoAdmin.style.display = "block";
        carregarEstatisticas();
    } else {
        loginAdmin.style.display = "block";
        conteudoAdmin.style.display = "none";
    }
}

function logoutAdmin() {
    sessionStorage.removeItem("admin_logado");
    window.location.reload();
}

async function carregarEstatisticas() {
    const painel = document.getElementById("estatisticas");
    if (!painel) return;

    try {
        const resposta = await fetch(`${API}/reclamacoes`);
        const dados = await resposta.json();

        painel.innerHTML = `<h2>Total de reclamações: ${dados.length}</h2>`;
        dados.forEach(reclam => {
            painel.innerHTML += `
                <div class="reclamacao">
                    <h2>${reclam.nome}</h2>
                    <p>${reclam.reclam}</p>
                    <p>Status: ${reclam.resolvida ? "Resolvida" : "Não Resolvida"}</p>
                    <button onclick="alterarStatus(${reclam.id})">Alterar Status</button>
                    <button onclick="excluirReclamacao(${reclam.id})" style="background-color:#c0392b; color:white;">Excluir</button>
                </div>`;
        });
    } catch (erro) {
        console.error(erro);
    }
}

async function carregarReclamacao() {
    const rec_html = document.getElementById("rec_html") || document.querySelector(".reclamacoes");
    if (!rec_html) return;

    try {
        const resposta = await fetch(`${API}/reclamacoes`);
        const reclama = await resposta.json();
        rec_html.innerHTML = "";

        reclama.forEach(reclam => {
            rec_html.innerHTML += `
                <div class="reclamacao-item" id="reclamacao${reclam.id}" data-id="${reclam.id}">
                    <h2>${reclam.nome}</h2>
                    <h3 style="color: #6a09c5d2">Reclamação</h3>
                    <p>${reclam.reclam}</p>
                    <p style="font-size: 13px; color: ${reclam.resolvida ? 'green' : 'orange'}">
                        ${reclam.resolvida ? "✔ Resolvida" : "⏳ Em andamento"}
                    </p>
                    <button class="curtir" onclick="curtirReclamacao(${reclam.id})">👍 Curtir</button>
                    <div class="likes">${reclam.likes}</div>
                    <span>curtidas</span>
                </div>`;
        });
    } catch (erro) {
        console.error(erro);
    }
}

async function postarReclamacao(event) {
    event.preventDefault();
    const nome = document.getElementById("nome-rec")?.value?.trim();
    const reclam = document.getElementById("input_rec")?.value?.trim();
    const mensagemEnvio = document.getElementById("mensagemEnvio");

    if (!nome || !reclam) {
        if (mensagemEnvio) {
            mensagemEnvio.textContent = "Preencha todos os campos.";
            mensagemEnvio.style.color = "#c0392b";
        }
        return;
    }

    try {
        const resposta = await fetch(`${API}/reclamacoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, reclam })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            if (mensagemEnvio) {
                mensagemEnvio.textContent = "Enviada com sucesso!";
                mensagemEnvio.style.color = "#27ae60";
            }
            document.getElementById("form-reclamacao")?.reset();
            carregarReclamacao();
        }
    } catch (erro) {
        if (mensagemEnvio) mensagemEnvio.textContent = "Erro ao conectar com o servidor.";
    }
}

async function alterarStatus(id) {
    try {
        await fetch(`${API}/reclamacoes/${id}`, { method: "PUT" });
        carregarReclamacao();
        carregarEstatisticas();
    } catch (erro) {
        console.error(erro);
    }
}

async function excluirReclamacao(id) {
    if (!confirm("Tem certeza que deseja excluir esta reclamação?")) return;

    try {
        const resposta = await fetch(`${API}/reclamacoes/${id}`, { method: "DELETE" });
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        carregarReclamacao();
        carregarEstatisticas();
    } catch (erro) {
        console.error(erro);
        alert("Erro ao excluir reclamação.");
    }
}

async function curtirReclamacao(id) {
    try {
        const resposta = await fetch(`${API}/curtir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });

        const dados = await resposta.json();
        const card = document.getElementById(`reclamacao${id}`);
        if (card) {
            const numLikes = card.querySelector(".likes");
            if (numLikes) numLikes.textContent = dados.likes;
        }
    } catch (erro) {
        console.error(erro);
    }
}

function mostrarSenha() {
    const senha = document.getElementById("senha-cadastro");
    if (!senha) return;
    senha.type = senha.type === "password" ? "text" : "password";
}

function limparFormulario() {
    document.getElementById("form_cadastro")?.reset();
}
function pesquisarReclamacao() {
    const texto = document.getElementById("pesquisa").value.toUpperCase();
    const reclamacoes = document.querySelectorAll(".reclamacao-item");
    reclamacoes.forEach(reclamacao => {
        const conteudo = reclamacao.innerText.toUpperCase();
                if (conteudo.includes(texto)) {
            reclamacao.style.display = "block";
        } else {
            reclamacao.style.display = "none";
        }
    });
}

const formCadastro = document.getElementById("form_cadastro");
 
if (formCadastro) {
    formCadastro.addEventListener("submit", async (event) => {
        event.preventDefault();
        const nome = document.getElementById("nome-cadastro").value;
        const email = document.getElementById("email-cadastro").value;
        const senha = document.getElementById("senha-cadastro").value;
        const resposta = await fetch(`${API}/cadastro`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                email,
                senha
            })
        });
   
        const dados = await resposta.json();
        if (resposta.ok) {
            alert("Cadastro realizado!");
            window.location.href = "login.html";
        } else {
            alert(dados.erro || "Erro ao cadastrar.");
        }
    });
}
 
const formLogin = document.getElementById("form_login");
 
if (formLogin) {
    formLogin.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("email-login").value;
        const senha = document.getElementById("senha-login").value;
        const resposta = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                senha
            })
        });
 
        const usuario = await resposta.json();
        if (resposta.ok) {
            localStorage.setItem("usuario", JSON.stringify(usuario));
            window.location.href = "perfil.html";
        } else {
            alert(usuario.erro);
        }
    });
}
 
function carregarPerfil() {
 
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;
    if (document.getElementById("nome"))
        document.getElementById("nome").textContent = usuario.nome;
    if (document.getElementById("email"))
        document.getElementById("email").textContent = usuario.email;
}

const image1 = document.getElementById("minhaimagem");
const inputcp = document.getElementById("inputArquivo");
const botaocp = document.getElementById("botaoconfp");

if (botaocp && inputcp) {
    botaocp.addEventListener("click", function (event) {
        event.preventDefault();
        inputcp.click();
    });
}

if (inputcp && image1) {
    inputcp.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                image1.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}
 
window.onload = () => {
    verificar();
    carregarPerfil();
    carregarReclamacao();
};

document.getElementById("form-reclamacao")?.addEventListener("submit", postarReclamacao);