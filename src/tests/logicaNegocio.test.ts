/**
 * Testes — E-commerce Araguaia
 *
 * Foco: lógica de carrinho, precificação e permissões de admin.
 * Banco de dados mockado — sem conexão com Supabase real.
 */

import { describe, it, expect } from 'vitest';

// ─── Lógica do carrinho ───────────────────────────────────────────────────────

describe('Cálculo do carrinho de compras', () => {
    const calcularTotal = (items) =>
        items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    it('calcula total corretamente para múltiplos itens', () => {
        const items = [
            { name: 'Cimento CP-II', price: 32.90, quantity: 10 },
            { name: 'Vergalhão 10mm', price: 45.00, quantity: 5  },
        ];
        expect(calcularTotal(items)).toBeCloseTo(554.00);
    });

    it('retorna 0 para carrinho vazio', () => {
        expect(calcularTotal([])).toBe(0);
    });

    it('lida com quantity = 1 corretamente', () => {
        const items = [{ price: 125.50, quantity: 1 }];
        expect(calcularTotal(items)).toBeCloseTo(125.50);
    });

    it('quantities maiores multiplicam corretamente', () => {
        const items = [{ price: 32.90, quantity: 100 }];
        expect(calcularTotal(items)).toBeCloseTo(3290.00);
    });
});

// ─── Lógica de permissões ─────────────────────────────────────────────────────

describe('Controle de acesso admin', () => {
    const isAdmin = (user) => user?.app_metadata?.role === 'admin';

    it('usuário sem role não é admin', () => {
        expect(isAdmin({ app_metadata: {} })).toBe(false);
    });

    it('usuário com role "admin" é identificado corretamente', () => {
        expect(isAdmin({ app_metadata: { role: 'admin' } })).toBe(true);
    });

    it('usuário nulo não quebra a verificação', () => {
        expect(isAdmin(null)).toBe(false);
        expect(isAdmin(undefined)).toBe(false);
    });

    it('role diferente de "admin" não tem acesso', () => {
        expect(isAdmin({ app_metadata: { role: 'user' } })).toBe(false);
        expect(isAdmin({ app_metadata: { role: 'manager' } })).toBe(false);
    });
});

// ─── Validações de produto ────────────────────────────────────────────────────

describe('Validação de dados de produto', () => {
    const validarProduto = (produto) => {
        const erros = [];
        if (!produto.name || produto.name.trim() === '') erros.push('Nome obrigatório');
        if (!produto.category) erros.push('Categoria obrigatória');
        if (produto.price < 0) erros.push('Preço não pode ser negativo');
        if (produto.stock < 0) erros.push('Estoque não pode ser negativo');
        return erros;
    };

    it('produto válido não retorna erros', () => {
        const produto = { name: 'Cimento CP-II 50kg', category: 'Cimento', price: 32.90, stock: 100 };
        expect(validarProduto(produto)).toHaveLength(0);
    });

    it('nome em branco é inválido', () => {
        const produto = { name: '', category: 'Cimento', price: 10, stock: 5 };
        expect(validarProduto(produto)).toContain('Nome obrigatório');
    });

    it('preço negativo é inválido', () => {
        const produto = { name: 'Produto', category: 'Ferragens', price: -5, stock: 10 };
        expect(validarProduto(produto)).toContain('Preço não pode ser negativo');
    });

    it('estoque negativo é inválido', () => {
        const produto = { name: 'Produto', category: 'Ferragens', price: 10, stock: -1 };
        expect(validarProduto(produto)).toContain('Estoque não pode ser negativo');
    });

    it('múltiplos erros são retornados juntos', () => {
        const produto = { name: '', category: '', price: -1, stock: -5 };
        const erros = validarProduto(produto);
        expect(erros.length).toBeGreaterThanOrEqual(2);
    });
});

// ─── Status dos pedidos ────────────────────────────────────────────────────────

describe('Fluxo de status dos pedidos', () => {
    const STATUS_VALIDOS = ['pending', 'confirmed', 'delivered', 'cancelled'];
    const TRANSICOES_VALIDAS = {
        pending:   ['confirmed', 'cancelled'],
        confirmed: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
    };

    it('todos os status reconhecidos são válidos', () => {
        STATUS_VALIDOS.forEach(s => {
            expect(TRANSICOES_VALIDAS[s]).toBeDefined();
        });
    });

    it('pedido entregue não pode mudar de status', () => {
        expect(TRANSICOES_VALIDAS['delivered']).toHaveLength(0);
    });

    it('pedido cancelado não pode mudar de status', () => {
        expect(TRANSICOES_VALIDAS['cancelled']).toHaveLength(0);
    });

    it('pedido pendente pode ser confirmado ou cancelado', () => {
        expect(TRANSICOES_VALIDAS['pending']).toContain('confirmed');
        expect(TRANSICOES_VALIDAS['pending']).toContain('cancelled');
    });
});
