interface TelegramMessage {
  chat_id: string
  text: string
  parse_mode?: 'Markdown' | 'HTML'
  disable_web_page_preview?: boolean
}

export async function sendTelegramMessage(message: TelegramMessage) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set')
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

export async function sendSermonToTelegram(
  sermonId: string,
  sermonTitle: string,
  sermonSummary: string,
  sermonUrl: string,
  channelId?: string
) {
  const chatId = channelId || process.env.TELEGRAM_CHANNEL_ID
  if (!chatId) {
    throw new Error('No Telegram channel ID provided')
  }

  const summary = sermonSummary.replace(/<[^>]+>/g, '').slice(0, 500)
  const message = `📖 *${sermonTitle}*\n\n${summary}\n\n[Read more](${sermonUrl})`

  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
  })
}
