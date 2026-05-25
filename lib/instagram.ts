interface InstagramMedia {
  image_url: string
  caption: string
}

export async function postToInstagram(media: InstagramMedia) {
  // Instagram requires OAuth flow and access token
  // This is a simplified version - production would need proper OAuth setup
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUserId = process.env.INSTAGRAM_USER_ID

  if (!accessToken || !igUserId) {
    throw new Error('Instagram credentials not configured')
  }

  // First, upload the image
  const uploadUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      image_url: media.image_url,
      caption: media.caption,
    }),
  })

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text()
    throw new Error(`Instagram upload error: ${error}`)
  }

  const uploadData = await uploadResponse.json()
  const creationId = uploadData.id

  // Then publish the media
  const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`

  const publishResponse = await fetch(publishUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      creation_id: creationId,
    }),
  })

  if (!publishResponse.ok) {
    const error = await publishResponse.text()
    throw new Error(`Instagram publish error: ${error}`)
  }

  return publishResponse.json()
}
