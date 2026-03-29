/**
 * Webhook（Slack 等）と任意の SMTP メールで通知する。
 * メール: NOTIFY_EMAIL_TO + SMTP_USER + SMTP_PASS（Gmail ならアプリパスワード）を設定。
 */
import nodemailer from "nodemailer";

/**
 * SMTP が揃っていれば true（メール送信用）
 */
function smtpMailEnabled(): boolean {
  const to = process.env.NOTIFY_EMAIL_TO?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(to && user && pass);
}

async function sendSmtpMail(subject: string, text: string): Promise<void> {
  if (!smtpMailEnabled()) {
    return;
  }
  const to = process.env.NOTIFY_EMAIL_TO!.trim();
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const from = process.env.SMTP_FROM?.trim() || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
  console.log("[notify] メール送信完了:", to);
}

/**
 * 成功時の実行サマリーを Webhook と（設定時）メールへ送る。
 */
export async function notifyRunSummary(
  webhookUrl: string | undefined,
  payload: {
    workflow: string;
    candidateCount: number;
    addedCount: number;
    extraLines?: string[];
  },
): Promise<void> {
  const slackLines = [
    `*${payload.workflow}* 成功`,
    `• 候補数: ${payload.candidateCount}`,
    `• 追加件数: ${payload.addedCount}`,
    ...(payload.extraLines ?? []),
  ];
  const emailLines = [
    `${payload.workflow} 成功（Security NEXT 自動化）`,
    `候補数: ${payload.candidateCount}`,
    `追加件数: ${payload.addedCount}`,
    ...(payload.extraLines ?? []).map((l) => l.replace(/^•\s*/, "")),
  ];

  const url = webhookUrl?.trim();
  if (url) {
    const body = { text: slackLines.join("\n") };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[notify] サマリー Webhook 応答異常:", res.status, await res.text());
    }
  } else {
    console.log("[notify] NOTIFY_SUMMARY_WEBHOOK_URL 未設定のため Webhook サマリーはスキップ");
  }

  if (smtpMailEnabled()) {
    try {
      await sendSmtpMail(
        `[Security NEXT] ${payload.workflow} 成功（候補${payload.candidateCount} / 追加${payload.addedCount}）`,
        emailLines.join("\n"),
      );
    } catch (e) {
      console.warn("[notify] メール送信に失敗:", e);
    }
  } else {
    console.log("[notify] NOTIFY_EMAIL_TO または SMTP 認証が未設定のためメールサマリーはスキップ");
  }
}

/**
 * 失敗を Webhook と（設定時）メールへ送る。
 */
export async function notifyFailure(
  webhookUrl: string | undefined,
  payload: { workflow: string; message: string; detail?: string },
): Promise<void> {
  const text = `*${payload.workflow}* 失敗\n${payload.message}${payload.detail ? `\n\`\`\`${payload.detail.slice(0, 3500)}\`\`\`` : ""}`;

  if (webhookUrl) {
    const body = { text };
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[notify] Webhook 応答異常:", res.status, await res.text());
    }
  } else {
    console.log("[notify] NOTIFY_WEBHOOK_URL 未設定のため Webhook 通知スキップ");
  }

  if (smtpMailEnabled()) {
    const plain = [
      `${payload.workflow} 失敗（Security NEXT 自動化）`,
      payload.message,
      payload.detail ? `\n---\n${payload.detail.slice(0, 8000)}` : "",
    ].join("\n");
    try {
      await sendSmtpMail(`[Security NEXT] ${payload.workflow} 失敗`, plain);
    } catch (e) {
      console.warn("[notify] 失敗メール送信に失敗:", e);
    }
  }
}
