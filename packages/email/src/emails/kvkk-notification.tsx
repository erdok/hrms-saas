import { Html,Head,Body,Container,Text,Heading,Preview } from '@react-email/components'
export interface KvkkNotificationProps { adminName:string; subjectType:'export'|'delete'; requestedAt:string; affectedEmployees:number }
export function KvkkNotification({ adminName='IK Yetkilisi',subjectType='export',requestedAt=new Date().toLocaleString('tr-TR'),affectedEmployees=120 }: KvkkNotificationProps) {
  const verb = subjectType==='export'?'veri ihraci':'Veri silme'
  return (
    <Html lang="tr"><Head/><Preview>KVKK {verb} tamamlandi</Preview>
      <Body style={{backgroundColor:'#f5f7fa',fontFamily:'Arial',padding:'24px 0'}}>
        <Container style={{backgroundColor:'#fff',borderRadius:'8px',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
          <Heading style={{fontSize:'20px',color:'#1e293b'}}>KVKK Bildirimi</Heading>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.6',margin:'12px 0'}}>Merhaba {adminName},</Text>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.6',margin:'12px 0'}}>Asagidaki {verb} islemi {requestedAt} tarihinde talep edilmis ve islenmistir.</Text>
          <div style={{backgroundColor:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'16px',marginTop:'8px'}}>
            <Text style={{fontSize:'14px',color:'#334155',lineHeight:'1.7',margin:'4px 0'}}>Islem: {verb}<br/>Etkilenen kayit: {affectedEmployees}<br/>Tarih: {requestedAt}</Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}
