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
