-- Inserir Admin Master
INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, vip_level, created_at, updated_at)
VALUES (
  'admin-master-001',
  'Junior Rodrigues',
  'juniorrodrigues1011@gmail.com',
  '(11) 99999-9999',
  'super_admin',
  'Elite@2024#Admin!',
  true,
  'platinum',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- Inserir Executor
INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, created_at, updated_at)
VALUES (
  'executor-prod-001',
  'Executor Elite',
  'executor@elite.com',
  '(11) 98888-8888',
  'executor',
  'executor123',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  updated_at = NOW();

-- Inserir Usuário de Teste João
INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, created_at, updated_at)
VALUES (
  'client-joao-001',
  'João Teste',
  'joao@teste.com',
  '(11) 97777-7777',
  'client',
  'Teste@2025',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  updated_at = NOW();

-- Verificar usuários criados
SELECT id, name, email, role, is_active FROM users_elitetrack WHERE email IN ('juniorrodrigues1011@gmail.com', 'executor@elite.com', 'joao@teste.com');
