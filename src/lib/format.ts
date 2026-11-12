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
