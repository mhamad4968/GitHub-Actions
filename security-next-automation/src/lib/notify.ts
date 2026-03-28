/**
 * 任意 Webhook へ失敗通知（Slack Incoming Webhook 互換の JSON を想定）
 */
export async function notifyFailure(
  webhookUrl: string | undefined,
  payload: { workflow: string; message: string; detail?: string },
): Promise<void> {
  if (!webhookUrl) {
    console.log("[notify] NOTIFY_WEBHOOK_URL 未設定のため通知スキップ");
    return;
  }
  const body = {
    text: `*${payload.workflow}* 失敗\n${payload.message}${payload.detail ? `\n\`\`\`${payload.detail.slice(0, 3500)}\`\`\`` : ""}`,
  };
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn("[notify] Webhook 応答異常:", res.status, await res.text());
  }
}
