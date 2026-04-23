/**
 * ============================================================
 * HELPCOMMERCE - SECURE VERSION (HARDENED)
 * 🔐 Proteção Máxima Contra Ataques
 * ============================================================
 */

'use strict';

// ============================================================
// 1. CONSTANTS & CONFIGURATION (IMUTÁVEIS)
// ============================================================

const CONFIG = Object.freeze({
    MAX_TRANSACTIONS: 1000,
    MAX_DESCRIPTION_LENGTH: 255,
    MAX_CATEGORY_LENGTH: 100,
    MIN_DESCRIPTION_LENGTH: 3,
    MAX_AMOUNT: 999999999.99,
    MIN_AMOUNT: 0.01,
    STORAGE_KEY: 'helpcommerce_transactions',
    VERSION: '1.0.0'
});

// 🔐 Validação de tipos permitidos
const ALLOWED_TYPES = Object.freeze(['income', 'expense']);

// 🔐 Padrão seguro para descrição
const SAFE_DESCRIPTION_PATTERN = Object.freeze(/^[A-Za-z0-9À-ÿ\s.,\-()]*$/);

// 🔐 Padrão seguro para categoria
const SAFE_CATEGORY_PATTERN = Object.freeze(/^[A-Za-z0-9À-ÿ\s]*$/);

// 🔐 Padrão seguro para valor (com 2 casas decimais máximo)
const SAFE_AMOUNT_PATTERN = Object.freeze(/^([0-9]{1,9}(\.[0-9]{1,2})?|0\.[0-9]{1,2})$/);

// ============================================================
// 2. TRANSAÇÕES (ESTADO PRIVADO)
// ============================================================

let transactions = [];

// 🔐 Congelar array de transações contra modificações
Object.defineProperty(window, 'transactions', {
    get() { return [...transactions]; }, // Retorna cópia
    set(value) {
        if (Array.isArray(value)) {
            transactions = value.slice(); // Cópia defensiva
        }
    },
    configurable: false,
    enumerable: false
});

// ============================================================
// 3. FORMATADORES (IMUTÁVEIS)
// ============================================================

const currencyFormatter = Object.freeze(
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
);

const dateFormatter = Object.freeze(
    new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
);

// ============================================================
// 4. SANITIZAÇÃO HARDENED
// ============================================================

/**
 * 🔐 Sanitiza entrada de forma segura
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizeInput(text) {
    if (typeof text !== 'string') {
        throw new TypeError('Input deve ser string');
    }

    // 🔐 Remove tudo que não seja seguro
    return text
        .replace(/[<>"'`]/g, '') // Remove caracteres perigosos
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove controle e caracteres exóticos
        .replace(/[\u202E\u202D\u202C\u200F\u200E]/g, '') // Remove direcionais Unicode
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
}

/**
 * 🔐 Valida padrão de texto
 * @param {string} text - Texto a validar
 * @param {RegExp} pattern - Padrão a usar
 * @returns {boolean} Válido ou não
 */
function validatePattern(text, pattern) {
    if (typeof text !== 'string') return false;
    return pattern.test(text);
}

/**
 * 🔐 Valida tipo de transação
 * @param {string} type - Tipo a validar
 * @returns {boolean} Válido ou não
 */
function isValidType(type) {
    return typeof type === 'string' && ALLOWED_TYPES.includes(type);
}

/**
 * 🔐 Valida valor numérico
 * @param {number|string} amount - Valor a validar
 * @returns {object} { isValid, value, error }
 */
function validateAmount(amount) {
    // 🔐 Type check
    if (typeof amount === 'string') {
        if (!SAFE_AMOUNT_PATTERN.test(amount)) {
            return { isValid: false, error: 'Formato de valor inválido' };
        }
        amount = parseFloat(amount);
    }

    if (typeof amount !== 'number') {
        return { isValid: false, error: 'Valor deve ser numérico' };
    }

    // 🔐 Check Infinity, NaN
    if (!Number.isFinite(amount)) {
        return { isValid: false, error: 'Valor inválido (não finito)' };
    }

    // 🔐 Check range
    if (amount < CONFIG.MIN_AMOUNT || amount > CONFIG.MAX_AMOUNT) {
        return { 
            isValid: false, 
            error: `Valor deve estar entre R$ ${CONFIG.MIN_AMOUNT} e R$ ${CONFIG.MAX_AMOUNT}` 
        };
    }

    // 🔐 Check precisão decimal
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
        return { isValid: false, error: 'Máximo 2 casas decimais' };
    }

    return { isValid: true, value: amount };
}

// ============================================================
// 5. VALIDAÇÃO COMPLETA
// ============================================================

/**
 * 🔐 Valida entrada de transação
 * @param {string} description - Descrição
 * @param {number} amount - Valor
 * @param {string} type - Tipo
 * @param {string} category - Categoria
 * @returns {object} { isValid, errors }
 */
function validateTransactionInput(description, amount, type, category = '') {
    const errors = [];

    // 🔐 Validar descrição
    if (typeof description !== 'string') {
        errors.push('Descrição deve ser texto');
    } else {
        description = sanitizeInput(description);

        if (description.length === 0) {
            errors.push('Descrição é obrigatória');
        } else if (description.length < CONFIG.MIN_DESCRIPTION_LENGTH) {
            errors.push(`Descrição deve ter no mínimo ${CONFIG.MIN_DESCRIPTION_LENGTH} caracteres`);
        } else if (description.length > CONFIG.MAX_DESCRIPTION_LENGTH) {
            errors.push(`Descrição não pode exceder ${CONFIG.MAX_DESCRIPTION_LENGTH} caracteres`);
        } else if (!validatePattern(description, SAFE_DESCRIPTION_PATTERN)) {
            errors.push('Descrição contém caracteres inválidos');
        }
    }

    // 🔐 Validar valor
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
        errors.push(amountValidation.error);
    }

    // 🔐 Validar tipo
    if (!isValidType(type)) {
        errors.push('Tipo deve ser "income" ou "expense"');
    }

    // 🔐 Validar categoria (opcional)
    if (category) {
        if (typeof category !== 'string') {
            errors.push('Categoria deve ser texto');
        } else {
            category = sanitizeInput(category);
            if (category.length > CONFIG.MAX_CATEGORY_LENGTH) {
                errors.push(`Categoria não pode exceder ${CONFIG.MAX_CATEGORY_LENGTH} caracteres`);
            } else if (category.length > 0 && !validatePattern(category, SAFE_CATEGORY_PATTERN)) {
                errors.push('Categoria contém caracteres inválidos');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        data: errors.length === 0 ? {
            description: sanitizeInput(description),
            amount: amountValidation.value,
            type: type,
            category: category ? sanitizeInput(category) : ''
        } : null
    };
}

// ============================================================
// 6. ID GERAÇÃO SEGURA
// ============================================================

/**
 * 🔐 Gera ID único criptográfico
 * @returns {string} ID único
 */
function generateSecureId() {
    if (typeof crypto === 'undefined' || !crypto.randomUUID) {
        // 🔐 Fallback seguro se randomUUID não disponível
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return 'tx_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return 'tx_' + crypto.randomUUID();
}

// ============================================================
// 7. TRANSAÇÃO - OPERAÇÃO ATÔMICA
// ============================================================

/**
 * 🔐 Adiciona transação com atomicidade
 * @param {string} description - Descrição
 * @param {number} amount - Valor
 * @param {string} type - Tipo
 * @param {string} category - Categoria
 * @returns {object} { success, transaction, error }
 */
function atomicAddTransaction(description, amount, type, category = '') {
    try {
        // 🔐 Validar entrada
        const validation = validateTransactionInput(description, amount, type, category);
        
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.errors.join('; ')
            };
        }

        // 🔐 Verificar limite
        if (transactions.length >= CONFIG.MAX_TRANSACTIONS) {
            return {
                success: false,
                error: `Limite máximo de ${CONFIG.MAX_TRANSACTIONS} transações atingido`
            };
        }

        // 🔐 Criar transação
        const transaction = Object.freeze({
            id: generateSecureId(),
            description: validation.data.description,
            amount: validation.data.amount,
            type: validation.data.type,
            category: validation.data.category,
            date: new Date().toISOString(),
            version: 1 // 🔐 Para future optimistic locking
        });

        // 🔐 Cópia defensiva antes de modificar
        const tempTransactions = [...transactions];
        tempTransactions.unshift(transaction);

        // 🔐 Salvar atomicamente
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tempTransactions));

        // 🔐 Atualizar em memória apenas se localStorage sucesso
        transactions = tempTransactions;

        console.log('✅ Transação adicionada:', transaction.id);
        
        return {
            success: true,
            transaction: { ...transaction }
        };

    } catch (error) {
        console.error('❌ Erro ao adicionar:', error);
        return {
            success: false,
            error: 'Erro ao processar transação'
        };
    }
}

/**
 * 🔐 Deleta transação com atomicidade
 * @param {string} id - ID da transação
 * @returns {object} { success, error }
 */
function atomicDeleteTransaction(id) {
    try {
        // 🔐 Validar ID
        if (typeof id !== 'string' || !id.startsWith('tx_')) {
            return { success: false, error: 'ID inválido' };
        }

        // 🔐 Encontrar índice
        const index = transactions.findIndex(tx => tx.id === id);
        
        if (index === -1) {
            return { success: false, error: 'Transação não encontrada' };
        }

        // 🔐 Cópia defensiva
        const tempTransactions = [...transactions];
        tempTransactions.splice(index, 1);

        // 🔐 Salvar atomicamente
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tempTransactions));

        // 🔐 Atualizar em memória
        transactions = tempTransactions;

        console.log('✅ Transação deletada:', id);
        
        return { success: true };

    } catch (error) {
        console.error('❌ Erro ao deletar:', error);
        return { success: false, error: 'Erro ao deletar transação' };
    }
}

// ============================================================
// 8. CÁLCULO DE TOTAIS (SEGURO)
// ============================================================

/**
 * 🔐 Calcula totais com validação
 * @returns {object} { income, expense, net }
 */
function calculateTotals() {
    let income = 0;
    let expense = 0;

    try {
        for (const tx of transactions) {
            // 🔐 Validar tipo de transação
            if (!tx || typeof tx !== 'object') continue;

            if (!isValidType(tx.type)) continue;

            // 🔐 Validar valor
            if (typeof tx.amount !== 'number' || !Number.isFinite(tx.amount)) continue;

            // 🔐 Proteger contra valores extremos
            if (tx.amount < 0 || tx.amount > CONFIG.MAX_AMOUNT) continue;

            if (tx.type === 'income') {
                income += tx.amount;
            } else if (tx.type === 'expense') {
                expense += tx.amount;
            }
        }

        // 🔐 Arredondar para evitar floating point
        income = Math.round(income * 100) / 100;
        expense = Math.round(expense * 100) / 100;

        const net = income - expense;

        return { income, expense, net };

    } catch (error) {
        console.error('❌ Erro ao calcular totais:', error);
        return { income: 0, expense: 0, net: 0 };
    }
}

/**
 * 🔐 Atualiza elementos da tela
 */
function updateTotalsUI() {
    try {
        const { income, expense, net } = calculateTotals();
        
        const incomeEl = document.getElementById('total-income');
        const expenseEl = document.getElementById('total-expense');
        const netEl = document.getElementById('net-total');

        if (incomeEl) incomeEl.textContent = currencyFormatter.format(income);
        if (expenseEl) expenseEl.textContent = currencyFormatter.format(expense);
        if (netEl) {
            netEl.textContent = currencyFormatter.format(net);
            // 🔐 Mudar cor baseado em valor
            netEl.style.color = net >= 0 ? '#10B981' : '#EF4444';
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar UI:', error);
    }
}

// ============================================================
// 9. RENDERIZAÇÃO SEGURA
// ============================================================

/**
 * 🔐 Renderiza lista de transações (SEM innerHTML)
 */
function renderTransactions(toRender = transactions) {
    try {
        const list = document.getElementById('transaction-list');
        const noTransactions = document.getElementById('no-transactions');

        if (!list) return;

        // 🔐 Limpar sem innerHTML
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }

        if (toRender.length === 0) {
            if (noTransactions) noTransactions.style.display = 'block';
            return;
        }

        if (noTransactions) noTransactions.style.display = 'none';

        for (const tx of toRender) {
            // 🔐 Validar transação
            if (!tx || typeof tx !== 'object' || !isValidType(tx.type)) continue;

            try {
                const li = document.createElement('li');
                li.className = 'transaction-item';
                li.setAttribute('role', 'listitem');

                // 🔐 Ícone
                const icon = document.createElement('span');
                icon.className = 'transaction-icon';
                icon.textContent = tx.type === 'income' ? '📈' : '📉';

                // 🔐 Descrição (textContent, não innerHTML)
                const desc = document.createElement('span');
                desc.className = 'transaction-description';
                desc.textContent = tx.description || '(sem descrição)';

                // 🔐 Valor
                const amount = document.createElement('span');
                amount.className = `transaction-amount ${tx.type}`;
                const sign = tx.type === 'income' ? '+' : '-';
                amount.textContent = sign + currencyFormatter.format(Math.abs(tx.amount));

                // 🔐 Botão deletar (com validação de ID)
                const btnDelete = document.createElement('button');
                btnDelete.className = 'transaction-action-btn';
                btnDelete.textContent = '🗑️';
                btnDelete.setAttribute('aria-label', 'Deletar transação');
                btnDelete.setAttribute('data-tx-id', tx.id);

                // 🔐 Event listener seguro
                btnDelete.addEventListener('click', handleDeleteClick);

                // 🔐 Montar elementos
                li.appendChild(icon);
                li.appendChild(desc);
                li.appendChild(amount);
                li.appendChild(btnDelete);

                list.appendChild(li);

            } catch (error) {
                console.error('❌ Erro ao renderizar transação:', error);
            }
        }

    } catch (error) {
        console.error('❌ Erro ao renderizar lista:', error);
    }
}

// ============================================================
// 10. HANDLERS DE EVENTO
// ============================================================

/**
 * 🔐 Handle: Deletar transação
 */
function handleDeleteClick(event) {
    event.preventDefault();
    
    const txId = event.target.getAttribute('data-tx-id');
    
    if (!txId || typeof txId !== 'string') {
        showError('ID inválido');
        return;
    }

    if (confirm('Tem certeza que deseja deletar esta transação?')) {
        const result = atomicDeleteTransaction(txId);
        
        if (result.success) {
            updateTotalsUI();
            renderTransactions();
            showSuccess('Transação deletada com sucesso');
            saveToLocalStorage();
        } else {
            showError(result.error || 'Erro ao deletar');
        }
    }
}

/**
 * 🔐 Handle: Submissão do formulário
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeSelect = document.getElementById('type');
    const categoryInput = document.getElementById('category');

    if (!descriptionInput || !amountInput || !typeSelect) {
        showError('Formulário inválido');
        return;
    }

    const description = descriptionInput.value;
    const amount = amountInput.value;
    const type = typeSelect.value;
    const category = categoryInput ? categoryInput.value : '';

    const result = atomicAddTransaction(description, amount, type, category);

    if (result.success) {
        updateTotalsUI();
        renderTransactions();
        showSuccess('Transação adicionada com sucesso');
        event.target.reset();
        saveToLocalStorage();
    } else {
        showError(result.error || 'Erro ao adicionar');
    }
}

/**
 * 🔐 Handle: Filtrar transações
 */
function handleFilterChange() {
    try {
        const filterSelect = document.getElementById('filter-type');
        const searchInput = document.getElementById('search-input');

        if (!filterSelect) return;

        const filterType = filterSelect.value;
        let filtered = transactions;

        // 🔐 Filtrar por tipo
        if (filterType && filterType !== 'all') {
            filtered = filtered.filter(tx => tx.type === filterType);
        }

        // 🔐 Filtrar por busca
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(tx =>
                tx.description.toLowerCase().includes(searchTerm) ||
                tx.category.toLowerCase().includes(searchTerm)
            );
        }

        renderTransactions(filtered);

    } catch (error) {
        console.error('❌ Erro ao filtrar:', error);
    }
}

// ============================================================
// 11. MENSAGENS DE FEEDBACK
// ============================================================

/**
 * 🔐 Mostra mensagem de sucesso
 */
function showSuccess(message) {
    try {
        const el = document.getElementById('success-message');
        if (el) {
            el.textContent = message || 'Operação realizada com sucesso';
            el.style.display = 'block';
            setTimeout(() => {
                el.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('❌ Erro ao mostrar sucesso:', error);
    }
}

/**
 * 🔐 Mostra mensagem de erro
 */
function showError(message) {
    try {
        const el = document.getElementById('error-message');
        if (el) {
            el.textContent = message || 'Ocorreu um erro';
            el.style.display = 'block';
            setTimeout(() => {
                el.style.display = 'none';
            }, 5000);
        }
    } catch (error) {
        console.error('❌ Erro ao mostrar erro:', error);
    }
}

// ============================================================
// 12. localStorage - SEGURO
// ============================================================

/**
 * 🔐 Valida dados carregados do localStorage
 */
function validateStoredData(data) {
    if (!Array.isArray(data)) return [];

    return data.filter(tx => {
        try {
            return (
                tx &&
                typeof tx === 'object' &&
                typeof tx.id === 'string' &&
                tx.id.startsWith('tx_') &&
                typeof tx.description === 'string' &&
                typeof tx.amount === 'number' &&
                Number.isFinite(tx.amount) &&
                tx.amount > 0 &&
                tx.amount <= CONFIG.MAX_AMOUNT &&
                typeof tx.type === 'string' &&
                ALLOWED_TYPES.includes(tx.type) &&
                typeof tx.date === 'string' &&
                !isNaN(Date.parse(tx.date)) &&
                typeof tx.category === 'string' &&
                // 🔐 Proteção contra Prototype Pollution
                !Object.prototype.hasOwnProperty.call(tx, '__proto__') &&
                !Object.prototype.hasOwnProperty.call(tx, 'constructor') &&
                !Object.prototype.hasOwnProperty.call(tx, 'prototype')
            );
        } catch (error) {
            console.error('❌ Erro ao validar transação:', error);
            return false;
        }
    });
}

/**
 * 🔐 Carrega do localStorage
 */
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);

        if (!stored) {
            transactions = [];
            return true;
        }

        const parsed = JSON.parse(stored);
        const validated = validateStoredData(parsed);
        
        transactions = validated;
        console.log(`✅ Carregadas ${transactions.length} transações do localStorage`);
        
        return true;

    } catch (error) {
        console.error('❌ Erro ao carregar localStorage:', error);
        transactions = [];
        return false;
    }
}

/**
 * 🔐 Salva no localStorage
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(transactions));
        console.log('✅ Salvo no localStorage');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar localStorage:', error);
        if (error.name === 'QuotaExceededError') {
            showError('Espaço de armazenamento insuficiente');
        }
        return false;
    }
}

// ============================================================
// 13. PROTEÇÕES ADICIONAIS
// ============================================================

/**
 * 🔐 Congela funções críticas
 */
function freezeCriticalFunctions() {
    Object.defineProperty(window, 'sanitizeInput', {
        value: sanitizeInput,
        writable: false,
        configurable: false,
        enumerable: false
    });

    Object.defineProperty(window, 'validateTransactionInput', {
        value: validateTransactionInput,
        writable: false,
        configurable: false,
        enumerable: false
    });

    Object.defineProperty(window, 'atomicAddTransaction', {
        value: atomicAddTransaction,
        writable: false,
        configurable: false,
        enumerable: false
    });

    Object.defineProperty(window, 'atomicDeleteTransaction', {
        value: atomicDeleteTransaction,
        writable: false,
        configurable: false,
        enumerable: false
    });
}

// ============================================================
// 14. INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', function init() {
    try {
        console.log('🚀 Helpcommerce iniciando...');

        // 🔐 Carregar dados
        loadFromLocalStorage();

        // 🔐 Congelar funções
        freezeCriticalFunctions();

        // 🔐 Renderizar inicial
        updateTotalsUI();
        renderTransactions();

        // 🔐 Eventos
        const form = document.getElementById('transaction-form');
        const filterType = document.getElementById('filter-type');
        const searchInput = document.getElementById('search-input');

        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        if (filterType) {
            filterType.addEventListener('change', handleFilterChange);
        }

        if (searchInput) {
            searchInput.addEventListener('input', handleFilterChange);
        }

        console.log('✅ Helpcommerce pronto!');

    } catch (error) {
        console.error('❌ Erro durante inicialização:', error);
        showError('Erro ao inicializar aplicação');
    }
});

// ============================================================
// 15. PROTEÇÃO CONTRA TAMPERING EM RUNTIME
// ============================================================

// 🔐 Detecta alterações no localStorage
window.addEventListener('storage', function(event) {
    if (event.key === CONFIG.STORAGE_KEY) {
        console.warn('⚠️ localStorage foi modificado externamente. Recarregando...');
        loadFromLocalStorage();
        updateTotalsUI();
        renderTransactions();
    }
});

// ============================================================
// FIM DO SCRIPT
// ============================================================
