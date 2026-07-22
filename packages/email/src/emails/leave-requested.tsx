import { Html,Head,Body,Container,Text,Heading,Button,Preview } from '@react-email/components'
export interface LeaveRequestedProps { managerName:string; employeeName:string; leaveType:string; startDate:string; endDate:string; days:number; reviewUrl:string }
export function LeaveRequested({ managerName='Yonetici',employeeName,leaveType,startDate,endDate,days,reviewUrl }: LeaveRequestedProps) {
  return (
    <Html lang="tr"><Head/><Preview>{employeeName} izin talebi</Preview>
      <Body style={{backgroundColor:'#f5f7fa',fontFamily:'Arial',padding:'24px 0'}}>
        <Container style={{backgroundColor:'#fff',borderRadius:'8px',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
          <Heading style={{fontSize:'22px',color:'#1e293b'}}>Yeni Izin Talebi</Heading>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.5',margin:'12px 0'}}>Merhaba {managerName},</Text>
          <Text style={{fontSize:'15px',color:'#475569',lineHeight:'1.5',margin:'12px 0'}}><strong>{employeeName}</strong> adli personel <strong>{leaveType}</strong> izni icin talepte bulundu.</Text>
          <div style={{backgroundColor:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'6px',padding:'16px',marginTop:'8px'}}>
            <Text style={{fontSize:'14px',color:'#334155',lineHeight:'1.7',margin:'4px 0'}}>Tur: {leaveType}<br/>Baslangic: {startDate}<br/>Bitis: {endDate}<br/>Gun: {days}</Text>
          </div>
          <Button href={reviewUrl} style={{display:'inline-block',backgroundColor:'#16a34a',color:'#fff',padding:'12px 24px',borderRadius:'6px',textDecoration:'none',fontSize:'15px',marginTop:'18px'}}>Onaylamak Icin Tiklayin</Button>
        </Container>
      </Body>
    </Html>
  )
}
