interface WhatsAppMessage {
  to: string
  text: string
}

export async function sendWhatsAppMessage(message: WhatsAppMessage) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured')
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: message.to,
      text: { body: message.text },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`WhatsApp API error: ${error}`)
  }

  return response.json()
}

export async function sendSermonToWhatsApp(
  phoneNumber: string,
  sermonTitle: string,
  sermonSummary: string,
  sermonUrl: string
) {
  const summary = sermonSummary.replace(/<[^>]+>/g, '').slice(0, 500)
  const message = `📖 ${sermonTitle}\n\n${summary}\n\n${sermonUrl}`

  return sendWhatsAppMessage({
    to: phoneNumber,
    text: message,
  })
}
