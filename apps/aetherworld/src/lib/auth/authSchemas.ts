import { z } from "zod";

export const emailSchema = z.string().trim().email({ message: "请输入有效邮箱" }).max(255);
export const passwordSchema = z
  .string()
  .min(8, { message: "密码至少 8 位" })
  .max(128, { message: "密码过长" });
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, { message: "请输入显示名称" })
  .max(60, { message: "名称过长" });
