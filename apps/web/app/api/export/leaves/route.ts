import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient, listLeaves } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Verify authn/authz via session helpers (cookies-based).
  const supabase = createClient()
  let session
  try {
    session = await requirePermission('read', 'leaves')
  } catch {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const url = new URL(request.url)
  const status = (url.searchParams.get('status') || undefined) as
    | 'pending' | 'approved' | 'rejected' | undefined
  const type = (url.searchParams.get('type') || undefined) as
    | 'Yillik' | 'Mazeret' | 'Hastalik' | 'Ucretsiz' | undefined
  const dept = url.searchParams.get('dept') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined

  const leaves = await listLeaves(supabase, {
    status,
    type,
    departmentId: dept,
    from,
    to,
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = session.company.name
  wb.created = new Date()

  const ws = wb.addWorksheet('Izinler', {
    properties: { defaultRowHeight: 18 },
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = [
    { header: 'Personel', key: 'employee_name', width: 24 },
    { header: 'Departman', key: 'department_name', width: 22 },
    { header: 'Tur', key: 'type', width: 12 },
    { header: 'Baslangic', key: 'start_date', width: 14 },
    { header: 'Bitis', key: 'end_date', width: 14 },
    { header: 'Gun', key: 'days', width: 8 },
    { header: 'Durum', key: 'status', width: 14 },
    { header: 'Onaylayan', key: 'approver_name', width: 22 },
    { header: 'Not', key: 'note', width: 30 },
    { header: 'Olusturulma', key: 'created_at', width: 20 },
  ]

  // Header style
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2F4F7D' },
  }
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' }

  const statusMap = {
    pending: 'Bekleyen',
    approved: 'Onayli',
    rejected: 'Reddedildi',
  } as const

  for (const l of leaves) {
    const row = ws.addRow({
      ...l,
      status: statusMap[l.status] ?? l.status,
      created_at: new Date(l.created_at).toLocaleString('tr-TR'),
    })
    const status = (row.getCell('status').value ?? '') as string
    if (l.status === 'approved') {
      row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF7EF' } } })
    } else if (l.status === 'rejected') {
      row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDECEC' } } })
    }
  }

  ws.getRow(1).eachCell((c) => { c.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' },
  }})

  const buffer = await wb.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="izinler.xlsx"',
    },
  })
}
