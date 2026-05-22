import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, CheckCircle2, Loader2, Upload, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const { user, isAuthenticated } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; fileName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploadedImage(null);

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido");
      toast.error("Arquivo inválido");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 50MB");
      toast.error("Arquivo muito grande");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", String(user?.id));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao fazer upload da imagem");
      }

      const result = await response.json();

      setUploadedImage({
        url: result.url,
        fileName: file.name,
      });

      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      const errorMessage = error?.message || "Falha ao fazer upload da imagem";
      setError(errorMessage);
      console.error("Upload error:", error);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!uploadedImage) return;
    try {
      await navigator.clipboard.writeText(uploadedImage.url);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      toast.error("Falha ao copiar link");
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription>Faça login para fazer upload de imagens</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">
            Enviar Imagem
          </h1>
          <p className="text-lg text-slate-600">
            Faça upload de sua imagem e obtenha um link público
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-4 pb-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {!uploadedImage ? (
          <Card className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
            <CardContent className="pt-12 pb-12">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-6 p-8 rounded-lg transition-colors ${
                  isDragging ? "bg-slate-100" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100">
                  <Upload className="w-8 h-8 text-slate-600" />
                </div>

                <div className="text-center">
                  <p className="text-lg font-medium text-slate-900 mb-1">
                    Arraste sua imagem aqui
                  </p>
                  <p className="text-sm text-slate-600">ou clique para selecionar</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mt-4"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Selecionar Arquivo"
                  )}
                </Button>

                <p className="text-xs text-slate-500 mt-4">
                  Máximo 50MB • PNG, JPG, GIF, WebP, SVG
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Imagem Enviada com Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600">Nome do arquivo:</p>
                <p className="text-slate-900 font-medium">{uploadedImage.fileName}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-600">Link público:</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <code className="flex-1 text-sm text-slate-700 break-all font-mono">
                      {uploadedImage.url}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToClipboard}
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Clique no ícone de cópia ou selecione e copie manualmente
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button onClick={resetUpload} variant="outline" className="flex-1">
                  Enviar Outra Imagem
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
