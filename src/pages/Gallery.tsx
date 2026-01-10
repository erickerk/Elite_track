import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'
import { cn } from '../lib/utils'

interface GalleryImage {
  id: string
  url: string
  step: string
  stepId: string
  date: string
  category: string
}

// Category mapping based on step title
const getCategoryFromStep = (stepTitle: string): string => {
  if (stepTitle.toLowerCase().includes('vidro')) return 'vidros'
  if (stepTitle.toLowerCase().includes('manta')) return 'manta'
  if (stepTitle.toLowerCase().includes('interior') || stepTitle.toLowerCase().includes('desmontagem') || stepTitle.toLowerCase().includes('montagem')) return 'fotos-internas'
  if (stepTitle.toLowerCase().includes('check') || stepTitle.toLowerCase().includes('recebimento')) return 'processo'
  return 'processo'
}

const categoryColors: { [key: string]: { bg: string; text: string; label: string } } = {
  'fotos-internas': { bg: 'bg-blue-600', text: 'text-blue-400', label: 'INTERIOR' },
  'manta': { bg: 'bg-red-600', text: 'text-red-400', label: 'MANTA' },
  'vidros': { bg: 'bg-green-600', text: 'text-green-400', label: 'VIDROS' },
  'processo': { bg: 'bg-yellow-600', text: 'text-yellow-400', label: 'PROCESSO' },
  'videos': { bg: 'bg-purple-600', text: 'text-purple-400', label: 'VÍDEO' },
}

export function Gallery() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const { projects: allProjects } = useProjects()

  const userProjects = allProjects.filter(p => p.user.id === user?.id || p.user.email === user?.email)
  const project = userProjects[0] || allProjects[0]

  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  // Fade in animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Get all images from project timeline
  const allImages: GalleryImage[] = useMemo(() => {
    const images: GalleryImage[] = []
    
    // Add vehicle images
    project.vehicle.images.forEach((url, index) => {
      images.push({
        id: `vehicle-${index}`,
        url,
        step: 'Veículo',
        stepId: 'vehicle',
        date: project.startDate,
        category: 'processo',
      })
    })

    // Add timeline step photos
    project.timeline.forEach((step) => {
      step.photos.forEach((url, index) => {
        images.push({
          id: `${step.id}-${index}`,
          url,
          step: step.title,
          stepId: step.id,
          date: step.date || step.estimatedDate || '',
          category: getCategoryFromStep(step.title),
        })
      })
    })

    return images
  }, [project])

  const filteredImages = useMemo(() => {
    if (selectedFilter === 'all') return allImages
    return allImages.filter((img) => img.category === selectedFilter)
  }, [allImages, selectedFilter])

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {
      'fotos-internas': 0,
      'manta': 0,
      'vidros': 0,
      'processo': 0,
    }
    allImages.forEach(img => {
      if (counts[img.category] !== undefined) {
        counts[img.category]++
      }
    })
    return counts
  }, [allImages])

  const currentImageIndex = selectedImage
    ? filteredImages.findIndex((img) => img.id === selectedImage.id)
    : -1

  const goToNextImage = () => {
    if (currentImageIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentImageIndex + 1])
    }
  }

  const goToPrevImage = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(filteredImages[currentImageIndex - 1])
    }
  }

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter)
  }

  const openMediaModal = (image: GalleryImage) => {
    setSelectedImage(image)
  }

  const closeMediaModal = () => {
    setSelectedImage(null)
  }

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen">
      {/* Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                title="Voltar"
              >
                <i className="ri-arrow-left-line text-white"></i>
              </button>
              <div className="font-['Pacifico'] text-2xl text-primary luxury-glow cursor-pointer" onClick={() => navigate('/dashboard')}>EliteTrack™</div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="md:hidden w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors"
                title="Perfil e Sair"
              >
                <i className="ri-logout-box-line text-red-400"></i>
              </button>
              <button className="flex items-center space-x-2" title="Notificações">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <i className="ri-notification-3-line text-primary text-sm"></i>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-primary text-black text-xs px-2 py-1 rounded-full font-semibold">{unreadCount}</span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-400">{project.vehicle.brand} {project.vehicle.model}</div>
                </div>
                <div 
                  className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <i className="ri-user-line text-black text-sm"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Navigation Tabs */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="glass-effect cinematic-blur rounded-full p-1 inline-flex">
                <button onClick={() => navigate('/timeline')} className="px-6 py-3 rounded-full text-white/60 hover:text-white transition-colors whitespace-nowrap" title="Ver Timeline">Timeline</button>
                <button className="px-6 py-3 rounded-full bg-primary text-black font-semibold whitespace-nowrap" title="Galeria de Mídia">Galeria de Mídia</button>
                <button onClick={() => navigate('/laudo')} className="px-6 py-3 rounded-full text-white/60 hover:text-white transition-colors whitespace-nowrap" title="Ver Documentos">Documentos</button>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full luxury-glow"></div>
                    <span className="text-primary font-semibold text-sm">{allImages.length} Fotos</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg flex items-center space-x-2 text-primary transition-colors whitespace-nowrap" title="Baixar todas as fotos">
                  <i className="ri-download-line text-sm"></i>
                  <span className="text-sm">Baixar</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-3">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-center">
              <div className="flex gap-2 flex-wrap justify-center">
                <button 
                  onClick={() => handleFilterClick('all')}
                  className={cn(
                    "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
                    selectedFilter === 'all' ? "bg-primary text-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  title="Ver todas as fotos"
                >
                  Todas
                </button>
                <button 
                  onClick={() => handleFilterClick('fotos-internas')}
                  className={cn(
                    "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
                    selectedFilter === 'fotos-internas' ? "bg-primary text-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  title="Ver fotos internas"
                >
                  Internas
                </button>
                <button 
                  onClick={() => handleFilterClick('manta')}
                  className={cn(
                    "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
                    selectedFilter === 'manta' ? "bg-primary text-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  title="Ver fotos da manta"
                >
                  Manta
                </button>
                <button 
                  onClick={() => handleFilterClick('vidros')}
                  className={cn(
                    "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
                    selectedFilter === 'vidros' ? "bg-primary text-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  title="Ver fotos dos vidros"
                >
                  Vidros
                </button>
                <button 
                  onClick={() => handleFilterClick('processo')}
                  className={cn(
                    "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
                    selectedFilter === 'processo' ? "bg-primary text-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  title="Ver fotos do processo"
                >
                  Processo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Media Gallery */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glass-effect cinematic-blur rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Galeria de Mídia</h2>
                  <p className="text-gray-400 text-sm">{project.vehicle.brand} {project.vehicle.model} • Processo de Blindagem</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-primary text-sm">Atualizado recentemente</span>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredImages.map((image) => {
                  const categoryInfo = categoryColors[image.category] || categoryColors['processo']
                  return (
                    <div 
                      key={image.id}
                      className="group cursor-pointer"
                      onClick={() => openMediaModal(image)}
                    >
                      <div className="relative">
                        <img 
                          src={image.url} 
                          alt={image.step}
                          className="w-full h-32 object-cover rounded-xl group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2">
                          <div className={cn("text-white px-2 py-1 rounded-full text-xs font-semibold", categoryInfo.bg)}>
                            {categoryInfo.label}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-xl">
                          <div className="text-white font-medium text-xs">{image.step}</div>
                          <div className="text-gray-300 text-xs">
                            {image.date ? new Date(image.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredImages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <i className="ri-image-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-400">Nenhuma foto encontrada nesta categoria</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-400">{categoryCounts['fotos-internas']}</div>
                    <div className="text-xs text-gray-400">Internas</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-400">{categoryCounts['manta']}</div>
                    <div className="text-xs text-gray-400">Manta</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-400">{categoryCounts['vidros']}</div>
                    <div className="text-xs text-gray-400">Vidros</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400">{categoryCounts['processo']}</div>
                    <div className="text-xs text-gray-400">Processo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Media Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-6">
            <div className="glass-effect cinematic-blur p-8 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedImage.step}</h2>
                <div className="flex items-center space-x-4">
                  <button 
                    className="w-12 h-12 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center text-primary transition-colors"
                    title="Baixar imagem"
                  >
                    <i className="ri-download-line text-xl"></i>
                  </button>
                  <button 
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Compartilhar"
                  >
                    <i className="ri-share-line text-xl"></i>
                  </button>
                  <button 
                    onClick={closeMediaModal}
                    className="w-12 h-12 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 transition-colors"
                    title="Fechar"
                  >
                    <i className="ri-close-line text-2xl font-bold"></i>
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full luxury-glow"></div>
                    <span className="text-primary font-semibold">FOTO</span>
                  </div>
                  <span className="text-gray-400">
                    {selectedImage.date ? new Date(selectedImage.date).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                <p className="text-gray-400">Registro fotográfico do processo de blindagem - {selectedImage.step}</p>
              </div>

              <div className="relative">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.step}
                  className="w-full max-h-[60vh] object-contain rounded-2xl cursor-pointer"
                />
                
                {currentImageIndex > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Foto anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                
                {currentImageIndex < filteredImages.length - 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Próxima foto"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-400">Foto {currentImageIndex + 1} de {filteredImages.length}</p>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {filteredImages.slice(0, 10).map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(filteredImages[index])}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      filteredImages[index]?.id === selectedImage.id ? "bg-primary w-6" : "bg-gray-500"
                    )}
                    title={`Ir para foto ${index + 1}`}
                    aria-label={`Ir para foto ${index + 1}`}
                  />
                ))}
                {filteredImages.length > 10 && (
                  <span className="text-gray-400 text-xs ml-2">+{filteredImages.length - 10}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
