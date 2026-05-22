import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createImage, deleteImage, getImageById, getUserImages } from "./db";
import { storagePut, storageDelete } from "./storage";
import { TRPCError } from "@trpc/server";

// Validação de tipos MIME de imagem permitidos
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  images: router({
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(50).default(12),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 12;
        const search = input?.search;
        return getUserImages(ctx.user.id, { page, pageSize, search });
      }),

    upload: protectedProcedure
      .input(
        z.object({
          file: z.string(), // base64 encoded file
          fileName: z.string().min(1).max(255),
          mimeType: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validar tipo MIME
        if (!ALLOWED_IMAGE_TYPES.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tipo de arquivo não permitido. Use JPEG, PNG, GIF, WebP ou SVG.",
          });
        }

        try {
          // Decodificar base64 para buffer
          const buffer = Buffer.from(input.file, "base64");

          // Validar tamanho do arquivo
          if (buffer.length > MAX_FILE_SIZE) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Arquivo muito grande. Máximo 50MB.",
            });
          }

          const fileKey = `images/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const { key, url } = await storagePut(fileKey, buffer, input.mimeType);

          // Store the permanent proxy URL (not a signed URL that expires)
          await createImage({
            userId: ctx.user.id,
            fileKey: key,
            url,
            fileName: input.fileName,
            mimeType: input.mimeType,
            fileSize: buffer.length,
          });

          return { url, fileKey: key };
        } catch (error) {
          console.error("[Images] Upload failed:", error);
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao fazer upload da imagem",
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Get image info first to delete from storage
          const image = await getImageById(input.imageId, ctx.user.id);
          if (!image) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Imagem não encontrada",
            });
          }

          // Delete from storage (S3)
          await storageDelete(image.fileKey);

          // Delete from database
          const deleted = await deleteImage(input.imageId, ctx.user.id);
          if (!deleted) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Imagem não encontrada",
            });
          }
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error("[Images] Delete failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao deletar imagem",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
