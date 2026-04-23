/**
 * ============================================================
 * HELPCOMMERCE - SECURE VERSION
 * Improved Security + Atomic Operations
 * ============================================================
 */

let transactions = [];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

// ==============================
// SANITIZAÇÃO SEGURA
// ==============================

function sanitizeInput(text) {
    return text
        .replace(/[<>]/g, '')
        .trim();
}

// ==============================
// VALIDAÇÃO FORTE
// ==============================

function validateInput(description, amount, type) {

    if (!description || description.trim() === '') {
        return { isValid: false, error: 'Descrição obrigatória.' };
    }

    if (description.length < 3) {
        return { isValid: false, error: 'Descrição muito curta.' };
    }

    if (description.length > 255) {
        return { isValid: false, error: 'Descrição muito longa.' };
    }

    if (!amount || isNaN(amount)) {
        return { isValid: false, error: 'Valor inválido.' };
    }

    const numericAmount = parseFloat(amount);

    if (numericAmount <= 0) {
        return { isValid: false, error: 'Valor deve ser maior que zero.' };
    }

    // 🔐 Limite máximo (proteção lógica)
    if (numericAmount > 1000000000) {
        return { isValid: false, error: 'Valor muito alto.' };
    }

    if (type !== 'income' && type !== 'expense') {
        return { isValid: false, error: 'Tipo inválido.' };
    }

    return { isValid: true };
}

// ==============================
// ID SEGURO
// ==============================

function generateId() {
    return `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// ==============================
// OPERAÇÃO ATÔMICA
// ==============================

function atomicAddTransaction(description, amount, type) {

    try {

        const transaction = {
            id: generateId(),
            description: sanitizeInput(description),
            amount: parseFloat(amount),
            type: type,
            date: new Date().toISOString()
        };

        // salva temporariamente
        const tempTransactions = [...transactions];

        tempTransactions.unshift(transaction);

        // tenta salvar
        localStorage.setItem(
            'helpcommerce_transactions',
            JSON.stringify(tempTransactions)
        );

        // só atualiza se salvar deu certo
        transactions = tempTransactions;

        renderTransactions();
        calculateTotals();

        return true;

    } catch (error) {

        console.error('Erro atômico:', error);
        alert('Erro ao salvar transação.');

        return false;
    }
}

// ==============================
// DELETE ATÔMICO
// ==============================

function atomicDeleteTransaction(id) {

    try {

        const tempTransactions =
            transactions.filter(tx => tx.id !== id);

        localStorage.setItem(
            'helpcommerce_transactions',
            JSON.stringify(tempTransactions)
        );

        transactions = tempTransactions;

        renderTransactions();
        calculateTotals();

    } catch (error) {

        console.error(error);
        alert('Erro ao deletar.');

    }
}

// ==============================
// CÁLCULO DE TOTAIS
// ==============================

function calculateTotals() {

    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {

        if (tx.type === 'income') {
            income += tx.amount;
        }

        if (tx.type === 'expense') {
            expense += tx.amount;
        }

    });

    const net = income - expense;

    document.getElementById('total-income')
        .textContent = currencyFormatter.format(income);

    document.getElementById('total-expense')
        .textContent = currencyFormatter.format(expense);

    document.getElementById('net-total')
        .textContent = currencyFormatter.format(net);
}

// ==============================
// RENDER SEGURO (SEM innerHTML)
// ==============================

function renderTransactions() {

    const list = document.getElementById('transaction-list');

    list.innerHTML = '';

    transactions.forEach(tx => {

        const li = document.createElement('li');

        li.className = 'transaction-item';

        const desc = document.createElement('span');
        desc.textContent = tx.description;

        const amount = document.createElement('span');

        amount.textContent =
            (tx.type === 'income' ? '+' : '-') +
            currencyFormatter.format(tx.amount);

        amount.className =
            'transaction-amount ' + tx.type;

        const btn = document.createElement('button');

        btn.textContent = '🗑️';

        btn.onclick = () => {
            atomicDeleteTransaction(tx.id);
        };

        li.appendChild(desc);
        li.appendChild(amount);
        li.appendChild(btn);

        list.appendChild(li);

    });
}

// ==============================
// LOAD STORAGE
// ==============================

function loadStorage() {

    try {

        const stored =
            localStorage.getItem(
                'helpcommerce_transactions'
            );

        if (stored) {

            transactions = JSON.parse(stored);

        }

    } catch (error) {

        console.error('Erro ao carregar.');

        transactions = [];

    }

}

// ==============================
// FORM HANDLER
// ==============================

document
.getElementById('transaction-form')
.addEventListener('submit', function (e) {

    e.preventDefault();

    const description =
        document.getElementById('description').value;

    const amount =
        document.getElementById('amount').value;

    const type =
        document.getElementById('type').value;

    const validation =
        validateInput(description, amount, type);

    if (!validation.isValid) {

        alert(validation.error);

        return;
    }

    atomicAddTransaction(
        description,
        amount,
        type
    );

    this.reset();

});

// ==============================
// INIT
// ==============================

document.addEventListener('DOMContentLoaded', () => {

    loadStorage();

    renderTransactions();

    calculateTotals();

});
});

// ============================================================
// FIM DO SCRIPT
// ============================================================
