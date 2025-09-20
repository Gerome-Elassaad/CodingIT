import { render } from '@react-email/render'
import WelcomeTemplate, { WelcomeEmail } from '../../../emails/welcome/welcome'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import VerificationEmail from '@/emails/verify-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest, _response: NextResponse) {
  const ip = request.ip ?? '127.0.0.1'

  // Add your rate limiting logic here if needed

  const { email, type, ...props } = await request.json()

  if (!email || !type) {
    return NextResponse.json({ error: 'Email and type are required' })
  }

  let subject = ''
  let template: React.ReactElement | null = null

  switch (type) {
    case 'welcome':
      subject = 'Thank you for waitlisting for CodinIT.dev'
      template = WelcomeTemplate({
        ...WelcomeEmail.PreviewProps,
        userFirstname: props.firstname,
      })
      break
    case 'verification':
      subject = 'Verify your email address'
      template = VerificationEmail({
        validationLink: props.validationLink,
        userFirstname: props.firstname,
      })
      break
    default:
      return NextResponse.json({ error: 'Invalid email type' })
  }

  if (!template) {
    return NextResponse.json({ error: 'Failed to create email template' })
  }

  const { data, error } = await resend.emails.send({
    from: 'Gerome<team@codinit.dev>',
    to: [email],
    subject,
    replyTo: 'gerome.e24@gmail.com',
    html: await render(template),
  })

  if (error) {
    return NextResponse.json(error)
  }

  if (!data) {
    return NextResponse.json({ message: 'Failed to send email' })
  }

  return NextResponse.json({ message: 'Email sent successfully' })
}
