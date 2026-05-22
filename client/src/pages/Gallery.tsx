import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Copy, Trash2, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { useState } from "react";
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
  const { user, isAuthenticated } = useAuth();
  const { data: images, isLoading, error, refetch } = trpc.images.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const deleteMutation = trpc.images.delete.useMutation();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription>Faça login para visualizar sua galeria</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">
            Minha Galeria
          </h1>
          <p className="text-lg text-slate-600">
            Gerencie suas imagens e obtenha links públicos
          </p>
        </div>

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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : !images || images.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-slate-900 mb-1">
                    Nenhuma imagem ainda
                  </p>
                  <p className="text-sm text-slate-600">
                    Comece fazendo upload de uma imagem
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <div className="aspect-square bg-slate-100 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="pt-4 pb-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Nome do arquivo:</p>
                      <p className="text-sm text-slate-900 truncate font-medium">
                        {image.fileName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Link público:</p>
                      <div className="flex items-center gap-1 bg-slate-50 p-2 rounded border border-slate-200">
                        <code className="flex-1 text-xs text-slate-700 break-all font-mono truncate">
                          {image.url}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyLink(image.url)}
                          className="flex-shrink-0 h-6 w-6 p-0"
                          title="Copiar link"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Data:</p>
                      <p className="text-xs text-slate-600">
                        {new Date(image.createdAt).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(image.url)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(image.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Imagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
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
