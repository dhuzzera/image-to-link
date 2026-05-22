import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Cloud, Lock, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-light tracking-tight text-slate-900">Image to Link</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/upload">
                  <Button variant="ghost" className="text-slate-700">
                    Upload
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button variant="default">
                    Minha Galeria
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">
                  Entrar
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-1 flex flex-col justify-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-slate-900 mb-6">
              Hospede suas imagens com elegância
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Faça upload de imagens, obtenha links públicos instantâneos e gerencie seu acervo pessoal em uma plataforma sofisticada e intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/upload">
                    <Button size="lg" className="gap-2">
                      Começar Upload
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/gallery">
                    <Button size="lg" variant="outline">
                      Ver Galeria
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="gap-2">
                      Começar Agora
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </a>
                  <a href={getLoginUrl()}>
                    <Button size="lg" variant="outline">
                      Saiba Mais
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100">
                  <Cloud className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Armazenamento Seguro</h3>
                <p className="text-slate-600 leading-relaxed">
                  Suas imagens são armazenadas com segurança em infraestrutura de nuvem confiável.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100">
                  <Lock className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Privacidade Garantida</h3>
                <p className="text-slate-600 leading-relaxed">
                  Você controla quem acessa suas imagens. Cada usuário vê apenas seu próprio acervo.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100">
                  <Zap className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Links Instantâneos</h3>
                <p className="text-slate-600 leading-relaxed">
                  Obtenha links públicos imediatamente após o upload para compartilhar com facilidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-600 text-sm">
            © 2026 Image to Link. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
