import React, { useRef, useState } from 'react'
import { Download, Upload, Send, FileSpreadsheet, User, Building2, MessageSquareText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { BomCreateIcon, BomUpdateIcon, BomDeleteIcon } from '@/components/BomOperationIcons'

type BomModifyRequest = {
  id: number
  created_at: string
  requestno: number
  type: string
  itemname: string
  itemno: string
  itemspec: string
  delmatname: string
  delmatno: string
  delmatspec: string
  delmatqty: number
  newmatname: string
  newmatno: string
  newmatspec: string
  newmatqty: number
  dept: string
  user: string
  reason: string
}

export const BomEdit: React.FC = () => {
  const uploadRef = useRef<HTMLInputElement | null>(null)
  const [dept, setDept] = useState('')
  const [owner, setOwner] = useState('')
  const [reason, setReason] = useState('')
  const [requestType, setRequestType] = useState<'create' | 'update' | 'delete'>('create')
  const [isDragging, setIsDragging] = useState(false)
  const [csvRows, setCsvRows] = useState<string[][]>([])

  const handleDownload = async (type: 'create' | 'update' | 'delete') => {
    // 우선 정적 템플릿(public/templates) 시도 → 없으면 기존 방식으로 동적 생성
    const staticPath = `/templates/bom-${type}-template.xlsx`
    try {
      const res = await fetch(staticPath, { cache: 'no-store' })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bom-${type}-template.xlsx`
        a.click()
        URL.revokeObjectURL(url)
        return
      }
    } catch {
      // 정적 파일 미존재 또는 네트워크 오류 시 동적 생성으로 폴백
    }

    let headerRow: string[] = []
    let sampleRow: (string | number)[] = []

    switch (type) {
      case 'create':
        headerRow = ['SET품명', 'SET품번', 'SET규격', '추가할 자재명', '추가할 자재번호', '추가할 자재규격', '소요량']
        sampleRow = ['샘플 SET', 'SET-001', '300×200×100', '추가할 자재명', 'ADD-001', '추가할 자재규격', 2]
        break
      case 'update':
        headerRow = ['SET품명', 'SET품번', 'SET규격', '변경 전 하위품명', '변경 전 하위품번', '변경 전 하위규격', '변경 전 하위소요량', '변경 후 하위품명', '변경 후 하위품번', '변경 후 하위규격', '변경 후 하위소요량']
        sampleRow = ['샘플 SET', 'SET-001', '300×200×100', '기존 자재명', 'OLD-001', '기존 규격', 5, '새 자재명', 'NEW-001', '새 규격', 3]
        break
      case 'delete':
        headerRow = ['SET품명', 'SET품번', 'SET규격', '삭제할 자재명', '삭제할 자재번호', '삭제할 자재규격']
        sampleRow = ['샘플 SET', 'SET-001', '300×200×100', '삭제할 자재명', 'DEL-001', '삭제할 자재규격']
        break
    }

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, sampleRow])
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')

    const wbArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bom-${type}-template.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUploadClick = () => uploadRef.current?.click()

  const detectRequestType = (headers: string[]): 'create' | 'update' | 'delete' | null => {
    // 헤더를 문자열로 변환하고 공백 제거하여 비교
    const headerStr = headers.map(h => h.trim()).join('|').toLowerCase()
    
    // 추가: '추가할' 키워드 포함
    if (headerStr.includes('추가할')) {
      return 'create'
    }
    
    // 변경: '변경 전', '변경 후' 키워드 포함
    if (headerStr.includes('변경 전') && headerStr.includes('변경 후')) {
      return 'update'
    }
    
    // 삭제: '삭제할' 키워드 포함
    if (headerStr.includes('삭제할')) {
      return 'delete'
    }
    
    return null
  }

  const handleFile = async (file: File) => {
    const lower = file.name.toLowerCase()
    if (!(lower.endsWith('.xlsx') || lower.endsWith('.xls'))) return
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<string[] | number[]>(sheet, { header: 1 }) as (string | number)[][]
    const normalized = rows.map(r => r.map(c => (c ?? '').toString()))
    setCsvRows(normalized)
    
    // 헤더 기반 요청 타입 자동 식별
    if (normalized.length > 0) {
      const detectedType = detectRequestType(normalized[0])
      if (detectedType) {
        setRequestType(detectedType)
      }
    }
  }

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) await handleFile(f)
    e.currentTarget.value = ''
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true)
  }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false)
  }
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await handleFile(file)
  }

  function parseCsv(text: string): string[][] {
    // 가벼운 CSV 파서 (따옴표 미니 지원)
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.length > 0)
    const rows: string[][] = []
    for (const line of lines) {
      const cells: string[] = []
      let cur = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
          else { inQuotes = !inQuotes }
        } else if (ch === ',' && !inQuotes) {
          cells.push(cur.trim()); cur = ''
        } else {
          cur += ch
        }
      }
      cells.push(cur.trim())
      rows.push(cells)
    }
    return rows
  }

  const handleSubmit = async () => {
    // 데이터 검증
    if (!dept.trim()) {
      alert('부서를 입력해주세요.')
      return
    }
    if (!owner.trim()) {
      alert('담당자를 입력해주세요.')
      return
    }
    if (!reason.trim()) {
      alert('변경사유를 입력해주세요.')
      return
    }
    if (csvRows.length === 0) {
      alert('엑셀 파일을 업로드해주세요.')
      return
    }

    try {
      // requestno 생성 (현재 최대값 + 1)
      const { data: maxData } = await supabase.from('MG_bommodifyrequest')
        .select('requestno')
        .order('requestno', { ascending: false })
        .limit(1)
      
      const nextRequestNo = (maxData?.[0]?.requestno || 0) + 1
      console.log('생성된 requestno:', nextRequestNo)

      // CSV 데이터를 데이터베이스 형식으로 변환
      const requestData = await convertCsvToRequestData(csvRows, nextRequestNo)
      
      if (requestData.length === 0) {
        alert('유효한 데이터가 없습니다.')
        return
      }

      // 배치 처리 함수 (1000건 이상 데이터 처리용)
      const insertInBatches = async (tableName: string, data: any[], batchSize: number = 500) => {
        const results: any[] = []
        
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize)
          console.log(`${tableName} 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} 처리 중... (${batch.length}건)`)
          
          const { data: result, error } = await supabase
            .from(tableName)
            .insert(batch)
            .select()
          
          if (error) {
            throw error
          }
          
          if (result) {
            results.push(...result)
          }
        }
        
        return results
      }

      // 데이터베이스에 저장 - 배치 처리
      console.log(`저장할 데이터: ${requestData.length}건`)
      
      let savedData: any[]
      try {
        savedData = await insertInBatches('MG_bommodifyrequest', requestData, 500)
      } catch (error: any) {
        console.error('저장 오류 상세:', error)
        console.error('오류 코드:', error.code)
        console.error('오류 메시지:', error.message)
        console.error('오류 세부사항:', error.details)
        alert(`저장 실패: ${error.message}\n\n해결방법:\n1. Supabase 대시보드에서 bommodifyrequest 테이블의 RLS 정책을 확인하세요.\n2. 또는 RLS를 임시로 비활성화하세요.\n3. INSERT 권한이 있는 정책을 추가하세요.`)
        return
      }

      console.log('저장 완료:', savedData.length, '건')
      alert(`수정 요청이 완료되었습니다. (요청번호: ${nextRequestNo}, ${savedData.length}건 저장)`) 
      
      // 폼 초기화
      setDept('')
      setOwner('')
      setReason('')
      setCsvRows([])
      
    } catch (err) {
      console.error('요청 제출 실패:', err)
      alert(`요청 제출 실패: ${err}`)
    }
  }

  const convertCsvToRequestData = async (csvRows: string[][], requestno: number) => {
    if (csvRows.length === 0) return []
    
    const headers = csvRows[0]
    const dataRows = csvRows.slice(1).filter(row => row.some(cell => cell.trim()))
    
    console.log('CSV 헤더:', headers)
    console.log('CSV 데이터 행:', dataRows.length)
    
    // 헤더 인덱스 매핑
    const getColumnIndex = (columnName: string) => {
      const index = headers.findIndex(h => h.trim() === columnName)
      return index >= 0 ? index : -1
    }
    
    const requestData = dataRows.map(row => {
      // 타입은 토글에서 선택된 값 사용
      const type = requestType
      
      // 공통 필드
      const itemname = row[getColumnIndex('SET품명')] || ''
      const itemno = row[getColumnIndex('SET품번')] || ''
      const itemspec = row[getColumnIndex('SET규격')] || ''
      
      let delmatname = '', delmatno = '', delmatspec = '', delmatqty = 0
      let newmatname = '', newmatno = '', newmatspec = '', newmatqty = 0
      
      // 타입별 필드 매핑
      if (type === 'create') {
        // 추가: new 필드에 매핑
        newmatname = row[getColumnIndex('추가할 자재명')] || ''
        newmatno = row[getColumnIndex('추가할 자재번호')] || ''
        newmatspec = row[getColumnIndex('추가할 자재규격')] || ''
        newmatqty = parseFloat(row[getColumnIndex('소요량')] || '0') || 0
      } else if (type === 'update') {
        // 변경: del과 new 필드 모두 매핑
        delmatname = row[getColumnIndex('변경 전 하위품명')] || ''
        delmatno = row[getColumnIndex('변경 전 하위품번')] || ''
        delmatspec = row[getColumnIndex('변경 전 하위규격')] || ''
        delmatqty = parseFloat(row[getColumnIndex('변경 전 하위소요량')] || '0') || 0
        
        newmatname = row[getColumnIndex('변경 후 하위품명')] || ''
        newmatno = row[getColumnIndex('변경 후 하위품번')] || ''
        newmatspec = row[getColumnIndex('변경 후 하위규격')] || ''
        newmatqty = parseFloat(row[getColumnIndex('변경 후 하위소요량')] || '0') || 0
      } else if (type === 'delete') {
        // 삭제: del 필드에 매핑
        delmatname = row[getColumnIndex('삭제할 자재명')] || ''
        delmatno = row[getColumnIndex('삭제할 자재번호')] || ''
        delmatspec = row[getColumnIndex('삭제할 자재규격')] || ''
      }
      
      return {
        requestno,
        type,
        itemname,
        itemno,
        itemspec,
        delmatname,
        delmatno,
        delmatspec,
        delmatqty,
        newmatname,
        newmatno,
        newmatspec,
        newmatqty,
        dept: dept.trim(),
        user: owner.trim(),
        reason: reason.trim()
      }
    })
    
    console.log('변환된 요청 데이터:', requestData)
    return requestData
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="relative">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 bg-white rounded-full px-6 py-2 shadow-md">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BOM 수정
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              요청 파일 다운로드, 업로드, 요청 정보를 순서대로 진행합니다.
            </p>
          </div>
          
        </div>

        {/* 1. 요청 파일 다운로드 */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                1
              </Badge>
              <CardTitle className="text-green-800">BOM 수정 요청파일 다운로드</CardTitle>
            </div>
            <CardDescription className="text-green-600">
              추가 / 변경 / 삭제 템플릿을 구분하여 다운로드합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <Badge variant="outline" className="text-base px-4 py-2 bg-blue-100 text-blue-800 border-blue-300">
                  ➕ 추가
                </Badge>
                <p className="text-xs text-gray-600">BOM 리스트에 새로운 하위 자재를 추가</p>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <BomCreateIcon className="w-full h-20" />
                </div>
                <Button 
                  onClick={() => handleDownload('create')} 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
                >
                  <Download className="w-4 h-4 mr-2" />
                  추가 템플릿
                </Button>
              </div>
              <div className="space-y-3">
                <Badge variant="outline" className="text-base px-4 py-2 bg-orange-100 text-orange-800 border-orange-300">
                  ◆ 변경
                </Badge>
                <p className="text-xs text-gray-600">BOM 리스트의 하위 자재를 다른 하위 자재로 변경</p>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <BomUpdateIcon className="w-full h-20" />
                </div>
                <Button 
                  onClick={() => handleDownload('update')} 
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
                >
                  <Download className="w-4 h-4 mr-2" />
                  변경 템플릿
                </Button>
              </div>
              <div className="space-y-3">
                <Badge variant="outline" className="text-base px-4 py-2 bg-red-100 text-red-800 border-red-300">
                  ❌ 삭제
                </Badge>
                <p className="text-xs text-gray-600">BOM 리스트의 하위 자재를 삭제</p>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <BomDeleteIcon className="w-full h-20" />
                </div>
                <Button 
                  onClick={() => handleDownload('delete')} 
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md"
                >
                  <Download className="w-4 h-4 mr-2" />
                  삭제 템플릿
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. 파일 업로드 */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                2
              </Badge>
              <CardTitle className="text-blue-800">BOM 파일 업로드</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <input ref={uploadRef} type="file" accept=".xlsx,.xls" onChange={onInputChange} className="hidden" />

              <div
                onDragOver={onDragOver}
                onDragEnter={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-lg' 
                    : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={handleUploadClick}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <div className="text-gray-700 font-semibold text-lg">엑셀 파일(.xlsx)을 드래그&드롭 하세요</div>
                <div className="text-gray-500 text-sm mt-2">또는 클릭해서 파일 선택</div>
              </div>

              {csvRows.length > 0 && (
                <div className="max-h-[40vh] overflow-auto rounded-xl border border-gray-200 shadow-inner">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        {csvRows[0].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left border-b font-semibold text-gray-700">
                            {h || `컬럼${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className="odd:bg-slate-50/50 hover:bg-blue-50/50 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-3 border-b border-gray-100 align-top text-gray-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            
            </div>
          </CardContent>
        </Card>

        {/* 3. 요청 정보 */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                3
              </Badge>
              <CardTitle className="text-purple-800">요청 정보 입력</CardTitle>
            </div>
            <CardDescription className="text-purple-600">
              부서, 담당자, 변경 사유를 입력한 후 수정 요청을 보냅니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* 요청 타입 자동 식별 표시 */}
            {csvRows.length > 0 && (
              <div className="mb-6 flex items-center space-x-3">
                <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <MessageSquareText className="w-4 h-4 text-purple-500" />
                  <span>요청 타입 :</span>
                </Label>
                <Badge 
                  variant="outline" 
                  className={`text-base px-4 py-2 ${
                    requestType === 'create' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    requestType === 'update' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {requestType === 'create' ? '➕ 추가' : requestType === 'update' ? '◆ 변경' : '❌ 삭제'}
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="dept" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>부서</span>
                </Label>
                <Input 
                  id="dept" 
                  value={dept} 
                  onChange={(e) => setDept(e.target.value)} 
                  placeholder="예: 경영지원파트"
                  className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="owner" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 text-green-500" />
                  <span>담당자</span>
                </Label>
                <Input 
                  id="owner" 
                  value={owner} 
                  onChange={(e) => setOwner(e.target.value)} 
                  placeholder="예: 조민기"
                  className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="reason" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <MessageSquareText className="w-4 h-4 text-orange-500" />
                  <span>변경 사유</span>
                </Label>
                <Input 
                  id="reason" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder="예: 등록 과정에서 하위자재 누락"
                  className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="mt-8 text-center">
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg px-8 py-3 text-base font-semibold" 
                onClick={handleSubmit}
              >
                <Send className="w-5 h-5 mr-2" />
                수정 요청
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BomEdit



