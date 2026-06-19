// =================================================================
// SISTEMA: SMART STOCK PLUS MOBILE
// DESENVOLVEDOR: Nathan Alberto Santos Silva
// MATRÍCULA: 202408630451
// ARQUIVO: server.js (Configuração, Algoritmo e Rotas da API)
// =================================================================

const express = require('express');
const cors = require('cors');
const db = require('./database'); // Importação do módulo de banco de dados

const app = express();

app.use(cors());
app.use(express.json());

// Função algorítmica para cálculo do Score de Saúde do Estoque
// Baseia-se na relação proporcional entre a quantidade em estoque e o giro semanal
function calcularScoreSaude(quantidade, giroSemanal) {
    if (giroSemanal <= 0) return 'A+'; // Prevenção contra divisão por zero
    
    const semanasDeEstoque = quantidade / giroSemanal;

    if (semanasDeEstoque < 1) {
        return 'C';   // Estoque crítico (Risco de desabastecimento)
    } else if (semanasDeEstoque >= 1 && semanasDeEstoque <= 3) {
        return 'A+';  // Estoque ótimo (Equilíbrio ideal)
    } else {
        return 'B';   // Estoque excessivo (Capital imobilizado)
    }
}

// Rota raiz para verificação de status e integridade do sistema
app.get('/', (req, res) => {
    return res.json({ 
        sistema: "Smart Stock Plus",
        status: "Online",
        ambiente: "Desenvolvimento local"
    });
});

// ROTA GET: Listar todos os produtos armazenados no banco de dados
app.get('/produtos', (req, res) => {
    const query = "SELECT * FROM produtos";
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: "Erro ao buscar produtos no banco de dados." });
        }
        return res.json(rows);
    });
});

// ROTA 3: Remoção de Produto por ID (Método HTTP DELETE)
// Parâmetro de rota: ':id' captura dinamicamente o identificador do produto
app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params; // Extrai o ID dos parâmetros da requisição URL

  const query = `DELETE FROM produtos WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: "Erro ao deletar o produto no banco de dados." });
    }

    // A propriedade 'changes' retorna quantas linhas foram alteradas no banco
    if (this.changes === 0) {
      return res.status(404).json({ erro: "Produto não encontrado para remoção." });
    }

    // Retorna o status 200 (OK) confirmando o sucesso da operação
    return res.status(200).json({ mensagem: "Produto removido com sucesso!" });
  });
});

// ROTA POST: Inserir um novo produto com cálculo automatizado do Score
app.post('/produtos', (req, res) => {
    const { nome, quantidade, preco, giro_semanal } = req.body;

    // Validação básica de entrada de dados
    if (!nome || quantidade === undefined || !preco || giro_semanal === undefined) {
        return res.status(400).json({ erro: "Todos os campos estruturais são obrigatórios." });
    }

    // Aplicação da função algorítmica do Score de Saúde
    const score_saude = calcularScoreSaude(Number(quantidade), Number(giro_semanal));

    const query = `
        INSERT INTO produtos (nome, quantidade, preco, giro_semanal, score_saude)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [nome, quantidade, preco, giro_semanal, score_saude], function (err) {
        if (err) {
            return res.status(500).json({ erro: "Erro ao inserir o produto no banco de dados." });
        }
        return res.status(201).json({
            id: this.lastID,
            nome,
            quantidade,
            preco,
            giro_semanal,
            score_saude
        });
    });
});

// ROTA HTTP PUT: Atualizar um produto existente com tratamento rigoroso de tipos
app.put('/produtos/:id', (req, res) => {
    const { id } = req.params;
    const { nome, quantidade, preco, giro_semanal } = req.body;

    // Validação de presença de dados estruturais
    if (!nome || quantidade === undefined || !preco || giro_semanal === undefined) {
        return res.status(400).json({ erro: "Todos os campos estruturais são obrigatórios para atualização." });
    }

    // Conversão rigorosa de tipos para evitar rejeição por parte do banco de dados
    const qtdConvertida = parseInt(quantidade, 10);
    const precoConvertido = parseFloat(preco);
    const giroConvertido = parseInt(giro_semanal, 10);
    const idConvertido = parseInt(id, 10);

    // Recalcula o Score de Saúde dinamicamente baseado nos novos valores informados
    const score_saude = calcularScoreSaude(qtdConvertida, giroConvertido);

    const query = `
        UPDATE produtos 
        SET nome = ?, quantidade = ?, preco = ?, giro_semanal = ?, score_saude = ?
        WHERE id = ?
    `;

    db.run(query, [nome, qtdConvertida, precoConvertido, giroConvertido, score_saude, idConvertido], function (err) {
        if (err) {
            console.error("Erro interno do banco SQLite:", err.message);
            return res.status(500).json({ erro: "Erro ao atualizar o produto no banco de dados." });
        }

        if (this.changes === 0) {
            return res.status(404).json({ erro: "Nenhum produto foi localizado com o ID informado." });
        }

        console.log(`[SQLITE] Produto ID ${idConvertido} atualizado com sucesso para Score ${score_saude}.`);
        return res.status(200).json({ mensagem: "Produto atualizado com sucesso!", score_saude });
    });
});

// Definição da porta de rede lógica para escuta das requisições HTTP
const PORTA = 3000;

// Inicialização do servidor web na porta especificada
app.listen(PORTA, () => {
    console.log(`=================================================================`);
    console.log(` Servidor API inicializado com sucesso na porta ${PORTA}`);
    console.log(` Endpoint de teste disponível em: http://localhost:${PORTA}`);
    console.log(`=================================================================`);
});