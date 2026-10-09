// Utilitários compartilhados do painel admin: mensagens de erro amigáveis e números seguros.

// Converte erros técnicos (Postgres/Supabase) em mensagens claras para o usuário.
export function friendlyError(err: any, context = 'salvar o produto'): string {
    const raw: string = String(err?.message ?? err ?? '');
    const code: string = String(err?.code ?? '');
    const msg = raw.toLowerCase();

    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed'))
        return `Sem conexão com o servidor. Verifique sua internet e tente novamente.`;
    if (code === '42501' || msg.includes('row-level security') || msg.includes('permission denied'))
        return `Você não tem permissão para ${context}. Entre novamente com uma conta de administrador.`;
    if (msg.includes('jwt') && msg.includes('expired'))
        return 'Sua sessão expirou. Faça login novamente para continuar.';
    if (code === '23502' || msg.includes('not-null') || msg.includes('null value')) {
        if (msg.includes('product_variants')) return 'Não foi possível salvar as variações do produto. Confira se todas as opções estão preenchidas e tente novamente.';
        if (msg.includes('product_brands'))   return 'Não foi possível salvar as marcas do produto. Confira se todas as marcas estão preenchidas e tente novamente.';
        return 'Existe um campo obrigatório sem preenchimento. Revise o formulário e tente novamente.';
    }
    if (code === '23505' || msg.includes('duplicate key'))
        return 'Já existe um registro com esses dados. Verifique nomes repetidos (marcas, opções ou produto).';
    if (code === '23503' || msg.includes('foreign key'))
        return 'Este item está vinculado a outro registro e não pôde ser salvo/removido.';
    if (code === '22P02' || msg.includes('invalid input syntax'))
        return 'Algum campo contém um valor inválido (ex.: texto em campo numérico). Revise preço e estoque.';
    if (code === '42703' || code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache'))
        return 'O banco de dados está desatualizado em relação ao sistema (falta executar uma migração SQL). Avise o responsável técnico.';
    return `Não foi possível ${context}. Tente novamente; se o erro continuar, avise o suporte.`;
}

// Número seguro: nunca devolve NaN/negativo, para que preço/estoque não quebrem o salvamento.
export const toNum = (v: unknown, int = false): number => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return int ? Math.trunc(n) : n;
};
