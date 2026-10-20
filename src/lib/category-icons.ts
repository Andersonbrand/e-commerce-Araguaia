/**
 * Escolha de ícone por categoria de material (lógica pura, sem JSX).
 *
 * Cada categoria recebe um ícone que combina com o material e NENHUM ícone se repete entre categorias
 * do mesmo carrossel: se o ícone ideal já foi usado, tenta o alternativo e, por último, um ícone
 * genérico livre. As regras vão da mais específica para a mais geral.
 */

/** Remove acentos e põe em minúsculas para as regras não dependerem de "ç", "ã"... */
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// [expressão sobre o nome normalizado, ícones candidatos em ordem de preferência]
const RULES: Array<[RegExp, string[]]> = [
  [/acessorio.*serralh|dobradica/,                    ['hinge']],
  [/cabo/,                                            ['cable']],
  [/bobina/,                                          ['coil']],
  [/arame/,                                           ['wire']],
  [/corda|corrente/,                                  ['rope']],
  [/vergalh/,                                         ['rebar']],
  [/treli|coluna/,                                    ['truss']],
  [/cantoneira/,                                      ['angle']],
  [/aco(s)? plano|chato/,                             ['flat']],
  [/barra|perfil|perfis|viga|metalon/,                ['beam']],
  [/chapa|lambri|forro|placa/,                        ['sheets']],
  [/drywall|gesso|divisoria/,                         ['drywall']],
  [/translucid/,                                      ['sunroof']],
  [/zinco|galvaniz|ondulad/,                          ['corrugated', 'roof']],
  [/fibrocimento|brasilit|eternit|ceramic|telha|cobertura/, ['roof', 'corrugated']],
  [/cimento|\bcal\b|concreto/,                        ['sack']],
  [/argamassa|rejunte|reboco|massa/,                  ['bucket']],
  [/tubo|cano|conexao|conexoes/,                      ['pipe']],
  [/prego/,                                           ['nail']],
  [/parafus|porca|arruela|fixa/,                      ['screw']],
  [/tela|malha|gradil|alambrado/,                     ['mesh']],
  [/tijolo|bloco|brita|areia|pedra/,                  ['brick']],
  [/serralh|fechadura|cadeado/,                       ['key']],
  [/ferrag|ferrament/,                                ['tools', 'hammer']],
  [/tinta|verniz|solvente|pintura/,                   ['paint']],
  [/eletric|fio\b|fiacao|lampada|tomada/,             ['electric']],
  [/solda|eletrodo/,                                  ['weld']],
  [/outro|diverso/,                                   ['dots']],
];

/** Ícones genéricos, usados só quando o nome não combina com nenhuma regra (ou o ideal já foi usado). */
export const FALLBACK_POOL = [
  'cube', 'puzzle', 'swatch', 'archive', 'storefront', 'sparkles',
  'stack', 'cog', 'beaker', 'truck', 'tag', 'cubeT',
];

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

/** Devolve { nomeDaCategoria: chaveDoIcone } sem repetir chaves enquanto houver ícones livres. */
export function assignCategoryIcons(names: string[]): Record<string, string> {
  const used = new Set<string>();
  const out: Record<string, string> = {};
  const pending: string[] = [];

  names.forEach((name) => {
    if (out[name]) return;
    const n = norm(name);
    const candidates = RULES.filter(([re]) => re.test(n)).flatMap(([, keys]) => keys);
    const pick = candidates.find((k) => !used.has(k));
    if (pick) { used.add(pick); out[name] = pick; } else if (!pending.includes(name)) pending.push(name);
  });

  pending.forEach((name) => {
    const free = FALLBACK_POOL.filter((k) => !used.has(k));
    const pool = free.length > 0 ? free : FALLBACK_POOL; // acabaram os livres: só então repete
    const key = pool[hash(name) % pool.length];
    used.add(key);
    out[name] = key;
  });

  return out;
}
