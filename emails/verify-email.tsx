import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface VerificationEmailProps {
  userFirstname?: string
  validationLink?: string
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : ''

export const VerificationEmail = ({
  userFirstname,
  validationLink,
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Email Verification</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="184"
            height="75"
            alt="CodinIT.dev"
            style={logo}
          />
          <Heading style={h1}>Verify Your Email</Heading>
          <Text style={text}>
            Hello {userFirstname}, please click the button below to verify your
            email address.
          </Text>
          <Section style={{ textAlign: 'center' }}>
            <Button
              style={button}
              href={validationLink}
            >
              Verify Email
            </Button>
          </Section>
          <Text style={text}>
            If you didn't request this, please ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default VerificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  padding: '45px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  margin: '24px 0',
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 20px',
}
