/**
 * Formatação de textos de exibição.
 *
 * toUpperText: deixa o texto TODO em maiúsculas ("Caixa de Mola" → "CAIXA DE MOLA").
 * Usado em nomes de produtos e categorias. Só altera a EXIBIÇÃO — o valor salvo no banco
 * continua como foi cadastrado, então filtros, links (?categoria=...) e comparações seguem funcionando.
 */
export function toUpperText(text: string | null | undefined): string {
  return text ? text.trim().toLocaleUpperCase('pt-BR') : '';
}

// Partículas que ligam nomes ("Maria da Silva") e não contam como nome.
const NAME_PARTICLES = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'di', 'du', 'del', 'della']);

/** Primeiro e segundo nome, ignorando partículas ("Maria da Silva Souza" → "Maria Silva"). Usado no cabeçalho. */
export function firstTwoNames(name: string | null | undefined): string {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .filter((w) => w && !NAME_PARTICLES.has(w.toLocaleLowerCase('pt-BR')))
    .slice(0, 2)
    .join(' ');
}

/** Máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00), conforme a quantidade de dígitos digitados. */
export function formatCpfCnpj(value: string | null | undefined): string {
  const d = (value ?? '').replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) pelos dígitos verificadores. */
export function isValidCpfCnpj(value: string | null | undefined): boolean {
  const d = (value ?? '').replace(/\D/g, '');
  if (/^(\d)\1+$/.test(d)) return false; // todos os dígitos iguais
  const calc = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((acc, n, i) => acc + Number(n) * weights[i], 0);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  if (d.length === 11) {
    const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2], w2 = [11, ...w1];
    return calc(d.slice(0, 9), w1) === Number(d[9]) && calc(d.slice(0, 10), w2) === Number(d[10]);
  }
  if (d.length === 14) {
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], w2 = [6, ...w1];
    return calc(d.slice(0, 12), w1) === Number(d[12]) && calc(d.slice(0, 13), w2) === Number(d[13]);
  }
  return false;
}
