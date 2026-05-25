import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Copy, Trash2, Loader2, ImageIcon, AlertCircle, ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GalleryPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = trpc.images.list.useQuery(
    { page, pageSize: 12, search: search || undefined },
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.images.delete.useMutation();

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Falha ao copiar link");
    }
  };

  const handleDelete = async (imageId: number) => {
    try {
      await deleteMutation.mutateAsync({ imageId });
      toast.success("Imagem deletada com sucesso");
      refetch();
    } catch (error: any) {
      const errorMessage = error?.message || "Falha ao deletar imagem";
      toast.error(errorMessage);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const images = data?.images ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Novo Upload
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">
            Minha Galeria
          </h1>
          <p className="text-lg text-slate-600">
            {total > 0 ? `${total} ${total === 1 ? "imagem" : "imagens"} no seu acervo` : "Gerencie suas imagens e obtenha links públicos"}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome do arquivo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
            {search && (
              <Button type="button" variant="ghost" onClick={clearSearch}>
                Limpar
              </Button>
            )}
          </div>
        </form>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-4 pb-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-medium">Erro ao carregar galeria</p>
                <p className="text-red-600 text-sm">{error.message}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="flex-shrink-0"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : images.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-slate-900 mb-1">
                    {search ? "Nenhuma imagem encontrada" : "Nenhuma imagem ainda"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {search
                      ? `Nenhum resultado para "${search}"`
                      : "Comece fazendo upload de uma imagem"}
                  </p>
                </div>
                {!search && (
                  <Button onClick={() => navigate("/upload")} className="mt-2">
                    Fazer Upload
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    <img
                      src={image.url}
                      alt={image.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Overlay actions on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyLink(image.url)}
                        className="h-8"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteConfirm(image.id)}
                        className="h-8"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm text-slate-900 truncate font-medium" title={image.fileName}>
                      {image.fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(image.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600 px-4">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Imagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita e o arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
