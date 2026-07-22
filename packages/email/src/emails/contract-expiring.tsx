import { Html,Head,Body,Container,Text,Heading,Preview } from '@react-email/components'
export interface ContractExpiringProps { hrManagerName:string; employeeName:string; contractEnd:string; daysRemaining:number }
export function ContractExpiring({ hrManagerName='IK Yetkilisi',employeeName,contractEnd,daysRemaining }: ContractExpiringProps) {
  const urgency = daysRemaining<=7?'ACIL':'Bilgi'; const color = daysRemaining<=7?'#dc2626':'#d97706'
  return (
    <Html lang="tr"><Head/><Preview>{employeeName} sozlesmesi {daysRemaining} gun icinde bitecek</Preview>
      <Body style={{backgroundColor:'#f5f7fa',fontFamily:'Arial',padding:'24px 0'}}>
        <Container style={{backgroundColor:'#fff',borderRadius:'8px',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
          <Heading style={{fontSize:'20px',color:'#1e293b'}}><span style={{color}}>[{urgency}]</span> Sozlesme Bitis Uyarisi</Heading>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.6',margin:'12px 0'}}>Merhaba {hrManagerName},</Text>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.6',margin:'12px 0'}}><strong>{employeeName}</strong> - sozlesmesi <strong>{contractEnd}</strong> tarihinde sona eriyor ({daysRemaining} gun kaldi).</Text>
          <Text style={{fontSize:'12px',color:'#94a3b8',marginTop:'24px',borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}>Otomatik bildirim.</Text>
        </Container>
      </Body>
    </Html>
  )
}
