import { Html,Head,Body,Container,Text,Heading,Button,Link,Preview } from '@react-email/components'
export interface WelcomeProps { companyName:string; fullName:string; loginUrl:string; trialEndsAt?:string }
export function WelcomeEmail({ companyName='Acme',fullName='Test',loginUrl='http://localhost:3000/login',trialEndsAt }: WelcomeProps) {
  return (
    <Html lang="tr"><Head/><Preview>HRMS - Hos Geldiniz!</Preview>
      <Body style={{backgroundColor:'#f5f7fa',fontFamily:'Arial,sans-serif',padding:'32px 0'}}>
        <Container style={{backgroundColor:'#fff',borderRadius:'8px',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
          <Heading style={{fontSize:'22px',color:'#1e293b'}}>HRMS-e Hos Geldiniz</Heading>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.6',margin:'12px 0'}}>Merhaba {fullName},</Text>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.6',margin:'12px 0'}}><strong>{companyName}</strong> sirketiniz basariyla olusturuldu.{trialEndsAt?' Deneme sureniz '+trialEndsAt+' tarihine kadar devam edecek.':' Sistem kullanima hazir.'}</Text>
          <Button href={loginUrl} style={{display:'inline-block',backgroundColor:'#2563eb',color:'#fff',padding:'12px 24px',borderRadius:'6px',textDecoration:'none',fontSize:'15px',marginTop:'16px'}}>Sisteme Giris Yap</Button>
          <Text style={{fontSize:'12px',color:'#94a3b8',marginTop:'24px',borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}>Otomatik gonderilmistir.</Text>
        </Container>
      </Body>
    </Html>
  )
}
