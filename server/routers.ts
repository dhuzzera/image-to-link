import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createImage, deleteImage, getImageById, getUserImages } from "./db";
import { storagePut, storageDelete } from "./storage";
import { TRPCError } from "@trpc/server";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
        if (!ALLOWED_IMAGE_TYPES.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tipo de arquivo não permitido.",
          });
        }

        try {
          const buffer = Buffer.from(input.file, "base64");

          if (buffer.length > MAX_FILE_SIZE) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Arquivo muito grande. Máximo 50MB.",
            });
          }

          const fileKey = `images/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const { key, url } = await storagePut(fileKey, buffer, input.mimeType);

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
          if (error instanceof TRPCError) throw error;
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
          const image = await getImageById(input.imageId, ctx.user.id);
          if (!image) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Imagem não encontrada" });
          }

          await storageDelete(image.fileKey);
          await deleteImage(input.imageId, ctx.user.id);

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
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
