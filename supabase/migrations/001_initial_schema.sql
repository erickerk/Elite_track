-- =====================================================
-- ELITE TRACK - SCHEMA INICIAL DO BANCO DE DADOS
-- Migração: 001_initial_schema.sql
-- Data: 26/12/2024
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('client', 'executor', 'admin');
CREATE TYPE vip_level AS ENUM ('standard', 'gold', 'platinum');
CREATE TYPE project_status AS ENUM ('pending', 'in_progress', 'completed', 'delivered');
CREATE TYPE step_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_category AS ENUM ('general', 'technical', 'delivery', 'warranty', 'rescue');
CREATE TYPE invite_status AS ENUM ('pending', 'used', 'expired', 'revoked');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'alert');
CREATE TYPE maintenance_type AS ENUM ('maintenance', 'repair', 'part_replacement', 'inspection');
CREATE TYPE revision_status AS ENUM ('scheduled', 'completed', 'overdue', 'cancelled');
CREATE TYPE revision_type AS ENUM ('annual', 'repair', 'maintenance');
CREATE TYPE checklist_category AS ENUM ('documents', 'vehicle', 'accessories', 'final');

-- =====================================================
-- TABELA: users (Usuários)
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    role user_role NOT NULL DEFAULT 'client',
    vip_level vip_level DEFAULT 'standard',
    password_hash TEXT,
    requires_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- TABELA: vehicles (Veículos)
-- =====================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    plate VARCHAR(20) UNIQUE NOT NULL,
    blinding_level VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para vehicles
CREATE INDEX idx_vehicles_plate ON vehicles(plate);

-- =====================================================
-- TABELA: vehicle_images (Imagens dos Veículos)
-- =====================================================

CREATE TABLE vehicle_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: projects (Projetos)
-- =====================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status project_status NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE NOT NULL,
    estimated_delivery DATE NOT NULL,
    actual_delivery DATE,
    qr_code TEXT,
    vehicle_received_date TIMESTAMPTZ,
    process_start_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    registration_qr_code TEXT,
    permanent_qr_code TEXT,
    invite_token VARCHAR(100),
    invite_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para projects
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_vehicle_id ON projects(vehicle_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_invite_token ON projects(invite_token);

-- =====================================================
-- TABELA: timeline_steps (Etapas da Timeline)
-- =====================================================

CREATE TABLE timeline_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status step_status NOT NULL DEFAULT 'pending',
    date TIMESTAMPTZ,
    estimated_date TIMESTAMPTZ,
    technician VARCHAR(255),
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para timeline_steps
CREATE INDEX idx_timeline_steps_project_id ON timeline_steps(project_id);
CREATE INDEX idx_timeline_steps_status ON timeline_steps(status);

-- =====================================================
-- TABELA: step_photos (Fotos das Etapas)
-- =====================================================

CREATE TABLE step_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES timeline_steps(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: blinding_specs (Especificações de Blindagem)
-- =====================================================

CREATE TABLE blinding_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    level VARCHAR(50) NOT NULL,
    certification VARCHAR(100) NOT NULL,
    certification_number VARCHAR(100),
    valid_until DATE,
    glass_type VARCHAR(100),
    glass_thickness VARCHAR(50),
    warranty VARCHAR(100),
    technical_responsible VARCHAR(255),
    installation_date DATE,
    total_weight VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: blinding_materials (Materiais de Blindagem)
-- =====================================================

CREATE TABLE blinding_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blinding_spec_id UUID NOT NULL REFERENCES blinding_specs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    thickness VARCHAR(50),
    certification VARCHAR(100),
    area VARCHAR(100)
);

-- =====================================================
-- TABELA: body_protections (Proteções da Carroceria)
-- =====================================================

CREATE TABLE body_protections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blinding_spec_id UUID NOT NULL REFERENCES blinding_specs(id) ON DELETE CASCADE,
    protection_type VARCHAR(255) NOT NULL
);

-- =====================================================
-- TABELA: additional_features (Recursos Adicionais)
-- =====================================================

CREATE TABLE additional_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blinding_spec_id UUID NOT NULL REFERENCES blinding_specs(id) ON DELETE CASCADE,
    feature VARCHAR(255) NOT NULL
);

-- =====================================================
-- TABELA: delivery_schedules (Agendamento de Entrega)
-- =====================================================

CREATE TABLE delivery_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    confirmed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: delivery_checklists (Checklist de Entrega)
-- =====================================================

CREATE TABLE delivery_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    checked BOOLEAN DEFAULT false,
    category checklist_category NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- TABELA: delivery_media (Mídia de Entrega)
-- =====================================================

CREATE TABLE delivery_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    final_video TEXT,
    certificate_url TEXT,
    manual_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: delivery_photos (Fotos de Entrega)
-- =====================================================

CREATE TABLE delivery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_media_id UUID NOT NULL REFERENCES delivery_media(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL
);

-- =====================================================
-- TABELA: elite_cards (Cartões Elite)
-- =====================================================

CREATE TABLE elite_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    card_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    member_since DATE NOT NULL,
    rescue_phone VARCHAR(20),
    support_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: card_benefits (Benefícios do Cartão)
-- =====================================================

CREATE TABLE card_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elite_card_id UUID NOT NULL REFERENCES elite_cards(id) ON DELETE CASCADE,
    benefit VARCHAR(255) NOT NULL
);

-- =====================================================
-- TABELA: support_tickets (Tickets de Suporte)
-- =====================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'open',
    priority ticket_priority NOT NULL DEFAULT 'medium',
    category ticket_category NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para support_tickets
CREATE INDEX idx_support_tickets_project_id ON support_tickets(project_id);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- =====================================================
-- TABELA: ticket_messages (Mensagens de Tickets)
-- =====================================================

CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'support')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: ticket_attachments (Anexos de Mensagens)
-- =====================================================

CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
    attachment_url TEXT NOT NULL
);

-- =====================================================
-- TABELA: notifications (Notificações)
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- =====================================================
-- TABELA: chat_conversations (Conversas)
-- =====================================================

CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: conversation_participants (Participantes)
-- =====================================================

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(conversation_id, user_id)
);

-- =====================================================
-- TABELA: chat_messages (Mensagens de Chat)
-- =====================================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para chat_messages
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);

-- =====================================================
-- TABELA: registration_invites (Convites de Cadastro)
-- =====================================================

CREATE TABLE registration_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(100) UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_info TEXT,
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255),
    owner_phone VARCHAR(20),
    status invite_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    notes TEXT
);

-- Índices para registration_invites
CREATE INDEX idx_registration_invites_token ON registration_invites(token);
CREATE INDEX idx_registration_invites_status ON registration_invites(status);

-- =====================================================
-- TABELA: vehicle_owners (Proprietários de Veículos)
-- =====================================================

CREATE TABLE vehicle_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    phone VARCHAR(20),
    email VARCHAR(255),
    ownership_start DATE NOT NULL,
    ownership_end DATE,
    is_current BOOLEAN DEFAULT true
);

-- Índices para vehicle_owners
CREATE INDEX idx_vehicle_owners_project_id ON vehicle_owners(project_id);
CREATE INDEX idx_vehicle_owners_is_current ON vehicle_owners(is_current);

-- =====================================================
-- TABELA: maintenance_services (Serviços de Manutenção)
-- =====================================================

CREATE TABLE maintenance_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type maintenance_type NOT NULL,
    description TEXT NOT NULL,
    technician VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2),
    warranty_service BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para maintenance_services
CREATE INDEX idx_maintenance_services_project_id ON maintenance_services(project_id);

-- =====================================================
-- TABELA: replaced_parts (Peças Substituídas)
-- =====================================================

CREATE TABLE replaced_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_service_id UUID NOT NULL REFERENCES maintenance_services(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    reason TEXT
);

-- =====================================================
-- TABELA: maintenance_photos (Fotos de Manutenção)
-- =====================================================

CREATE TABLE maintenance_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_service_id UUID NOT NULL REFERENCES maintenance_services(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL
);

-- =====================================================
-- TABELA: revision_history (Histórico de Revisões)
-- =====================================================

CREATE TABLE revision_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    status revision_status NOT NULL DEFAULT 'scheduled',
    type revision_type NOT NULL DEFAULT 'annual',
    description TEXT NOT NULL,
    technician VARCHAR(255),
    notes TEXT,
    next_revision_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para revision_history
CREATE INDEX idx_revision_history_project_id ON revision_history(project_id);
CREATE INDEX idx_revision_history_status ON revision_history(status);

-- =====================================================
-- TABELA: revision_photos (Fotos de Revisão)
-- =====================================================

CREATE TABLE revision_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_id UUID NOT NULL REFERENCES revision_history(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL
);

-- =====================================================
-- TABELA: temp_passwords (Senhas Temporárias)
-- =====================================================

CREATE TABLE temp_passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Índices para temp_passwords
CREATE INDEX idx_temp_passwords_email ON temp_passwords(email);
CREATE INDEX idx_temp_passwords_used ON temp_passwords(used);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_steps_updated_at
    BEFORE UPDATE ON timeline_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blinding_specs_updated_at
    BEFORE UPDATE ON blinding_specs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_schedules_updated_at
    BEFORE UPDATE ON delivery_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revision_history_updated_at
    BEFORE UPDATE ON revision_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Executors can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

-- Políticas para projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Executors can view all projects" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

CREATE POLICY "Executors can insert projects" ON projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

CREATE POLICY "Executors can update projects" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

-- Políticas para notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Políticas para support_tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Executors can view all tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE users IS 'Usuários do sistema (clientes, executores, admins)';
COMMENT ON TABLE vehicles IS 'Veículos cadastrados para blindagem';
COMMENT ON TABLE projects IS 'Projetos de blindagem';
COMMENT ON TABLE timeline_steps IS 'Etapas da timeline de cada projeto';
COMMENT ON TABLE blinding_specs IS 'Especificações técnicas da blindagem';
COMMENT ON TABLE support_tickets IS 'Tickets de suporte abertos pelos clientes';
COMMENT ON TABLE notifications IS 'Notificações enviadas aos usuários';
COMMENT ON TABLE chat_messages IS 'Mensagens do chat entre cliente e executor';
COMMENT ON TABLE registration_invites IS 'Convites de cadastro gerados pelo executor';
COMMENT ON TABLE temp_passwords IS 'Senhas temporárias para primeiro acesso';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
