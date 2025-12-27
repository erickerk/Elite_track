import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Trash2, Shield, Box, Car, Wrench, Scale, 
  CheckCircle, Save, X
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import type { BlindingSpecs, BlindingMaterial } from '../../types'

interface BlindingSpecsFormProps {
  initialData?: BlindingSpecs
  onSave: (specs: BlindingSpecs) => void
  onCancel: () => void
  projectId: string
  vehicleInfo: string
}

const defaultMaterial: BlindingMaterial = {
  name: '',
  type: '',
  thickness: '',
  certification: '',
  area: '',
}

const materialTypes = [
  'Proteção Balística',
  'Reforço Estrutural',
  'Proteção Transparente',
  'Absorção de Impacto',
  'Isolamento Térmico',
]

const certificationOptions = [
  'NIJ 0108.01',
  'NIJ Level IIIA',
  'NIJ Level III',
  'EN 1063',
  'EN 1063 BR4',
  'EN 1063 BR5',
  'ABNT NBR 15000',
]

const protectionAreas = [
  'Portas dianteiras e traseiras',
  'Colunas A, B e C',
  'Teto completo',
  'Assoalho reforçado',
  'Firewall blindado',
  'Tanque de combustível protegido',
  'Bateria com proteção balística',
  'Porta-malas',
  'Capô',
]

const additionalFeaturesOptions = [
  'Sistema de run-flat nos pneus',
  'Sirene e giroflex ocultos',
  'Sistema de comunicação de emergência',
  'Extintor de incêndio automático',
  'Fechaduras elétricas reforçadas',
  'Vidros com acionamento elétrico reforçado',
  'GPS rastreador oculto',
  'Botão de pânico',
  'Intercomunicador interno/externo',
]

export function BlindingSpecsForm({ 
  initialData, 
  onSave, 
  onCancel, 
  projectId,
  vehicleInfo 
}: BlindingSpecsFormProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [specs, setSpecs] = useState<BlindingSpecs>(initialData || {
    level: 'Nível III-A',
    certification: 'ABNT NBR 15000',
    certificationNumber: `CERT-${new Date().getFullYear()}-${projectId.split('-').pop()}-ELITE`,
    validUntil: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    materials: [{ ...defaultMaterial }],
    glassType: '',
    glassThickness: '',
    bodyProtection: [],
    additionalFeatures: [],
    warranty: '5 anos de garantia contra defeitos de fabricação',
    technicalResponsible: '',
    installationDate: new Date().toISOString().split('T')[0],
    totalWeight: '',
  })

  const [activeSection, setActiveSection] = useState<string>('basic')

  const updateSpec = <K extends keyof BlindingSpecs>(key: K, value: BlindingSpecs[K]) => {
    setSpecs(prev => ({ ...prev, [key]: value }))
  }

  const addMaterial = () => {
    setSpecs(prev => ({
      ...prev,
      materials: [...prev.materials, { ...defaultMaterial }]
    }))
  }

  const removeMaterial = (index: number) => {
    setSpecs(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }))
  }

  const updateMaterial = (index: number, field: keyof BlindingMaterial, value: string) => {
    setSpecs(prev => ({
      ...prev,
      materials: prev.materials.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }))
  }

  const toggleBodyProtection = (area: string) => {
    setSpecs(prev => ({
      ...prev,
      bodyProtection: prev.bodyProtection.includes(area)
        ? prev.bodyProtection.filter(a => a !== area)
        : [...prev.bodyProtection, area]
    }))
  }

  const toggleAdditionalFeature = (feature: string) => {
    setSpecs(prev => ({
      ...prev,
      additionalFeatures: prev.additionalFeatures?.includes(feature)
        ? prev.additionalFeatures.filter(f => f !== feature)
        : [...(prev.additionalFeatures || []), feature]
    }))
  }

  const handleSave = () => {
    onSave(specs)
  }

  const sections = [
    { id: 'basic', label: 'Básico', icon: Shield },
    { id: 'materials', label: 'Materiais', icon: Box },
    { id: 'protection', label: 'Proteção', icon: Car },
    { id: 'extras', label: 'Extras', icon: Wrench },
    { id: 'warranty', label: 'Garantia', icon: Scale },
  ]

  return (
    <div className="space-y-6">
      <div className={cn(
        'p-4 rounded-xl border',
        isDark ? 'bg-gold/10 border-gold/30' : 'bg-gold/5 border-gold/20'
      )}>
        <p className="text-caption text-gray-400">Finalizando projeto</p>
        <p className="font-semibold text-gold">{vehicleInfo}</p>
        <p className="text-micro text-gray-500">ID: {projectId}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap',
              activeSection === section.id
                ? 'bg-gold text-carbon-900'
                : isDark
                ? 'bg-carbon-700 text-gray-300 hover:bg-carbon-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'basic' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-medium mb-2">Nível de Proteção</label>
              <select
                value={specs.level}
                onChange={(e) => updateSpec('level', e.target.value)}
                className={cn(
                  'w-full rounded-xl px-4 py-3 border outline-none',
                  isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
                )}
                title="Nível de Proteção"
                aria-label="Nível de Proteção"
              >
                <option>Nível I</option>
                <option>Nível II</option>
                <option>Nível II-A</option>
                <option>Nível III-A</option>
                <option>Nível III</option>
                <option>Nível IV</option>
              </select>
            </div>
            
            <div>
              <label className="block text-caption font-medium mb-2">Certificação</label>
              <select
                value={specs.certification}
                onChange={(e) => updateSpec('certification', e.target.value)}
                className={cn(
                  'w-full rounded-xl px-4 py-3 border outline-none',
                  isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
                )}
                title="Certificação"
                aria-label="Certificação"
              >
                {certificationOptions.map(cert => (
                  <option key={cert}>{cert}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            placeholder="Número do Certificado"
            value={specs.certificationNumber || ''}
            onChange={(e) => updateSpec('certificationNumber', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-medium mb-2">Data de Instalação</label>
              <input
                type="date"
                value={specs.installationDate || ''}
                onChange={(e) => updateSpec('installationDate', e.target.value)}
                className={cn(
                  'w-full rounded-xl px-4 py-3 border outline-none',
                  isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
                )}
                title="Data de Instalação"
                aria-label="Data de Instalação"
                placeholder="Selecione a data"
              />
            </div>
            
            <div>
              <label className="block text-caption font-medium mb-2">Válido até</label>
              <input
                type="date"
                value={specs.validUntil || ''}
                onChange={(e) => updateSpec('validUntil', e.target.value)}
                className={cn(
                  'w-full rounded-xl px-4 py-3 border outline-none',
                  isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
                )}
                title="Válido até"
                aria-label="Válido até"
                placeholder="Selecione a data"
              />
            </div>
          </div>

          <Input
            placeholder="Peso adicional (ex: +280kg)"
            value={specs.totalWeight || ''}
            onChange={(e) => updateSpec('totalWeight', e.target.value)}
          />
        </motion.div>
      )}

      {activeSection === 'materials' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {specs.materials.map((material, index) => (
            <Card key={index} variant="bordered" className="relative">
              <button
                type="button"
                onClick={() => removeMaterial(index)}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-status-error/20 text-status-error"
                aria-label={`Remover material ${index + 1}`}
                title={`Remover material ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="gold" size="sm">Material {index + 1}</Badge>
                </div>
                
                <Input
                  placeholder="Nome do material (ex: Manta Aramida Kevlar)"
                  value={material.name}
                  onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={material.type}
                    onChange={(e) => updateMaterial(index, 'type', e.target.value)}
                    className={cn(
                      'w-full rounded-xl px-4 py-3 border outline-none text-sm',
                      isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
                    )}
                    title="Tipo de material"
                    aria-label="Tipo de material"
                  >
                    <option value="">Tipo de material</option>
                    {materialTypes.map(type => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  
                  <Input
                    placeholder="Espessura (ex: 12mm)"
                    value={material.thickness || ''}
                    onChange={(e) => updateMaterial(index, 'thickness', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={material.certification || ''}
                    onChange={(e) => updateMaterial(index, 'certification', e.target.value)}
                    className={cn(
                      'w-full rounded-xl px-4 py-3 border outline-none text-sm',
                      isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
                    )}
                    title="Certificação do material"
                    aria-label="Certificação do material"
                  >
                    <option value="">Certificação</option>
                    {certificationOptions.map(cert => (
                      <option key={cert}>{cert}</option>
                    ))}
                  </select>
                  
                  <Input
                    placeholder="Área aplicada"
                    value={material.area || ''}
                    onChange={(e) => updateMaterial(index, 'area', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          ))}
          
          <Button variant="outline" className="w-full" onClick={addMaterial}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Material
          </Button>
        </motion.div>
      )}

      {activeSection === 'protection' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-caption font-medium mb-2">Tipo de Vidro</label>
            <Input
              placeholder="Ex: Vidro Laminado Multilayer com Policarbonato"
              value={specs.glassType}
              onChange={(e) => updateSpec('glassType', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-caption font-medium mb-2">Espessura dos Vidros</label>
            <Input
              placeholder="Ex: 42mm (para-brisa) / 38mm (laterais)"
              value={specs.glassThickness}
              onChange={(e) => updateSpec('glassThickness', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-caption font-medium mb-3">Áreas Protegidas</label>
            <div className="grid grid-cols-1 gap-2">
              {protectionAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleBodyProtection(area)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    specs.bodyProtection.includes(area)
                      ? 'bg-status-success/10 border-status-success/30'
                      : isDark
                      ? 'bg-carbon-800 border-carbon-700 hover:border-gold/30'
                      : 'bg-white border-gray-200 hover:border-gold/30'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-md flex items-center justify-center',
                    specs.bodyProtection.includes(area)
                      ? 'bg-status-success text-white'
                      : isDark ? 'bg-carbon-700' : 'bg-gray-200'
                  )}>
                    {specs.bodyProtection.includes(area) && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-sm">{area}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'extras' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <label className="block text-caption font-medium mb-3">Recursos Adicionais</label>
          <div className="grid grid-cols-1 gap-2">
            {additionalFeaturesOptions.map((feature) => (
              <button
                key={feature}
                onClick={() => toggleAdditionalFeature(feature)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  specs.additionalFeatures?.includes(feature)
                    ? 'bg-gold/10 border-gold/30'
                    : isDark
                    ? 'bg-carbon-800 border-carbon-700 hover:border-gold/30'
                    : 'bg-white border-gray-200 hover:border-gold/30'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center',
                  specs.additionalFeatures?.includes(feature)
                    ? 'bg-gold text-carbon-900'
                    : isDark ? 'bg-carbon-700' : 'bg-gray-200'
                )}>
                  {specs.additionalFeatures?.includes(feature) && (
                    <CheckCircle className="w-3 h-3" />
                  )}
                </div>
                <span className="text-sm">{feature}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {activeSection === 'warranty' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-caption font-medium mb-2">Garantia</label>
            <textarea
              value={specs.warranty}
              onChange={(e) => updateSpec('warranty', e.target.value)}
              placeholder="Descreva os termos de garantia..."
              rows={3}
              className={cn(
                'w-full rounded-xl px-4 py-3 border outline-none resize-none',
                isDark 
                  ? 'bg-carbon-800 border-carbon-700 text-white placeholder:text-gray-500' 
                  : 'bg-white border-gray-300 placeholder:text-gray-400'
              )}
            />
          </div>
          
          <Input
            placeholder="Responsável Técnico (ex: Eng. Carlos Silva - CREA 123456/SP)"
            value={specs.technicalResponsible || ''}
            onChange={(e) => updateSpec('technicalResponsible', e.target.value)}
          />
        </motion.div>
      )}

      <div className="flex gap-3 pt-4 border-t border-carbon-700">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar e Finalizar
        </Button>
      </div>
    </div>
  )
}
