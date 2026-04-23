/**
 * ============================================================
 * HELPCOMMERCE - FINANCIAL DASHBOARD
 * JavaScript Funcional - Core Features
 * ============================================================
 */

// ============================================================
// 1. ESTADO GLOBAL E CONFIGURAÇÕES
// ============================================================

let transactions = [];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

// ============================================================
// 2. ELEMENTOS DO DOM
// ============================================================

const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const categoryInput = document.getElementById('category');

const transactionList = document.getElementById('transaction-list');
const noTransactionsMessage = document.getElementById('no-transactions-message');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const netTotalEl = document.getElementById('net-total');

const searchInput = document.getElementById('search-transactions');
const filterTypeSelect = document.getElementById('filter-type');
const sortBySelect = document.getElementById('sort-by');

const successMessage = document.getElementById('form-success-message');
const errorMessage = document.getElementById('form-error-message');
const errorText = document.getElementById('error-text');

// ============================================================
// 3. FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Formata um valor numérico para moeda brasileira
 */
function formatCurrency(value) {
    return currencyFormatter.format(value);
}

/**
 * Formata uma data para o padrão brasileiro
 */
function formatDate(date) {
    return dateFormatter.format(new Date(date));
}

/**
 * Sanitiza string para prevenir XSS
 */
function sanitizeInput(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Gera um ID único para transações
 */
function generateId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida dados de entrada
 */
function validateInput(description, amount, type) {
    if (!description || description.trim() === '') {
        return { isValid: false, error: 'Descrição é obrigatória.' };
    }

    if (description.trim().length < 3) {
        return { isValid: false, error: 'Descrição deve ter ao menos 3 caracteres.' };
    }

    if (description.trim().length > 255) {
        return { isValid: false, error: 'Descrição não pode exceder 255 caracteres.' };
    }

    if (!amount || isNaN(amount)) {
        return { isValid: false, error: 'Valor deve ser um número válido.' };
    }

    if (parseFloat(amount) <= 0) {
        return { isValid: false, error: 'Valor deve ser maior que zero.' };
    }

    if (!type || (type !== 'income' && type !== 'expense')) {
        return { isValid: false, error: 'Tipo de transação é obrigatório.' };
    }

    return { isValid: true, error: null };
}

// ============================================================
// 4. FUNÇÕES DE TRANSAÇÃO
// ============================================================

/**
 * Adiciona uma nova transação
 */
function addTransaction(description, amount, type, category = '') {
    const transaction = {
        id: generateId(),
        description: sanitizeInput(description.trim()),
        amount: parseFloat(amount),
        type: type,
        category: category ? sanitizeInput(category.trim()) : '',
        date: new Date().toISOString()
    };

    transactions.unshift(transaction);
    console.log('✅ Transação adicionada:', transaction);
    return transaction;
}

/**
 * Remove uma transação pelo ID
 */
function deleteTransaction(id) {
    const index = transactions.findIndex(tx => tx.id === id);
    if (index > -1) {
        const removed = transactions.splice(index, 1);
        console.log('🗑️ Transação removida:', removed[0]);
        return true;
    }
    return false;
}

/**
 * Obtém todas as transações
 */
function getTransactions() {
    return [...transactions];
}

/**
 * Filtra transações por tipo
 */
function filterByType(type = 'all') {
    if (type === 'all') return getTransactions();
    return transactions.filter(tx => tx.type === type);
}

/**
 * Busca transações por texto
 */
function searchTransactions(searchTerm) {
    const term = searchTerm.toLowerCase();
    return transactions.filter(tx =>
        tx.description.toLowerCase().includes(term) ||
        tx.category.toLowerCase().includes(term)
    );
}

/**
 * Ordena transações
 */
function sortTransactions(sortBy = 'recent') {
    const sorted = [...transactions];

    switch (sortBy) {
        case 'oldest':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'amount-high':
            sorted.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-low':
            sorted.sort((a, b) => a.amount - b.amount);
            break;
        case 'recent':
        default:
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return sorted;
}

// ============================================================
// 5. FUNÇÕES DE CÁLCULO
// ============================================================

/**
 * Calcula totais de receita, despesa e saldo
 */
function calculateTotals() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += tx.amount;
        } else if (tx.type === 'expense') {
            totalExpense += tx.amount;
        }
    });

    const netTotal = totalIncome - totalExpense;

    // Atualiza elementos da tela
    totalIncomeEl.textContent = formatCurrency(totalIncome);
    totalExpenseEl.textContent = formatCurrency(totalExpense);
    netTotalEl.textContent = formatCurrency(netTotal);

    // Muda cor do saldo baseado no valor
    const netTotalCard = netTotalEl.closest('.net-total-card');
    if (netTotal >= 0) {
        netTotalCard.style.borderLeftColor = '#10B981';
        netTotalEl.style.color = '#10B981';
    } else {
        netTotalCard.style.borderLeftColor = '#EF4444';
        netTotalEl.style.color = '#EF4444';
    }

    return { totalIncome, totalExpense, netTotal };
}

// ============================================================
// 6. FUNÇÕES DE RENDERIZAÇÃO
// ============================================================

/**
 * Renderiza lista de transações
 */
function renderTransactions(transactionsToRender = transactions) {
    transactionList.innerHTML = '';

    if (transactionsToRender.length === 0) {
        noTransactionsMessage.style.display = 'block';
        transactionList.innerHTML = '';
        return;
    }

    noTransactionsMessage.style.display = 'none';

    transactionsToRender.forEach(tx => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="transaction-left">
                <span class="transaction-icon">
                    ${tx.type === 'income' ? '📈' : '📉'}
                </span>
                <div class="transaction-info">
                    <span class="transaction-description">${tx.description}</span>
                    <span class="transaction-metadata">
                        ${formatDate(tx.date)}
                    </span>
                    ${tx.category ? `<span class="transaction-category">${tx.category}</span>` : ''}
                </div>
            </div>
            <div class="transaction-right">
                <span class="transaction-amount ${tx.type}">
                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                </span>
                <div class="transaction-actions">
                    <button class="transaction-action-btn" title="Deletar" onclick="handleDeleteTransaction('${tx.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        `;
        transactionList.appendChild(li);
    });
}

/**
 * Aplica filtros e busca
 */
function applyFilters() {
    let filtered = [...transactions];

    // Filtro por tipo
    const filterType = filterTypeSelect.value;
    if (filterType !== 'all') {
        filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Busca por texto
    const searchTerm = searchInput.value;
    if (searchTerm) {
        filtered = filtered.filter(tx =>
            tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Ordenação
    const sortBy = sortBySelect.value;
    filtered = sortTransactions(sortBy);

    // Reaplicar filtro de tipo após ordenação
    if (filterType !== 'all') {
        filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Reaplicar busca após ordenação
    if (searchTerm) {
        filtered = filtered.filter(tx =>
            tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    renderTransactions(filtered);
}

// ============================================================
// 7. FUNÇÕES DE MENSAGEM
// ============================================================

/**
 * Mostra mensagem de sucesso
 */
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'flex';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

/**
 * Mostra mensagem de erro
 */
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// ============================================================
// 8. EVENT HANDLERS
// ============================================================

/**
 * Handle: Submissão do formulário
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const description = descriptionInput.value;
    const amount = amountInput.value;
    const type = typeSelect.value;
    const category = categoryInput.value;

    // Validação
    const validation = validateInput(description, amount, type);
    if (!validation.isValid) {
        showError(validation.error);
        return;
    }

    // Adiciona transação
    addTransaction(description, amount, type, category);

    // Atualiza tela
    calculateTotals();
    applyFilters();

    // Limpa formulário
    form.reset();
    typeSelect.value = '';

    // Mostra sucesso
    showSuccess('Transação adicionada com sucesso!');

    // Salva em localStorage
    saveToLocalStorage();
}

/**
 * Handle: Deletar transação
 */
function handleDeleteTransaction(id) {
    if (confirm('Tem certeza que deseja deletar esta transação?')) {
        if (deleteTransaction(id)) {
            calculateTotals();
            applyFilters();
            showSuccess('Transação deletada com sucesso!');
            saveToLocalStorage();
        }
    }
}

/**
 * Handle: Filtro por tipo
 */
function handleFilterChange() {
    applyFilters();
}

/**
 * Handle: Busca
 */
function handleSearch() {
    applyFilters();
}

/**
 * Handle: Ordenação
 */
function handleSortChange() {
    applyFilters();
}

// ============================================================
// 9. LOCALSTORAGE - PERSISTÊNCIA DE DADOS
// ============================================================

/**
 * Salva transações no localStorage
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('helpcommerce_transactions', JSON.stringify(transactions));
        console.log('💾 Dados salvos no localStorage');
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
    }
}

/**
 * Carrega transações do localStorage
 */
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('helpcommerce_transactions');
        if (stored) {
            transactions = JSON.parse(stored);
            console.log('📂 Dados carregados do localStorage');
            return true;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
    return false;
}

/**
 * Limpa localStorage (para desenvolvimento)
 */
function clearLocalStorage() {
    localStorage.removeItem('helpcommerce_transactions');
    transactions = [];
    console.log('🧹 localStorage limpo');
}

// ============================================================
// 10. DADOS INICIAIS PARA DEMONSTRAÇÃO
// ============================================================

/**
 * Carrega dados de exemplo
 */
function loadDemoData() {
    const demoTransactions = [
        {
            id: generateId(),
            description: 'Venda de Produto A',
            amount: 1500.00,
            type: 'income',
            category: 'Vendas',
            date: new Date(2024, 3, 15).toISOString()
        },
        {
            id: generateId(),
            description: 'Pagamento de Fornecedor',
            amount: 500.00,
            type: 'expense',
            category: 'Fornecedores',
            date: new Date(2024, 3, 14).toISOString()
        },
        {
            id: generateId(),
            description: 'Campanha de Marketing',
            amount: 300.00,
            type: 'expense',
            category: 'Marketing',
            date: new Date(2024, 3, 13).toISOString()
        },
        {
            id: generateId(),
            description: 'Serviço de Consultoria',
            amount: 2000.00,
            type: 'income',
            category: 'Serviços',
            date: new Date(2024, 3, 12).toISOString()
        }
    ];

    transactions = demoTransactions;
    saveToLocalStorage();
    console.log('📊 Dados de demonstração carregados');
}

// ============================================================
// 11. INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Helpcommerce iniciando...');

    // Tenta carregar dados salvos
    const hasLocalStorage = loadFromLocalStorage();

    // Se não houver dados, carrega dados de demonstração
    if (!hasLocalStorage || transactions.length === 0) {
        loadDemoData();
    }

    // Event Listeners
    form.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
    filterTypeSelect.addEventListener('change', handleFilterChange);
    sortBySelect.addEventListener('change', handleSortChange);

    // Navegação por âncoras
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Menu de usuário
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', () => {
            userDropdown.style.display = 
                userDropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Fecha dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userDropdown.style.display = 'none';
            }
        });
    }

    // Renderiza inicial
    calculateTotals();
    renderTransactions();

    console.log('✅ Helpcommerce pronto para uso!');
    console.log('📊 Total de transações:', transactions.length);
});

// ============================================================
// FIM DO SCRIPT
// ============================================================