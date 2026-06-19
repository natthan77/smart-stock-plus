// =================================================================
// SISTEMA: SMART STOCK PLUS MOBILE (VERSÃO FULL EXECUTIVE BI)
// DESENVOLVEDOR: Nathan Alberto Santos Silva
// MATRÍCULA: 202408630451
// ARQUIVO: App.js (Lógica Completa: CRUD, BI, Filtros e Edição)
// =================================================================

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  StatusBar 
} from 'react-native';

export default function App() {
  // --- ESTADOS DO FORMULÁRIO ---
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [giro, setGiro] = useState('');
  
  // --- ESTADOS DE DADOS ---
  const [produtos, setProdutos] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroScore, setFiltroScore] = useState('TODOS');

  // --- ESTADO DE EDIÇÃO (INOVAÇÃO) ---
  const [idEditando, setIdEditando] = useState(null);

  // Endpoint de comunicação com a API do Backend
  const API_URL = 'http://10.0.2.2:3000/produtos';

  // Função para buscar dados atualizados da API
  const buscarProdutos = async () => {
    try {
      const resposta = await fetch(API_URL);
      const dados = await resposta.json();
      setProdutos(dados);
    } catch (error) {
      console.error("Erro de comunicação com a API:", error);
    }
  };

  useEffect(() => {
    buscarProdutos();
  }, []);

  // --- LÓGICA DO DASHBOARD DE INTELIGÊNCIA (BI) ---
  const capitalTotal = produtos.reduce((acumulador, item) => {
    return acumulador + (item.quantidade * item.preco);
  }, 0);

  const qtdCriticos = produtos.filter(p => p.score_saude === 'C').length;

  // --- CONTROLE DE OPERAÇÕES DO BANCO (CRUD) ---

  // Função Unificada: Salvar Novo (POST) ou Atualizar Existente (PUT)
  const handleSalvar = async () => {
    if (!nome || !quantidade || !preco || !giro) {
      Alert.alert("Campos Incompletos", "Por favor, preencha todas as variáveis do produto.");
      return;
    }

    const dadosProduto = {
      nome,
      quantidade: parseInt(quantidade, 10),
      preco: parseFloat(preco),
      giro_semanal: parseInt(giro, 10)
    };

    try {
      if (idEditando) {
        // MODO EDIÇÃO: Executa o PUT
        const resposta = await fetch(`${API_URL}/${idEditando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosProduto)
        });

        if (resposta.status === 200) {
          buscarProdutos();
          limparFormulario();
          Alert.alert("Sucesso", "Registro atualizado com sucesso!");
        }
      } else {
        // MODO CADASTRO: Executa o POST
        const resposta = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosProduto)
        });

        if (resposta.status === 201) {
          buscarProdutos();
          limparFormulario();
          Alert.alert("Sucesso", "Produto registrado no inventário.");
        }
      }
    } catch (error) {
      console.error("Erro ao processar operation no banco:", error);
    }
  };

  // Prepara os campos para edição ao clicar no lápis
  const iniciarEdicao = (produto) => {
    setIdEditando(produto.id);
    setNome(produto.nome);
    setQuantidade(produto.quantidade.toString());
    setPreco(produto.preco.toString());
    setGiro(produto.giro_semanal.toString());
  };

  // Cancela a edição e limpa os campos
  const limparFormulario = () => {
    setIdEditando(null);
    setNome('');
    setQuantidade('');
    setPreco('');
    setGiro('');
  };

  // Função de Remoção (DELETE)
  const handleDeletar = (id, nomeProduto) => {
    if (idEditando === id) {
      Alert.alert("Aviso", "Não é possível deletar um produto enquanto ele está sendo editado.");
      return;
    }

    Alert.alert(
      "Confirmar Remoção",
      `Tem certeza que deseja excluir "${nomeProduto}" do estoque permanentemente?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              const resposta = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
              });
              if (resposta.status === 200) {
                buscarProdutos();
              }
            } catch (error) {
              console.error("Erro ao remover item do banco:", error);
            }
          }
        }
      ]
    );
  };

  // Lógica de Filtragem Cruzada
  const produtosFiltrados = produtos.filter(produto => {
    const normalizar = (texto) => 
      texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    const matchesNome = normalizar(produto.nome).includes(normalizar(pesquisa));
    const matchesScore = filtroScore === 'TODOS' || produto.score_saude === filtroScore;

    return matchesNome && matchesScore;
  });

  // Elementos do Cabeçalho da Lista para permitir rolagem uniforme na tela
  const renderHeader = () => (
    <View>
      <Text style={styles.titulo}>Smart Stock Plus</Text>
      
      {/* --- DASHBOARD --- */}
      <View style={styles.dashboardContainer}>
        <View style={styles.dashCard}>
          <Text style={styles.dashLabel}>CAPITAL INVESTIDO</Text>
          <Text style={styles.dashValor}>
            R$ {capitalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        
        <View style={styles.dashDivider} />
        
        <View style={styles.dashCard}>
          <Text style={styles.dashLabel}>ITENS CRÍTICOS</Text>
          <Text style={[styles.dashValor, { color: qtdCriticos > 0 ? '#E63946' : '#2B9348' }]}>
            {qtdCriticos} {qtdCriticos === 1 ? 'item' : 'itens'}
          </Text>
        </View>
      </View>

      {/* --- INOVAÇÃO VISUAL: VOLUMETRIA ANALÍTICA DO ESTOQUE (GRÁFICOS SIMULADOS) --- */}
      <View style={styles.analyticsContainer}>
        <Text style={styles.analyticsTitle}>Análise Volumétrica Estratégica</Text>
        
        {/* Barra de Proporção A+ */}
        <View style={styles.barraStatusContainer}>
          <View style={styles.barraStatusHeader}>
            <Text style={styles.barraStatusLabel}>Estoque Ótimo (A+)</Text>
            <Text style={[styles.barraStatusPercent, { color: '#2B9348' }]}>65%</Text>
          </View>
          <View style={styles.barraStatusTrilho}>
            <View style={[styles.barraStatusPreenchimento, { width: '65%', backgroundColor: '#2B9348' }]} />
          </View>
        </View>

        {/* Barra de Proporção B */}
        <View style={styles.barraStatusContainer}>
          <View style={styles.barraStatusHeader}>
            <Text style={styles.barraStatusLabel}>Capital Imobilizado (B)</Text>
            <Text style={[styles.barraStatusPercent, { color: '#FFB703' }]}>20%</Text>
          </View>
          <View style={styles.barraStatusTrilho}>
            <View style={[styles.barraStatusPreenchimento, { width: '20%', backgroundColor: '#FFB703' }]} />
          </View>
        </View>

        {/* Barra de Proporção C */}
        <View style={styles.barraStatusContainer}>
          <View style={styles.barraStatusHeader}>
            <Text style={styles.barraStatusLabel}>Risco de Ruptura (C)</Text>
            <Text style={[styles.barraStatusPercent, { color: '#E63946' }]}>15%</Text>
          </View>
          <View style={styles.barraStatusTrilho}>
            <View style={[styles.barraStatusPreenchimento, { width: '15%', backgroundColor: '#E63946' }]} />
          </View>
        </View>

        {/* Linha Divisória interna */}
        <View style={{ height: 1, backgroundColor: '#EAEAEA', marginVertical: 15 }} />

        {/* Sub-Seção: Gráfico Donut de Segurança e Filtro Executivo */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={[styles.analyticsTitle, { marginBottom: 0 }]}>Indicador de Ruptura</Text>
          <View style={styles.pilulaFiltroContainer}>
            <View style={styles.pilulaFiltroAtiva}>
              <Text style={styles.pilulaFiltroTextoAtivo}>Mês</Text>
            </View>
            <View style={{ paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#6C757D' }}>Semana</Text>
            </View>
          </View>
        </View>

        <View style={styles.donutLayout}>
          {/* Círculo do Donut com Bordas Coloridas Simulando Fatias */}
          <View style={styles.donutGrafico}>
            <View style={styles.donutMiolo}>
              <Text style={styles.donutTextoPrincipal}>85%</Text>
              <Text style={styles.donutTextoSub}>Estável</Text>
            </View>
          </View>

          {/* Legendas Laterais */}
          <View style={{ gap: 6, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.donutLegendaPonto, { backgroundColor: '#2B9348' }]} />
              <Text style={styles.donutLegendaTexto}>Saudável (12 un.)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.donutLegendaPonto, { backgroundColor: '#FFB703' }]} />
              <Text style={styles.donutLegendaTexto}>Alerta (3 un.)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.donutLegendaPonto, { backgroundColor: '#E63946' }]} />
              <Text style={styles.donutLegendaTexto}>Crítico (2 un.)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* --- FORMULÁRIO DE CADASTRO / EDIÇÃO --- */}
      <View style={[styles.formulario, idEditando && styles.formularioModoEdicao]}>
        <Text style={styles.labelSection}>
          {idEditando ? '✏️ Editando Registro Técnico' : 'Novo Registro de Material'}
        </Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Nome do Item" 
          placeholderTextColor="#999" 
          value={nome} 
          onChangeText={setNome} 
        />
        
        <View style={styles.inputRow}>
          <TextInput 
            style={[styles.input, { flex: 1, marginRight: 10 }]} 
            placeholder="Quantidade" 
            placeholderTextColor="#999" 
            keyboardType="numeric" 
            value={quantidade} 
            onChangeText={setQuantidade} 
          />
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            placeholder="Preço Unitário" 
            placeholderTextColor="#999" 
            keyboardType="numeric" 
            value={preco} 
            onChangeText={setPreco} 
          />
        </View>
        
        <TextInput 
          style={styles.input} 
          placeholder="Giro Semanal Demandado" 
          placeholderTextColor="#999" 
          keyboardType="numeric" 
          value={giro} 
          onChangeText={setGiro} 
        />
        
        <View style={{ flexDirection: 'row', gap: idEditando ? 10 : 0 }}>
          {idEditando && (
            <TouchableOpacity style={[styles.botao, { backgroundColor: '#6C757D', flex: 1 }]} onPress={limparFormulario}>
              <Text style={styles.botaoTexto}>Cancelar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.botao, idEditando ? { backgroundColor: '#2B9348', flex: 1 } : { backgroundColor: '#0052FF' }]} 
            onPress={handleSalvar} 
            activeOpacity={0.8}
          >
            <Text style={styles.botaoTexto}>{idEditando ? 'Atualizar Registro' : 'Salvar no Banco'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.subtitulo}>Inventário Ativo</Text>

      {/* --- BARRA DE PESQUISA --- */}
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="🔍 Procurar material por especificação..." 
          placeholderTextColor="#7B7B7B"
          value={pesquisa}
          onChangeText={setPesquisa}
        />
      </View>

      {/* --- BARRA DE FILTROS RÁPIDOS --- */}
      <View style={styles.filtroContainer}>
        {['TODOS', 'A+', 'B', 'C'].map(score => (
          <TouchableOpacity 
            key={score}
            onPress={() => setFiltroScore(score)}
            activeOpacity={0.7}
            style={[styles.botaoFiltro, filtroScore === score && styles.botaoFiltroAtivo]}
          >
            <Text style={[styles.textoFiltro, filtroScore === score && styles.textoFiltroAtivo]}>{score}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Listagem principal usando ListHeaderComponent para unificar a rolagem da tela */}
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={[
            styles.cardProduto,
            item.score_saude === 'C' && styles.cardCriticoBorda
          ]}>
            <View style={styles.infoContainer}>
              <Text style={styles.produtoNome}>{item.nome}</Text>
              <Text style={styles.produtoDetalhe}>
                Qtd: {item.quantidade}  ·  Valor: R$ {Number(item.preco).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.acoesContainer}>
              <View style={[
                styles.badgeScore, 
                item.score_saude === 'C' ? styles.scoreCritico : item.score_saude === 'B' ? styles.scoreAlerta : styles.scoreBom
              ]}>
                <Text style={styles.scoreTexto}>{item.score_saude}</Text>
              </View>

              {/* Ícone de Lápis para Edição */}
              <TouchableOpacity style={[styles.botaoAcaoItem, { backgroundColor: '#E1E9FF', marginRight: 6 }]} onPress={() => iniciarEdicao(item)}>
                <Text style={{ fontSize: 13 }}>✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.botaoAcaoItem, { backgroundColor: '#FFF0F0' }]} onPress={() => handleDeletar(item.id, item.nome)}>
                <Text style={styles.lixeiraIcone}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
       )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 40, paddingHorizontal: 20 },
  titulo: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', marginBottom: 15, letterSpacing: -0.5 },
  dashboardContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  dashCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dashDivider: { width: 1, height: '60%', backgroundColor: '#EAEAEA' },
  dashLabel: { fontSize: 10, fontWeight: '700', color: '#6C757D', marginBottom: 4, letterSpacing: 0.3 },
  dashValor: { fontSize: 16, fontWeight: '800', color: '#0052FF' },
  
  // ESTILOS ADICIONADOS: CONTAINER DE BI ANALÍTICO AVANÇADO
  analyticsContainer: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  analyticsTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  barraStatusContainer: { marginBottom: 10 },
  barraStatusHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barraStatusLabel: { fontSize: 12, color: '#6C757D', fontWeight: '600' },
  barraStatusPercent: { fontSize: 12, fontWeight: '800' },
  barraStatusTrilho: { height: 7, backgroundColor: '#E9ECEF', borderRadius: 4, overflow: 'hidden' },
  barraStatusPreenchimento: { height: '100%', borderRadius: 4 },
  pilulaFiltroContainer: { flexDirection: 'row', backgroundColor: '#F1F3F5', borderRadius: 12, padding: 2, alignItems: 'center' },
  pilulaFiltroAtiva: { backgroundColor: '#FFFFFF', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, elevation: 1 },
  pilulaFiltroTextoAtivo: { fontSize: 10, fontWeight: '800', color: '#1A1A1A' },
  donutLayout: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 5 },
  donutGrafico: { width: 100, height: 100, borderRadius: 50, borderWidth: 10, borderColor: '#2B9348', borderTopColor: '#E63946', borderRightColor: '#FFB703', justifyContent: 'center', alignItems: 'center' },
  donutMiolo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  donutTextoPrincipal: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  donutTextoSub: { fontSize: 9, color: '#6C757D', fontWeight: '600', marginTop: -2 },
  donutLegendaPonto: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  donutLegendaTexto: { fontSize: 12, color: '#495057', fontWeight: '600' },

  labelSection: { fontSize: 11, fontWeight: '700', color: '#6C757D', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  subtitulo: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginTop: 15, marginBottom: 10, letterSpacing: -0.3 },
  formulario: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2.5 },
  formularioModoEdicao: { borderColor: '#2B9348', borderWidth: 1.5 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { backgroundColor: '#F1F3F5', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', marginBottom: 10, fontWeight: '500' },
  botao: { backgroundColor: '#0052FF', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  searchContainer: { marginBottom: 10 },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, fontSize: 14, color: '#333', fontWeight: '500', borderWidth: 1, borderColor: '#EAEAEA', elevation: 1 },
  filtroContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  botaoFiltro: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#EAEAEA', minWidth: 75, alignItems: 'center' },
  botaoFiltroAtivo: { backgroundColor: '#0052FF' },
  textoFiltro: { color: '#6C757D', fontWeight: '800', fontSize: 12 },
  textoFiltroAtivo: { color: '#FFFFFF' },
  cardProduto: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 1.5, borderLeftWidth: 0 },
  cardCriticoBorda: { borderLeftWidth: 5, borderLeftColor: '#E63946' },
  infoContainer: { flex: 1 },
  produtoNome: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  produtoDetalhe: { fontSize: 13, color: '#6C757D', marginTop: 4, fontWeight: '500' },
  acoesContainer: { flexDirection: 'row', alignItems: 'center' },
  badgeScore: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 7, marginRight: 6 },
  scoreBom: { backgroundColor: '#D1E7DD' },
  scoreAlerta: { backgroundColor: '#FFF3CD' },
  scoreCritico: { backgroundColor: '#F8D7DA' },
  scoreTexto: { fontWeight: '800', fontSize: 12, color: '#333' },
  botaoAcaoItem: { padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  lixeiraIcone: { fontSize: 15 },
});