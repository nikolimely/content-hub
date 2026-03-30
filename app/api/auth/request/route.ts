import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { signMagicToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { email } = await req.json();

  const allowedDomain = "limely.co.uk";

  if (typeof email !== "string" || !email.toLowerCase().endsWith(`@${allowedDomain}`)) {
    return NextResponse.json(
      { error: `Only @${allowedDomain} email addresses are allowed.` },
      { status: 400 }
    );
  }

  const token = await signMagicToken(email.toLowerCase());
  const origin = req.nextUrl.origin;
  const link = `${origin}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: "Content Hub <noreply@send.limely.co.uk>",
    to: email.toLowerCase(),
    subject: "Your sign-in link for Content Hub",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;padding:32px;border-radius:12px;">
        <h2 style="color:#ffffff;margin-bottom:8px;">Sign in to Content Hub</h2>
        <p style="color:rgba(255,255,255,0.5);margin-bottom:24px;">Click the button below to sign in. This link expires in <strong style="color:rgba(255,255,255,0.8)">15 minutes</strong>.</p>
        <a href="${link}" style="display:inline-block;background:#ffffff;color:#0f0f0f;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-bottom:24px;">
          Sign in to Content Hub
        </a>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-bottom:4px;">Or copy this URL:</p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;word-break:break-all;">${link}</p>
        <p style="color:rgba(255,255,255,0.2);font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
