import { z } from "zod";

export const createAuditSchema = z.object({
  title: z.string().min(5, "Denetim başlığı en az 5 karakter olmalıdır").max(200, "Denetim başlığı en fazla 200 karakter olmalıdır"),
  objective: z.string().min(10, "Denetim amacı belirtilmek zorundadır"),
  scope: z.string().min(10, "Denetim kapsamı detaylı bir şekilde girilmelidir"),
  unitId: z.string().optional(),
  auditableUnitId: z.string().optional(),
  type: z.string().min(1, "Lütfen denetim türünü seçin"),
  startDate: z.string().min(1, "Lütfen başlama tarihini seçin"),
  endDate: z.string().min(1, "Lütfen bitiş tarihini seçin"),
  department: z.string().optional(),
}).refine(data => data.unitId || data.auditableUnitId, {
  message: "Hedef şube veya denetim birimi seçilmesi zorunludur",
  path: ["unitId"]
});

export type CreateAuditValues = z.infer<typeof createAuditSchema>;

export const createFindingSchema = z.object({
  title: z.string().min(5, "Bulgu başlığı çok kısa").max(250, "Bulgu başlığı çok uzun"),
  content: z.string().min(20, "Bulgu detayını daha açık ifade ediniz"),
  criteria: z.string().min(10, "Mevzuata veya politikalara olan aykırılık referansını girin"),
  effect: z.string().min(10, "Bulgunun kurum üzerindeki etkisini belirtin"),
  rootCause: z.string().min(1, "Lütfen bir kök neden seçin"),
  risk: z.string().min(1, "Risk seviyesi seçilmesi zorunludur"),
  inspectorRecommendation: z.string().min(10, "Aksiyon için müfettiş önerisi girmeniz zorunludur"),
});

export type CreateFindingValues = z.infer<typeof createFindingSchema>;
