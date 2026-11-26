"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditLogs, classes, classPromoCodes, promoModeEnum } from "@/db/schema";
import { parseLocalDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";
import { promoCodeSchema, toFormObject, uuidSchema } from "@/lib/validation";
import { requireAdminSession } from "@/server/auth/session";
import type { AdminActionState } from "@/server/actions/admin";

export async function savePromoModeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const classId = uuidSchema.safeParse(formData.get("classId"));
  const mode = z.enum(promoModeEnum.enumValues).safeParse(formData.get("promoMode"));
  if (!classId.success || !mode.success) return { ok: false, message: "Select a valid promo setting." };

  const updated = await getDb().transaction(async tx => {
    const [activity] = await tx.update(classes).set({ promoMode: mode.data, updatedAt: new Date() }).where(eq(classes.id, classId.data)).returning({ id: classes.id });
    if (!activity) return false;
    await tx.insert(auditLogs).values({ actorUserId: session.user.id, action: "CLASS_PROMO_MODE_UPDATED", entityType: "class", entityId: classId.data, metadata: { mode: mode.data } });
    return true;
  });
  if (!updated) return { ok: false, message: "Class not found." };
  revalidatePath(`/admin/classes/${classId.data}/promos`);
  return { ok: true, message: "Promo settings saved." };
}

const promoFormSchema = z.object({
  classId: uuidSchema,
  id: z.union([uuidSchema, z.literal("")]),
  code: promoCodeSchema,
  discount: z.discriminatedUnion("type", [
    z.object({ type: z.literal("PERCENT"), value: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)) }),
    z.object({ type: z.literal("FIXED"), value: z.string().regex(/^\d{1,6}(?:\.\d{1,2})?$/).transform(value => Math.round(Number(value) * 100)).pipe(z.number().int().min(1).max(10_000_000)) }),
  ]),
  validFrom: z.string(),
  validUntil: z.string(),
  isActive: z.enum(["on"]).optional(),
});

export async function saveClassPromoAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const raw = toFormObject(formData);
  const parsed = promoFormSchema.safeParse({ ...raw, discount: { type: raw.discountType, value: raw.discountValue } });
  if (!parsed.success) return { ok: false, message: "Enter a valid code and discount: 1–100 for a percentage or a positive amount with up to two decimal places." };
  const { classId, id, code, discount, isActive } = parsed.data;

  const result = await getDb().transaction(async tx => {
    // Serialize changes to promo eligibility with new checkout reservations.
    const [activity] = await tx.select({ timezone: classes.timezone }).from(classes).where(eq(classes.id, classId)).for("update");
    if (!activity) return { ok: false, message: "Class not found." };
    let validFrom: Date;
    let validUntil: Date;
    try {
      validFrom = parseLocalDateTime(parsed.data.validFrom, activity.timezone);
      validUntil = parseLocalDateTime(parsed.data.validUntil, activity.timezone);
    } catch {
      return { ok: false, message: `Enter valid start and end times in ${activity.timezone}.` };
    }
    if (validUntil <= validFrom) return { ok: false, message: "The end time must be after the start time." };

    const values = { discountType: discount.type, discountValue: discount.value, validFrom, validUntil, isActive: isActive === "on", updatedAt: new Date() };
    const [saved] = id
      ? await tx.update(classPromoCodes).set(values).where(and(eq(classPromoCodes.id, id), eq(classPromoCodes.classId, classId))).returning({ id: classPromoCodes.id })
      : await tx.insert(classPromoCodes).values({ ...values, classId, code })
        .onConflictDoNothing({ target: [classPromoCodes.classId, classPromoCodes.code] }).returning({ id: classPromoCodes.id });
    if (!saved) return { ok: false, message: id ? "Promo code not found for this class." : "That code already exists for this class." };

    await tx.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: id ? "CLASS_PROMO_UPDATED" : "CLASS_PROMO_CREATED",
      entityType: "class_promo_code",
      entityId: saved.id,
      metadata: { classId, code, ...values },
    });
    return { ok: true, message: id ? "Promo code updated." : "Promo code and booking link created." };
  });
  if (result.ok) revalidatePath(`/admin/classes/${classId}/promos`);
  return result;
}
