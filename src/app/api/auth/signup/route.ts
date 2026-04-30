import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie, HttpError } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw new HttpError(409, "Email already registered");

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, name },
      select: { id: true, email: true, name: true },
    });

    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (err) {
    return handleError(err);
  }
}
