import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Cloud, Lock, Zap, ArrowRight, Upload, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

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
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600 hidden sm:inline">
                  {user?.email || ""}
                </span>
                <Link href="/upload">
                  <Button variant="ghost" className="text-slate-700 gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button variant="default">
                    Minha Galeria
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-slate-500"
                  aria-label="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="default">
                  Entrar
                </Button>
              </Link>
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
                  <Link href="/auth">
                    <Button size="lg" className="gap-2">
                      Começar Agora
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" onClick={scrollToFeatures}>
                    Saiba Mais
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light tracking-tight text-slate-900 mb-3">
                Por que usar o Image to Link?
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Uma plataforma simples e poderosa para hospedar e compartilhar suas imagens com segurança.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100">
                  <Cloud className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Armazenamento Seguro</h3>
                <p className="text-slate-600 leading-relaxed">
                  Suas imagens são armazenadas com segurança em infraestrutura de nuvem confiável com redundância.
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
                  Obtenha links públicos imediatamente após o upload. Suporte a múltiplos arquivos de uma vez.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light tracking-tight text-slate-900 mb-3">
                Como funciona
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto text-lg font-medium">
                  1
                </div>
                <h3 className="font-medium text-slate-900">Faça login</h3>
                <p className="text-sm text-slate-600">Crie sua conta ou entre com seu provedor favorito.</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto text-lg font-medium">
                  2
                </div>
                <h3 className="font-medium text-slate-900">Envie suas imagens</h3>
                <p className="text-sm text-slate-600">Arraste e solte ou selecione múltiplos arquivos de uma vez.</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto text-lg font-medium">
                  3
                </div>
                <h3 className="font-medium text-slate-900">Compartilhe os links</h3>
                <p className="text-sm text-slate-600">Copie os links gerados e use onde quiser.</p>
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
