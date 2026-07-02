const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ItajubaSemFiltro",
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null
});

db.connect((erro) => {
    if(erro) {
        console.log("Erro ao conectar"); 
        console.log(erro);
        return;
    }});
    
  
let tentativas = 0;

app.post("/admin", (req, res) => {
    const { senha } = req.body;

    if (!senha) {
        return res.status(400).json({
            erro: "Senha não informada"
        });
    }

    if (tentativas >= 3) {
        return res.status(403).json({
            erro: "Muitas tentativas. Tente mais tarde."
        });
    }

    const admSQL = "SELECT senha_cod FROM codSenha ORDER BY senha_cod DESC LIMIT 1";

    db.query(admSQL, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ erro: "Erro ao consultar a senha cadastrada", detalhe: erro.message });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Nenhuma senha cadastrada"
            });
        }

        if (senha == resultados[0].senha_cod) {
            tentativas = 0;
            return res.json({
                autenticado: true
            });
        }

        tentativas++;

        return res.status(401).json({
            erro: `Senha incorreta | Tentativas ${tentativas}/3`
        });
    });
});

app.get("/reclamacoes", (req, res) => {
    const sql = `
        SELECT r.id_reclamacao AS id, r.nome, r.reclam, r.data_envio, r.resolvida,
               COALESCE(c.quantidade, 0) AS likes
        FROM reclamacao r
        LEFT JOIN curtida c ON c.id_reclamacao = r.id_reclamacao
        ORDER BY r.id_reclamacao DESC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ erro: "Erro ao buscar reclamações", detalhe: erro.message });
        }

        res.json(resultados);
    });
});

app.post("/reclamacoes", (req, res) => {
    const { nome, reclam, data_envio } = req.body;

    if (!nome || !reclam) return res.status(400).json({ erro: "Preencha todos os campos." });

    const dataEnvio = data_envio || new Date().toISOString().slice(0, 10);
    const insertSQL = "INSERT INTO reclamacao (nome, reclam, data_envio) VALUES (?,?,?)";

    db.query(insertSQL, [nome, reclam, dataEnvio], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ erro: "Erro ao salvar a reclamação", detalhe: erro.message });
        }

        res.status(201).json({
            mensagem: "Reclamação enviada com sucesso!",
            id: resultados.insertId
        });
    });
});

app.put("/reclamacoes/:id", (req, res) => {
    const id = (req.params.id);
    db.query("SELECT resolvida FROM reclamacao WHERE id_reclamacao=?", [id], (erro, resultados) => {
        if(erro){
            return res.status(500).json(erro);
        }
        if(resultados.length === 0){
            return res.status(404).json({
                erro:"Reclamação não encontrada"
            });
        }
        const novoStatus = 
        resultados[0].resolvida === 1 ? 0 : 1;
        db.query("UPDATE reclamacao SET resolvida=? WHERE id_reclamacao=?", [novoStatus, id], (erro) => {
        if (erro){
            return res.status(500).json(erro);
        }
        res.json({
            mensagem: "Status da resolução atualizado"
        });
      });
    });
});

app.delete("/reclamacoes/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM curtida WHERE id_reclamacao=?", [id], (erro) => {
        if (erro) {
            return res.status(500).json({ erro: "Erro ao excluir curtidas da reclamação", detalhe: erro.message });
        }

        db.query("DELETE FROM reclamacao WHERE id_reclamacao=?", [id], (erro, resultados) => {
            if (erro) {
                return res.status(500).json({ erro: "erro de conexão", detalhe: erro.message });
            }

            if (resultados.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Reclamação não encontrada"
                });
            }

            res.json({
                mensagem: "Reclamação excluída com sucesso"
            });
        });
    });
});
    
app.post("/curtir", (req, res) => {
    const id_reclamacao = req.body.id;

    if (!id_reclamacao) {
        return res.status(400).json({ erro: "ID da reclamação não informado" });
    }

    db.query("SELECT quantidade FROM curtida WHERE id_reclamacao = ?", [id_reclamacao], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ erro: "Erro ao processar curtida", detalhe: erro.message });
        }

        if (resultados.length === 0) {
            db.query("INSERT INTO curtida (id_reclamacao, quantidade) VALUES (?, 1)", [id_reclamacao], (erro) => {
                if (erro) {
                    return res.status(500).json({ erro: "Erro ao criar curtida", detalhe: erro.message });
                }

                return res.status(201).json({ mensagem: "Curtida enviada", likes: 1 });
            });
            return;
        }

        const novaQuantidade = (resultados[0].quantidade || 0) + 1;

        db.query("UPDATE curtida SET quantidade = ? WHERE id_reclamacao = ?", [novaQuantidade, id_reclamacao], (erro) => {
            if (erro) {
                return res.status(500).json({ erro: "Erro ao atualizar curtida", detalhe: erro.message });
            }

            res.json({ mensagem: "Curtida atualizada", likes: novaQuantidade });
        });
    });
});

app.put("/curtir/:id", (req, res) => {
    const id = req.params.id;

    db.query("SELECT quantidade FROM curtida WHERE id_reclamacao = ?", [id], (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ erro: "Erro ao buscar curtida", detalhe: erro.message });
        }

        if (resultados.length === 0) {
            return res.status(404).json({ erro: "Curtida não encontrada" });
        }

        const novaQuantidade = (resultados[0].quantidade || 0) + 1;

        db.query("UPDATE curtida SET quantidade = ? WHERE id_reclamacao = ?", [novaQuantidade, id], (erro) => {
            if (erro) {
                return res.status(500).json({ erro: "Erro ao atualizar curtida", detalhe: erro.message });
            }

            res.json({ mensagem: "Curtida updated", quantidade: novaQuantidade });
        });
    });
});

app.post("/cadastro", (req, res) => {
 
    const { nome, email, senha } = req.body;
 
    db.query(
        "INSERT INTO usuario(nome,email,senha) VALUES(?,?,?)",
        [nome, email, senha],
        (erro) => {
 
            if (erro)
                return res.status(500).json(erro);
 
            res.json({
                mensagem: "Usuário cadastrado!"
            });
 
        }
    );
 
});
 
app.post("/login", (req, res) => {
 
    const { email, senha } = req.body;
 
    db.query(
        "SELECT id_usuario AS id, nome, email FROM usuario WHERE email=? AND senha=?",
        [email, senha],
        (erro, resultado) => {
 
            if (erro)
                return res.status(500).json(erro);
 
            if (resultado.length == 0)
                return res.status(401).json({
                    erro: "Login inválido"
                });
 
            res.json(resultado[0]);
 
        }
    );
 
});

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log("Servidor rodando em: ")
        console.log(`porta ${PORT}`)
    })
