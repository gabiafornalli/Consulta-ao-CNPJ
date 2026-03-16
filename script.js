// Máscara para o input
document.getElementById('cnpjInput').addEventListener('input', (e) => {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/);
    e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + '.' + x[3] + '/' + x[4] + (x[5] ? '-' + x[5] : '');
});

async function buscarCNPJ() {
    const cnpjLimpo = document.getElementById('cnpjInput').value.replace(/\D/g, '');
    const loader = document.getElementById('loader');
    const card = document.getElementById('resultCard');

    if (cnpjLimpo.length !== 14) {
        alert("Digite um CNPJ completo com 14 dígitos.");
        return;
    }

    loader.style.display = 'block';
    card.style.display = 'none';

    try {
        // Usando a API v2 da BrasilAPI que é mais robusta
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
        
        if (!response.ok) {
            throw new Error('Não foi possível encontrar este CNPJ.');
        }

        const data = await response.json();
        exibirResultados(data);

    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro: " + error.message);
    } finally {
        loader.style.display = 'none';
    }
}

function exibirResultados(data) {
    // Preenchimento com verificações de segurança (Fallback para campos vazios)
    document.getElementById('res_razao').innerText = data.razao_social || 'NÃO INFORMADO';
    document.getElementById('res_fantasia').innerText = data.nome_fantasia || 'NÃO INFORMADO';
    document.getElementById('res_cnpj').innerText = data.cnpj || 'NÃO INFORMADO';
    
    // Tratamento para atividade principal (pode variar entre APIs)
    const atividade = data.cnae_fiscal_descricao || (data.estabelecimento && data.estabelecimento.atividade_principal ? data.estabelecimento.atividade_principal.descricao : 'NÃO INFORMADO');
    document.getElementById('res_atividade').innerText = atividade;

    // Formatação de Capital Social
    const capital = data.capital_social ? 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.capital_social) : 
        'R$ 0,00';
    document.getElementById('res_capital').innerText = capital;

    // Montagem do Endereço
    const rua = data.logradouro || "";
    const num = data.numero || "";
    const bairro = data.bairro || "";
    const cidade = data.municipio || "";
    const uf = data.uf || "";
    document.getElementById('res_endereco').innerText = `${rua}, ${num} - ${bairro}, ${cidade}/${uf}`;

    // Telefone
    document.getElementById('res_telefone').innerText = data.ddd_telefone_1 || 'NÃO INFORMADO';

    document.getElementById('resultCard').style.display = 'block';
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const azulMarinho = [0, 0, 128];
    const azulRoyal = [65, 105, 225];

    // Cabeçalho do PDF
    doc.setFillColor(...azulMarinho);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Relatório de Consulta CNPJ", 20, 20);

    // Conteúdo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    const dados = [
        ["Razão Social:", document.getElementById('res_razao').innerText],
        ["Nome Fantasia:", document.getElementById('res_fantasia').innerText],
        ["CNPJ:", document.getElementById('res_cnpj').innerText],
        ["Atividade:", document.getElementById('res_atividade').innerText],
        ["Capital Social:", document.getElementById('res_capital').innerText],
        ["Endereço:", document.getElementById('res_endereco').innerText],
        ["Telefone:", document.getElementById('res_telefone').innerText]
    ];

    let y = 45;
    dados.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...azulRoyal);
        doc.text(label, 20, y);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const textLines = doc.splitTextToSize(value, 140);
        doc.text(textLines, 65, y);
        
        y += (textLines.length * 7) + 3;
    });

    doc.save(`Consulta_CNPJ_${document.getElementById('res_cnpj').innerText}.pdf`);
}