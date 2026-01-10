import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 Criando laudo EliteShield™ de teste...\n');

async function createTestReport() {
  try {
    // 1. Buscar um projeto existente
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectError || !projects || projects.length === 0) {
      console.log('❌ Nenhum projeto encontrado');
      return;
    }
    
    const project = projects[0];
    console.log('✅ Projeto selecionado: ' + project.id);
    console.log('   QR Code: ' + project.qr_code);
    console.log('');
    
    // 2. Buscar linhas de blindagem
    const { data: blindingLines } = await supabase
      .from('blinding_lines')
      .select('*')
      .limit(1);
    
    const blindingLine = blindingLines?.[0];
    console.log('✅ Linha de blindagem: ' + (blindingLine?.display_name || 'N/A'));
    console.log('');
    
    // 3. Buscar specs de vidro
    const { data: glassSpecs } = await supabase
      .from('glass_specs')
      .select('*')
      .limit(1);
    
    const glassSpec = glassSpecs?.[0];
    console.log('✅ Especificação de vidro: ' + (glassSpec?.manufacturer || 'N/A') + ' ' + (glassSpec?.model || ''));
    console.log('');
    
    // 4. Buscar material opaco
    const { data: opaqueMaterials } = await supabase
      .from('opaque_materials')
      .select('*')
      .limit(1);
    
    const opaqueMaterial = opaqueMaterials?.[0];
    console.log('✅ Material opaco: ' + (opaqueMaterial?.name || 'N/A'));
    console.log('');
    
    // 5. Buscar responsável técnico
    const { data: technicalResponsibles } = await supabase
      .from('technical_responsibles')
      .select('*')
      .limit(1);
    
    const technicalResponsible = technicalResponsibles?.[0];
    console.log('✅ Responsável técnico: ' + (technicalResponsible?.name || 'N/A'));
    console.log('');
    
    // 6. Criar o laudo
    const testReport = {
      project_id: project.id,
      user_id: project.user_id,
      status: 'draft',
      version: 1,
      
      vehicle_brand: 'Mercedes-Benz',
      vehicle_model: 'Classe S',
      vehicle_year: 2024,
      vehicle_color: 'Preto',
      vehicle_plate: 'ABC-1234',
      vehicle_chassis: '9BWZZZ377VT004251',
      vehicle_km_checkin: 1500,
      vehicle_type: 'Sedan',
      
      client_name: 'João Teste',
      client_document: '123.456.789-00',
      client_phone: '(11) 97777-7777',
      client_email: 'joao@teste.com',
      client_city: 'São Paulo',
      client_state: 'SP',
      
      blinding_line_id: blindingLine?.id,
      protection_level: 'NIJ III-A',
      usage_type: 'Executivo',
      
      glass_spec_id: glassSpec?.id,
      glass_thickness_mm: 21,
      glass_warranty_years: 10,
      
      opaque_material_id: opaqueMaterial?.id,
      aramid_layers: 9,
      
      protected_areas: JSON.stringify([
        'Portas dianteiras', 'Portas traseiras', 'Vidros laterais', 
        'Para-brisa', 'Vidro traseiro', 'Assoalho'
      ]),
      
      tests_checklist: JSON.stringify({
        'Teste de estanqueidade': true,
        'Teste de vidros': true,
        'Teste de fechamento': true,
        'Teste de elétrica': true,
        'Teste final': true
      }),
      tests_approved: true,
      tests_date: new Date().toISOString().split('T')[0],
      tests_technician: 'Carlos Silva',
      
      technical_responsible_id: technicalResponsible?.id,
      
      warranties: JSON.stringify([
        { component: 'Vidros', duration_months: 120, description: '10 anos de garantia' },
        { component: 'Opacos', duration_months: 60, description: '5 anos de garantia' },
        { component: 'Acabamento', duration_months: 12, description: '1 ano de garantia' }
      ]),
      
      qr_code_url: 'https://elite-track.vercel.app/verify/' + project.id,
      
      technical_observations: 'Blindagem executada conforme especificações técnicas. Todos os testes aprovados.',
      recommendations: 'Realizar manutenção preventiva a cada 12 meses.',
      
      final_declaration: 'Declaramos que o veículo foi blindado conforme as normas vigentes e está apto para uso.',
      declaration_accepted: true,
      declaration_date: new Date().toISOString(),
      
      issue_date: new Date().toISOString().split('T')[0],
      document_version: '1.0',
      
      created_by: 'executor-prod-001'
    };
    
    console.log('📝 Criando laudo no Supabase...\n');
    
    const { data: report, error: reportError } = await supabase
      .from('eliteshield_reports')
      .insert([testReport])
      .select();
    
    if (reportError) {
      console.log('❌ Erro ao criar laudo: ' + reportError.message);
      return;
    }
    
    console.log('✅ LAUDO CRIADO COM SUCESSO!\n');
    console.log('ID do Laudo: ' + report[0].id);
    console.log('Token EliteTrace™: ' + report[0].trace_token);
    console.log('Status: ' + report[0].status);
    console.log('Versão: ' + report[0].version);
    console.log('');
    
    // 7. Criar etapas de execução
    console.log('📝 Criando etapas de execução...\n');
    
    const steps = [
      { step_number: 1, step_name: 'Check-in do Veículo', status: 'completed' },
      { step_number: 2, step_name: 'Desmontagem', status: 'completed' },
      { step_number: 3, step_name: 'Instalação de Vidros', status: 'completed' },
      { step_number: 4, step_name: 'Instalação de Opacos', status: 'completed' },
      { step_number: 5, step_name: 'Montagem', status: 'completed' },
      { step_number: 6, step_name: 'Acabamento', status: 'completed' },
      { step_number: 7, step_name: 'Testes Finais', status: 'completed' },
      { step_number: 8, step_name: 'Liberação', status: 'pending' }
    ];
    
    const stepsWithReportId = steps.map(step => ({
      ...step,
      report_id: report[0].id,
      completed_by: step.status === 'completed' ? 'Carlos Silva' : null,
      completed_at: step.status === 'completed' ? new Date().toISOString() : null
    }));
    
    const { error: stepsError } = await supabase
      .from('eliteshield_execution_steps')
      .insert(stepsWithReportId);
    
    if (stepsError) {
      console.log('❌ Erro ao criar etapas: ' + stepsError.message);
    } else {
      console.log('✅ 8 etapas de execução criadas\n');
    }
    
    // 8. Resumo final
    console.log('='.repeat(70));
    console.log('\n📊 RESUMO DO LAUDO CRIADO\n');
    console.log('Projeto: ' + project.id);
    console.log('QR Code Projeto: ' + project.qr_code);
    console.log('Token EliteTrace™: ' + report[0].trace_token);
    console.log('');
    console.log('Veículo: ' + testReport.vehicle_brand + ' ' + testReport.vehicle_model + ' ' + testReport.vehicle_year);
    console.log('Placa: ' + testReport.vehicle_plate);
    console.log('');
    console.log('Cliente: ' + testReport.client_name);
    console.log('CPF: ' + testReport.client_document);
    console.log('');
    console.log('Nível de Proteção: ' + testReport.protection_level);
    console.log('Linha: ' + (blindingLine?.display_name || 'N/A'));
    console.log('');
    console.log('Status: ' + report[0].status);
    console.log('Etapas concluídas: 7/8');
    console.log('');
    console.log('='.repeat(70));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createTestReport().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
