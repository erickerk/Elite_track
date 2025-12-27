-- =====================================================
-- ELITE GESTÃO - TABELAS ADICIONAIS
-- Migração: 002_elite_gestao_tables.sql
-- Data: 27/12/2024
-- Descrição: Tabelas para módulos comercial, contratos,
--            financeiro e seminovos
-- =====================================================

-- =====================================================
-- NOVOS ENUM TYPES
-- =====================================================

CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'advertisement', 'cold_call', 'event', 'other');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
CREATE TYPE contract_status AS ENUM ('draft', 'pending_signature', 'active', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'financing', 'check');
CREATE TYPE expense_category AS ENUM ('materials', 'labor', 'equipment', 'utilities', 'rent', 'marketing', 'taxes', 'other');
CREATE TYPE preowned_status AS ENUM ('available', 'reserved', 'sold', 'in_evaluation', 'consignment');
CREATE TYPE vehicle_condition AS ENUM ('excellent', 'good', 'fair', 'needs_repair');

-- =====================================================
-- MÓDULO COMERCIAL - LEADS
-- =====================================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    source lead_source NOT NULL DEFAULT 'other',
    status lead_status NOT NULL DEFAULT 'new',
    interest TEXT,
    vehicle_interest VARCHAR(255),
    blinding_level_interest VARCHAR(50),
    budget_range VARCHAR(100),
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    last_contact TIMESTAMPTZ,
    next_followup TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_source ON leads(source);

-- =====================================================
-- MÓDULO COMERCIAL - TABELA DE PREÇOS
-- =====================================================

CREATE TABLE price_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE NOT NULL,
    valid_until DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_table_id UUID NOT NULL REFERENCES price_tables(id) ON DELETE CASCADE,
    item_type VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2),
    min_quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_price_items_table ON price_items(price_table_id);

-- =====================================================
-- MÓDULO COMERCIAL - PROPOSTAS
-- =====================================================

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_number VARCHAR(50) UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id),
    customer_id UUID REFERENCES users(id),
    status proposal_status NOT NULL DEFAULT 'draft',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vehicle_brand VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    blinding_level VARCHAR(50),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    valid_until DATE,
    payment_conditions TEXT,
    delivery_time VARCHAR(100),
    notes TEXT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_lead ON proposals(lead_id);
CREATE INDEX idx_proposals_customer ON proposals(customer_id);

CREATE TABLE proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- MÓDULO CONTRATOS
-- =====================================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    proposal_id UUID REFERENCES proposals(id),
    project_id UUID REFERENCES projects(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    status contract_status NOT NULL DEFAULT 'draft',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    total_value DECIMAL(12, 2) NOT NULL,
    payment_terms TEXT,
    installments_count INTEGER DEFAULT 1,
    signed_at TIMESTAMPTZ,
    signed_by_customer BOOLEAN DEFAULT false,
    signed_by_company BOOLEAN DEFAULT false,
    customer_signature_url TEXT,
    company_signature_url TEXT,
    contract_pdf_url TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_project ON contracts(project_id);

CREATE TABLE contract_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(12, 2),
    payment_method payment_method,
    notes TEXT
);

CREATE INDEX idx_installments_contract ON contract_installments(contract_id);
CREATE INDEX idx_installments_status ON contract_installments(status);
CREATE INDEX idx_installments_due_date ON contract_installments(due_date);

CREATE TABLE contract_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    file_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO FINANCEIRO - CONTAS BANCÁRIAS
-- =====================================================

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    agency VARCHAR(20),
    account_type VARCHAR(50),
    pix_key VARCHAR(255),
    initial_balance DECIMAL(12, 2) DEFAULT 0,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO FINANCEIRO - CENTROS DE CUSTO
-- =====================================================

CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES cost_centers(id),
    budget DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO FINANCEIRO - RECEITAS (INVOICES)
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    contract_id UUID REFERENCES contracts(id),
    project_id UUID REFERENCES projects(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method,
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(12, 2),
    bank_account_id UUID REFERENCES bank_accounts(id),
    cost_center_id UUID REFERENCES cost_centers(id),
    nf_number VARCHAR(50),
    nf_url TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_project ON invoices(project_id);

-- =====================================================
-- MÓDULO FINANCEIRO - DESPESAS
-- =====================================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    category expense_category NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method,
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(12, 2),
    supplier_name VARCHAR(255),
    supplier_document VARCHAR(20),
    project_id UUID REFERENCES projects(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    cost_center_id UUID REFERENCES cost_centers(id),
    receipt_url TEXT,
    nf_number VARCHAR(50),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);
CREATE INDEX idx_expenses_project ON expenses(project_id);

-- =====================================================
-- MÓDULO FINANCEIRO - MOVIMENTAÇÕES
-- =====================================================

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    target_bank_account_id UUID REFERENCES bank_accounts(id),
    invoice_id UUID REFERENCES invoices(id),
    expense_id UUID REFERENCES expenses(id),
    cost_center_id UUID REFERENCES cost_centers(id),
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_date ON financial_transactions(date);
CREATE INDEX idx_transactions_bank ON financial_transactions(bank_account_id);
CREATE INDEX idx_transactions_type ON financial_transactions(type);

-- =====================================================
-- MÓDULO SEMINOVOS - VEÍCULOS PRÉ-OWNED
-- =====================================================

CREATE TABLE preowned_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    version VARCHAR(100),
    year_manufacture INTEGER NOT NULL,
    year_model INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    plate VARCHAR(20) UNIQUE,
    chassis VARCHAR(50),
    renavam VARCHAR(20),
    mileage INTEGER,
    fuel_type VARCHAR(50),
    transmission VARCHAR(50),
    doors INTEGER,
    blinding_level VARCHAR(50),
    blinding_company VARCHAR(255),
    blinding_date DATE,
    condition vehicle_condition NOT NULL DEFAULT 'good',
    status preowned_status NOT NULL DEFAULT 'available',
    purchase_price DECIMAL(12, 2),
    purchase_date DATE,
    sale_price DECIMAL(12, 2),
    minimum_price DECIMAL(12, 2),
    sold_price DECIMAL(12, 2),
    sold_date DATE,
    sold_to UUID REFERENCES users(id),
    consignment_owner VARCHAR(255),
    consignment_phone VARCHAR(20),
    consignment_commission DECIMAL(5, 2),
    features TEXT[],
    description TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_preowned_status ON preowned_vehicles(status);
CREATE INDEX idx_preowned_brand ON preowned_vehicles(brand);
CREATE INDEX idx_preowned_price ON preowned_vehicles(sale_price);

CREATE TABLE preowned_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES preowned_vehicles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_cover BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE preowned_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES preowned_vehicles(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES users(id),
    evaluation_date DATE NOT NULL,
    exterior_score INTEGER CHECK (exterior_score >= 1 AND exterior_score <= 10),
    interior_score INTEGER CHECK (interior_score >= 1 AND interior_score <= 10),
    mechanical_score INTEGER CHECK (mechanical_score >= 1 AND mechanical_score <= 10),
    blinding_score INTEGER CHECK (blinding_score >= 1 AND blinding_score <= 10),
    overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 10),
    suggested_price DECIMAL(12, 2),
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MÓDULO SEMINOVOS - INTERESSADOS
-- =====================================================

CREATE TABLE preowned_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES preowned_vehicles(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    customer_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    message TEXT,
    contacted BOOLEAN DEFAULT false,
    contacted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_preowned_interests_vehicle ON preowned_interests(vehicle_id);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_tables_updated_at
    BEFORE UPDATE ON price_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preowned_vehicles_updated_at
    BEFORE UPDATE ON preowned_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY - NOVAS TABELAS
-- =====================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE preowned_vehicles ENABLE ROW LEVEL SECURITY;

-- Políticas para leads (apenas admin/executor)
CREATE POLICY "Staff can manage leads" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

-- Políticas para proposals
CREATE POLICY "Staff can manage proposals" ON proposals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

CREATE POLICY "Customers can view own proposals" ON proposals
    FOR SELECT USING (customer_id = auth.uid());

-- Políticas para contracts
CREATE POLICY "Staff can manage contracts" ON contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

CREATE POLICY "Customers can view own contracts" ON contracts
    FOR SELECT USING (customer_id = auth.uid());

-- Políticas para invoices
CREATE POLICY "Staff can manage invoices" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

CREATE POLICY "Customers can view own invoices" ON invoices
    FOR SELECT USING (customer_id = auth.uid());

-- Políticas para expenses (apenas admin)
CREATE POLICY "Admin can manage expenses" ON expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Políticas para preowned_vehicles (público pode ver disponíveis)
CREATE POLICY "Anyone can view available vehicles" ON preowned_vehicles
    FOR SELECT USING (status = 'available');

CREATE POLICY "Staff can manage preowned vehicles" ON preowned_vehicles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('executor', 'admin')
        )
    );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE leads IS 'Leads comerciais para prospecção';
COMMENT ON TABLE proposals IS 'Propostas comerciais enviadas a clientes';
COMMENT ON TABLE contracts IS 'Contratos de serviços de blindagem';
COMMENT ON TABLE invoices IS 'Faturas e contas a receber';
COMMENT ON TABLE expenses IS 'Despesas e contas a pagar';
COMMENT ON TABLE preowned_vehicles IS 'Veículos seminovos blindados para venda';
COMMENT ON TABLE bank_accounts IS 'Contas bancárias da empresa';
COMMENT ON TABLE cost_centers IS 'Centros de custo para controle financeiro';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
