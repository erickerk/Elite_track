-- =====================================================
-- MIGRAÇÃO 017: SEED / RESET DADOS DE TESTE
-- Elite Track - Reset completo dos dados de teste
-- Data: 2026-02-08
-- IMPORTANTE: Executar manualmente no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PARTE 0: IDs FIXOS (facilita referência cruzada)
-- =====================================================
-- Admin:    109eb44b-8057-4591-8be5-cbdb4e5cbb72
-- Executor: a1b2c3d4-e5f6-7890-abcd-ef1234567890 (João)
-- Cliente Erick: b2c3d4e5-f6a7-8901-bcde-f12345678901
-- Veículo Erick: c3d4e5f6-a7b8-9012-cdef-123456789012
-- Projeto Erick: d4e5f6a7-b8c9-0123-defa-234567890123

-- =====================================================
-- PARTE 1: LIMPAR DADOS ANTIGOS DO ERICK (CASCADE)
-- =====================================================

-- Apagar projetos antigos do Erick (cascateia para timeline_steps, elite_cards, blinding_specs, etc.)
DELETE FROM projects WHERE user_id IN (SELECT id FROM users WHERE email = 'erick@teste.com');
-- Apagar veículos antigos do Erick
DELETE FROM vehicles WHERE plate = 'ABC1E23';
-- Também apagar pelo UUID fixo caso exista de execução anterior
DELETE FROM projects WHERE id = 'd4e5f6a7-b8c9-0123-defa-234567890123';
DELETE FROM vehicles WHERE id = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

-- =====================================================
-- PARTE 2: GARANTIR EXECUTOR JOÃO NO TABELA users
-- =====================================================

INSERT INTO users (id, name, email, phone, role, vip_level, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'João Executor',
  'joao@teste.com',
  '(11) 97777-7777',
  'executor',
  'standard',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = 'executor',
  updated_at = NOW();

-- =====================================================
-- PARTE 3: CRIAR CLIENTE ERICK
-- =====================================================

-- 3a. users_elitetrack (autenticação)
INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, vip_level, created_at, updated_at)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Erick Silva',
  'erick@teste.com',
  '(11) 96666-6666',
  'client',
  'Teste@2025',
  true,
  'gold',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  password_hash = EXCLUDED.password_hash,
  vip_level = 'gold',
  is_active = true,
  updated_at = NOW();

-- 3b. users (FK de projetos)
INSERT INTO users (id, name, email, phone, role, vip_level, created_at, updated_at)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Erick Silva',
  'erick@teste.com',
  '(11) 96666-6666',
  'client',
  'gold',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  vip_level = 'gold',
  updated_at = NOW();

-- =====================================================
-- PARTE 4: VEÍCULO DO ERICK
-- =====================================================

INSERT INTO vehicles (id, brand, model, year, color, plate, blinding_level, created_at, updated_at)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Toyota',
  'Corolla Cross XRX',
  2024,
  'Preto Ônix',
  'ABC1E23',
  'III-A',
  NOW(),
  NOW()
)
ON CONFLICT (plate) DO UPDATE SET
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  year = EXCLUDED.year,
  color = EXCLUDED.color,
  blinding_level = EXCLUDED.blinding_level,
  updated_at = NOW();

-- =====================================================
-- PARTE 5: PROJETO DO ERICK
-- =====================================================

INSERT INTO projects (
  id, vehicle_id, user_id, status, progress,
  start_date, estimated_delivery, actual_delivery,
  qr_code, executor_id,
  vehicle_received_date, process_start_date, completed_date,
  created_at, updated_at
)
VALUES (
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  (SELECT id FROM vehicles WHERE plate = 'ABC1E23' LIMIT 1),
  (SELECT id FROM users WHERE email = 'erick@teste.com' LIMIT 1),
  'completed',
  100,
  '2025-11-01',
  '2025-12-15',
  '2025-12-12',
  'ELITE-ERICK001',
  (SELECT id FROM users WHERE email = 'joao@teste.com' LIMIT 1),
  '2025-11-01T09:00:00Z',
  '2025-11-03T08:00:00Z',
  '2025-12-12T17:00:00Z',
  NOW(),
  NOW()
);

-- =====================================================
-- PARTE 6: TIMELINE DO ERICK (10 etapas completas)
-- =====================================================

INSERT INTO timeline_steps (id, project_id, title, description, status, date, estimated_date, technician, notes, sort_order) VALUES
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Recebimento do Veículo',       'Veículo recebido na oficina para início do processo', 'completed', '2025-11-01T09:00:00Z', '2025-11-01T09:00:00Z', 'João Executor', 'Veículo em perfeito estado', 1),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Desmontagem',                   'Desmontagem completa do interior e componentes',       'completed', '2025-11-03T10:00:00Z', '2025-11-03T10:00:00Z', 'Carlos Mendes', 'Todas as peças catalogadas',  2),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Instalação da Manta Balística', 'Aplicação da manta de proteção balística nas portas e laterais', 'completed', '2025-11-08T14:00:00Z', '2025-11-07T09:00:00Z', 'Carlos Mendes', 'Manta Kevlar® nível III-A',   3),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Blindagem do Teto',             'Instalação de proteção balística no teto',              'completed', '2025-11-12T11:00:00Z', '2025-11-11T09:00:00Z', 'Carlos Mendes', 'Proteção full coverage',      4),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Instalação dos Vidros',         'Instalação dos vidros blindados laminados',             'completed', '2025-11-18T16:00:00Z', '2025-11-18T09:00:00Z', 'Paulo Silva',   'Vidros 21mm multilayer',      5),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Montagem Elétrica',             'Reinstalação de toda a parte elétrica do veículo',      'completed', '2025-11-22T15:00:00Z', '2025-11-22T09:00:00Z', 'André Santos',  'Chicotes originais testados', 6),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Montagem Interior',             'Remontagem do interior com acabamento premium',         'completed', '2025-11-28T17:00:00Z', '2025-11-27T09:00:00Z', 'Carlos Mendes', 'Acabamento impecável',        7),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Testes de Qualidade',           'Bateria completa de testes de qualidade e segurança',   'completed', '2025-12-03T14:00:00Z', '2025-12-02T09:00:00Z', 'João Executor', 'Todos os testes aprovados',   8),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Laudo e Documentação',          'Emissão do laudo EliteShield e documentação completa',  'completed', '2025-12-08T10:00:00Z', '2025-12-08T09:00:00Z', 'João Executor', 'Laudo digital gerado',        9),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Entrega do Veículo',            'Entrega do veículo blindado ao proprietário',           'completed', '2025-12-12T15:00:00Z', '2025-12-12T09:00:00Z', 'João Executor', 'Cliente satisfeito',         10);

-- =====================================================
-- PARTE 7: ELITE CARD DO ERICK
-- =====================================================

INSERT INTO elite_cards (id, project_id, card_number, issue_date, expiry_date, member_since, rescue_phone, support_phone, created_at)
VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'ELITE-ERI-2025-0001',
  '2025-12-12',
  '2030-12-12',
  '2025-12-12',
  '0800-777-ELITE',
  '(11) 3456-7890',
  NOW()
);

-- Benefícios do cartão
INSERT INTO card_benefits (id, elite_card_id, benefit) 
SELECT gen_random_uuid(), ec.id, b.benefit
FROM elite_cards ec
CROSS JOIN (VALUES 
  ('Guincho 24h gratuito'),
  ('Revisão anual sem custo'),
  ('Assistência técnica prioritária'),
  ('Desconto em manutenção preventiva'),
  ('Acesso ao Elite Concierge Veicular')
) AS b(benefit)
WHERE ec.project_id = 'd4e5f6a7-b8c9-0123-defa-234567890123';

-- =====================================================
-- PARTE 8: BLINDING SPECS DO ERICK
-- =====================================================

INSERT INTO blinding_specs (id, project_id, level, certification, certification_number, glass_type, glass_thickness, warranty, technical_responsible, installation_date, total_weight, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'III-A',
  'NIJ 0101.06',
  'ELT-2025-001234',
  'Laminado Multilayer',
  '21mm',
  '5 anos',
  'Carlos Mendes - Eng. Mecânico CREA-SP 123456',
  '2025-11-01',
  '85kg',
  NOW(),
  NOW()
);

-- Materiais de blindagem
INSERT INTO blinding_materials (id, blinding_spec_id, name, type, thickness, area)
SELECT gen_random_uuid(), bs.id, m.name, m.type, m.thickness, m.area
FROM blinding_specs bs
CROSS JOIN (VALUES
  ('Manta Kevlar® KM2+',    'Aramida',   '8mm',  'Portas e laterais'),
  ('Aço Balístico ARMOX 500','Aço',       '3mm',  'Colunas A/B/C'),
  ('Vidro Multilayer',       'Laminado',  '21mm', 'Todos os vidros'),
  ('Overlap Balístico',      'Compósito', '5mm',  'Juntas e frestas')
) AS m(name, type, thickness, area)
WHERE bs.project_id = 'd4e5f6a7-b8c9-0123-defa-234567890123';

-- Proteções do corpo
INSERT INTO body_protections (id, blinding_spec_id, protection_type)
SELECT gen_random_uuid(), bs.id, p.protection_type
FROM blinding_specs bs
CROSS JOIN (VALUES
  ('Portas dianteiras'),
  ('Portas traseiras'),
  ('Colunas A, B e C'),
  ('Teto completo'),
  ('Piso (opcional - instalado)'),
  ('Tampa do porta-malas')
) AS p(protection_type)
WHERE bs.project_id = 'd4e5f6a7-b8c9-0123-defa-234567890123';

-- Features adicionais
INSERT INTO additional_features (id, blinding_spec_id, feature)
SELECT gen_random_uuid(), bs.id, f.feature
FROM blinding_specs bs
CROSS JOIN (VALUES
  ('Run-flat nas 4 rodas'),
  ('Bateria blindada'),
  ('Sirene de pânico'),
  ('GPS rastreador anti-jamming')
) AS f(feature)
WHERE bs.project_id = 'd4e5f6a7-b8c9-0123-defa-234567890123';

-- =====================================================
-- PARTE 9: DELIVERY SCHEDULE
-- =====================================================

INSERT INTO delivery_schedules (id, project_id, date, time, location, contact_person, contact_phone, confirmed, notes, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  '2025-12-12',
  '15:00',
  'Elite Blindagens - Unidade Tatuapé, SP',
  'Erick Silva',
  '(11) 96666-6666',
  true,
  'Entrega realizada com sucesso. Cliente orientado sobre cuidados.',
  NOW(),
  NOW()
);

-- =====================================================
-- PARTE 10: DELIVERY CHECKLIST
-- =====================================================

INSERT INTO delivery_checklists (id, project_id, item, checked, category, sort_order) VALUES
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'CRLV atualizado',                  true, 'documents',   1),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Laudo EliteShield entregue',       true, 'documents',   2),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Manual do proprietário',           true, 'documents',   3),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Certificado de blindagem',         true, 'documents',   4),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Vidros sem riscos/marcas',         true, 'vehicle',     5),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Pintura sem danos',               true, 'vehicle',     6),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Funcionamento das travas',         true, 'vehicle',     7),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Teste de vidros elétricos',        true, 'vehicle',     8),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Tapetes e acessórios',            true, 'accessories', 9),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Chave reserva entregue',          true, 'accessories', 10),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Assinatura do cliente no termo',  true, 'final',       11),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-234567890123', 'Fotos de entrega registradas',    true, 'final',       12);

-- =====================================================
-- PARTE 11: VEHICLE OWNER
-- =====================================================

INSERT INTO vehicle_owners (id, project_id, name, cpf, phone, email, ownership_start, is_current)
VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'Erick Silva',
  '123.456.789-00',
  '(11) 96666-6666',
  'erick@teste.com',
  '2025-12-12',
  true
);

-- =====================================================
-- PARTE 12: VERIFICAÇÃO FINAL
-- =====================================================

-- Confirmar dados inseridos
DO $$
DECLARE
  v_user_count INTEGER;
  v_project_count INTEGER;
  v_card_count INTEGER;
  v_specs_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM users WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  SELECT COUNT(*) INTO v_project_count FROM projects WHERE id = 'd4e5f6a7-b8c9-0123-defa-234567890123';
  SELECT COUNT(*) INTO v_card_count FROM elite_cards WHERE project_id = 'd4e5f6a7-b8c9-0123-defa-234567890123';
  SELECT COUNT(*) INTO v_specs_count FROM blinding_specs WHERE project_id = 'd4e5f6a7-b8c9-0123-defa-234567890123';

  RAISE NOTICE '=== SEED CONCLUÍDO ===';
  RAISE NOTICE 'User Erick: % registro(s)', v_user_count;
  RAISE NOTICE 'Projeto Erick: % registro(s)', v_project_count;
  RAISE NOTICE 'Elite Card: % registro(s)', v_card_count;
  RAISE NOTICE 'Blinding Specs: % registro(s)', v_specs_count;
END $$;
