-- Migration: adiciona suporte a regras de dependência entre grupos de variantes
-- Executa no Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS variant_rules JSONB DEFAULT NULL;

COMMENT ON COLUMN products.variant_rules IS
'Regras de dependência entre grupos de variantes. Exemplo:
[
  {
    "when": { "group": "Espessura", "label": "10 - 3,4mm" },
    "allows": { "group": "Peso", "labels": ["1kg", "50kg"] }
  },
  {
    "when": { "group": "Espessura", "label": "12 - 2,76mm" },
    "allows": { "group": "Peso", "labels": ["1kg"] }
  }
]
Se variant_rules for null ou vazio, todos os grupos são independentes (comportamento padrão).';
