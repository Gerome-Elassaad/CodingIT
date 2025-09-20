'use server'

export type EmailValidationResponse = {
  address: string
  status: string
  sub_status: string
  free_email: boolean
  account: string
  domain: string
  mx_found: boolean
  did_you_mean: string | null
  domain_age_days: string | null
  active_in_days: string | null
  smtp_provider: string | null
  mx_record: string | null
  firstname: string | null
  lastname: string | null
  gender: string | null
  country: string | null
  region: string | null
  city: string | null
  zipcode: string | null
  processed_at: string
}

export async function validateEmail(email: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    return true
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=pkce_d5a46b0a17d0c9f1f2666887a57186f593ff9d80abceb7e3437bc20c&type=signup&redirect_to=http://codingit.vercel.app`,
  )

  const responseData = await response.json()

  const data = {
    ...responseData,
    mx_found:
      responseData.mx_found === 'true'
        ? true
        : responseData.mx_found === 'false'
          ? false
          : responseData.mx_found,
  } as EmailValidationResponse

  switch (data.status) {
    case 'invalid':
    case 'spamtrap':
    case 'abuse':
    case 'do_not_mail':
      return false
  }

  return true
}
