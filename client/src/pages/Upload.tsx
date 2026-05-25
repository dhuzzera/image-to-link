import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Copy, CheckCircle2, Loader2, Upload, AlertCircle, ArrowLeft, ArrowRight, X, ImageIcon } from "lucide-react";

interface UploadedFile {
  url: string;
  fileName: string;
}

interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

export default function UploadPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" não é um tipo de imagem válido`;
    }
    if (file.size > MAX_SIZE) {
      return `"${file.name}" excede o limite de 50MB`;
    }
    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const newPreviews: FilePreview[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        return;
      }
      newPreviews.push({
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });
    });

    if (errors.length > 0) {
      setError(errors.join(". "));
      toast.error(errors[0]);
    }

    if (newPreviews.length > 0) {
      setFilePreviews((prev) => [...prev, ...newPreviews]);
      setError(null);
    }
  }, []);

  const removePreview = (id: string) => {
    setFilePreviews((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

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
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFiles = async () => {
    if (filePreviews.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    const results: UploadedFile[] = [];

    for (let i = 0; i < filePreviews.length; i++) {
      setCurrentUploadIndex(i);
      setUploadProgress(Math.round((i / filePreviews.length) * 100));

      const { file } = filePreviews[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao fazer upload");
        }

        const result = await response.json();
        results.push({ url: result.url, fileName: file.name });
      } catch (err: any) {
        const errorMessage = err?.message || `Falha ao enviar "${file.name}"`;
        toast.error(errorMessage);
      }
    }

    setUploadProgress(100);

    // Cleanup previews
    filePreviews.forEach((p) => URL.revokeObjectURL(p.preview));
    setFilePreviews([]);

    if (results.length > 0) {
      setUploadedImages(results);
      toast.success(
        results.length === 1
          ? "Imagem enviada com sucesso!"
          : `${results.length} imagens enviadas com sucesso!`
      );
    }

    setIsUploading(false);
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Falha ao copiar link");
    }
  };

  const copyAllLinks = async () => {
    try {
      const links = uploadedImages.map((img) => img.url).join("\n");
      await navigator.clipboard.writeText(links);
      toast.success("Todos os links copiados!");
    } catch {
      toast.error("Falha ao copiar links");
    }
  };

  const resetUpload = () => {
    setUploadedImages([]);
    setError(null);
    setUploadProgress(0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Buttons */}
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
            onClick={() => navigate("/gallery")}
            variant="outline"
            className="flex items-center gap-2"
          >
            Ir para Galeria
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">
            Enviar Imagens
          </h1>
          <p className="text-lg text-slate-600">
            Faça upload de suas imagens e obtenha links públicos
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

        {uploadedImages.length === 0 ? (
          <>
            {/* Drop Zone */}
            <Card className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors mb-6">
              <CardContent className="pt-8 pb-8">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-4 p-8 rounded-lg transition-colors cursor-pointer ${
                    isDragging ? "bg-slate-100 border-slate-400" : "bg-slate-50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100">
                    <Upload className="w-8 h-8 text-slate-600" />
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-medium text-slate-900 mb-1">
                      Arraste suas imagens aqui
                    </p>
                    <p className="text-sm text-slate-600">ou clique para selecionar</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  <p className="text-xs text-slate-500 mt-2">
                    Máximo 50MB por arquivo • PNG, JPG, GIF, WebP, SVG • Múltiplos arquivos
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* File Previews */}
            {filePreviews.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    {filePreviews.length} {filePreviews.length === 1 ? "arquivo selecionado" : "arquivos selecionados"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    {filePreviews.map((item) => (
                      <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePreview(item.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remover ${item.file.name}`}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                          <p className="text-xs text-white truncate">{item.file.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Enviando {currentUploadIndex + 1} de {filePreviews.length}...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={uploadFiles}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Enviar {filePreviews.length === 1 ? "Imagem" : `${filePreviews.length} Imagens`}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        filePreviews.forEach((p) => URL.revokeObjectURL(p.preview));
                        setFilePreviews([]);
                      }}
                      variant="outline"
                      disabled={isUploading}
                    >
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Success State */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {uploadedImages.length === 1
                  ? "Imagem Enviada com Sucesso"
                  : `${uploadedImages.length} Imagens Enviadas com Sucesso`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadedImages.map((img, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{img.fileName}</p>
                    <code className="text-xs text-slate-600 font-mono break-all">
                      {img.url}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(img.url)}
                    className="flex-shrink-0"
                    aria-label="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="pt-4 flex gap-3">
                {uploadedImages.length > 1 && (
                  <Button onClick={copyAllLinks} variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Todos os Links
                  </Button>
                )}
                <Button onClick={resetUpload} variant="outline" className="flex-1">
                  Enviar Mais Imagens
                </Button>
                <Button onClick={() => navigate("/gallery")} className="flex-1">
                  Ver Galeria
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
