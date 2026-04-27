import React, { useRef, useState } from 'react'
import { Download, Upload, Send, Package, User, Building2, MessageSquareText, Boxes, Columns, Target, Truck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type ItemType = '제품' | '반제품' | '원자재' | '부자재' | '소모품' | null

// 품목 템플릿 헤더(Description) → DB 컬럼 매핑 (tblItemregRequest)
const HEADER_TO_COLUMN: Record<string, string> = {
  '품명': 'itemname',
  '품번': 'itemno',
  '규격': 'itemspec',
  '품목대분류': 'itemlargeclass',
  '품목중분류': 'itemmediumclass',
  '품목소분류': 'itemsmallclass',
  '자재대분류': 'itemlargeclass',  // 원자재용 (동일 컬럼 사용)
  '자재중분류': 'itemmediumclass',
  '자재소분류': 'itemsmallclass',
  '내외자': 'internal_external',
  '관리부서': 'manageddept',
  '관리창고': 'managedwarehouse',
  '구매처': 'supplier',
  '공정': 'process',
  '공정 워크센터': 'workcenter',
  '출시일자(YYYY-MM-DD)': 'releasedate',
  '중량(KG)': 'weight',
}

// BOM 템플릿 헤더 → DB 컬럼 매핑 (itemrequest_bom)
const BOM_HEADER_TO_COLUMN: Record<string, string> = {
  '모품명': 'parent_itemname',
  '모품번': 'parent_itemno',
  '모규격': 'parent_spec',
  '하위품명': 'child_itemname',
  '하위품번': 'child_itemno',
  '하위규격': 'child_spec',
  '소요량': 'qty',
}

export const ItemRegistration: React.FC = () => {
  const uploadRef = useRef<HTMLInputElement | null>(null)
  const [dept, setDept] = useState('')
  const [owner, setOwner] = useState('')
  const [url, setUrl] = useState('')  // 전자결재 URL (DB 컬럼명: url)
  const [itemType, setItemType] = useState<ItemType>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [bomRows, setBomRows] = useState<string[][]>([])  // BOM 데이터 (제품/반제품 시트2)

  const handleDownload = (type: ItemType) => {
    const templateMap: Record<ItemType, string> = {
      '제품': '/templates/item-registration-template-prod.xlsx',
      '반제품': '/templates/item-registration-template-semiprod.xlsx',
      '원자재': '/templates/item-registration-template-rawmat.xlsx',
      '부자재': '/templates/item-registration-template-submat.xlsx',
      '소모품': '/templates/item-registration-template-consumable.xlsx'
    }

    // 다운로드한 템플릿 유형으로 itemType 설정
    setItemType(type)

    const templatePath = templateMap[type]
    const a = document.createElement('a')
    a.href = templatePath
    a.download = `품목등록-${type}-template.xlsx`
    a.click()
  }

  const handleUploadClick = () => uploadRef.current?.click()

  // 헤더를 분석하여 품목 유형 자동 감지
  const detectItemType = (headers: string[], bomHeaders: string[]): ItemType => {
    const headerSet = new Set(headers.map(h => h.trim()))
    const bomHeaderSet = new Set(bomHeaders.map(h => h.trim()))
    
    console.log('시트1 헤더:', Array.from(headerSet))
    console.log('시트2 헤더:', Array.from(bomHeaderSet))
    
    // 1. 원자재: "자재대분류" 헤더가 있음
    if (headerSet.has('자재대분류')) {
      console.log('감지된 유형: 원자재 (자재대분류 헤더 발견)')
      return '원자재'
    }
    
    // 2. 제품: "출시일자(YYYY-MM-DD)" 헤더가 있음 (제품만의 고유 헤더)
    if (headerSet.has('출시일자(YYYY-MM-DD)')) {
      console.log('감지된 유형: 제품 (출시일자 헤더 발견)')
      return '제품'
    }
    
    // 3. 반제품: "공정" 헤더가 있지만 "출시일자" 없음
    if (headerSet.has('공정') || headerSet.has('공정 워크센터')) {
      console.log('감지된 유형: 반제품 (공정 헤더 발견, 출시일자 없음)')
      return '반제품'
    }
    
    // 4. 부자재: "관리창고" + "중량(KG)" + "구매처" 있고, "출시일자"/"공정" 없음
    if (headerSet.has('관리창고') && headerSet.has('중량(KG)') && headerSet.has('구매처')) {
      console.log('감지된 유형: 부자재 (관리창고 + 중량 + 구매처 헤더 발견)')
      return '부자재'
    }
    
    // 5. 소모품: 나머지 (구매처 있고 위 조건 해당 안됨)
    console.log('감지된 유형: 소모품 (기본)')
    return '소모품'
  }

  const handleFile = async (file: File) => {
    const lower = file.name.toLowerCase()
    if (!(lower.endsWith('.xlsx') || lower.endsWith('.xls'))) return
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    
    // 시트1: 품목 데이터
    const sheetName1 = workbook.SheetNames[0]
    const sheet1 = workbook.Sheets[sheetName1]
    const rows1 = XLSX.utils.sheet_to_json<string[] | number[]>(sheet1, { header: 1 }) as (string | number)[][]
    const normalized1 = rows1.map(r => r.map(c => (c ?? '').toString()))
    setCsvRows(normalized1)
    
    // 시트2: BOM 데이터 (있는 경우)
    let normalized2: string[][] = []
    if (workbook.SheetNames.length > 1) {
      const sheetName2 = workbook.SheetNames[1]
      const sheet2 = workbook.Sheets[sheetName2]
      const rows2 = XLSX.utils.sheet_to_json<string[] | number[]>(sheet2, { header: 1 }) as (string | number)[][]
      normalized2 = rows2.map(r => r.map(c => (c ?? '').toString()))
    }
    
    // 헤더를 분석하여 품목 유형 자동 감지
    const headers1 = normalized1[0] || []
    const headers2 = normalized2[0] || []
    const detectedType = detectItemType(headers1, headers2)
    setItemType(detectedType)
    
    // 공정품(제품/반제품)인 경우 BOM 데이터 설정
    if ((detectedType === '제품' || detectedType === '반제품') && normalized2.length > 0) {
      setBomRows(normalized2)
      console.log('BOM 시트 로드됨:', normalized2.length, '행')
    } else {
      setBomRows([])  // 구매품인 경우 BOM 초기화
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

  const handleSubmit = async () => {
    // 데이터 검증
    if (!itemType) {
      alert('엑셀 파일을 먼저 업로드해주세요. (품목 유형이 자동 감지됩니다)')
      return
    }
    if (!dept.trim()) {
      alert('부서를 입력해주세요.')
      return
    }
    if (!owner.trim()) {
      alert('담당자를 입력해주세요.')
      return
    }
    if (!url.trim()) {
      alert('결재문서 URL을 입력해주세요.')
      return
    }
    // 전자결재 URL 유효성 검증
    if (!url.includes('gw.speedrack.kr/app/approval')) {
      alert('결재 승인된 ERP 품목등록요청서의 URL 주소를 첨부해 주세요.')
      return
    }
    if (csvRows.length === 0) {
      alert('엑셀 파일을 업로드해주세요.')
      return
    }
    
    // 공정품(제품/반제품)인 경우 BOM 데이터 필수 체크
    if ((itemType === '제품' || itemType === '반제품') && bomRows.length <= 1) {
      alert('공정품(제품/반제품)은 BOM 데이터(시트2)가 필요합니다.')
      return
    }

    try {
      // requestno 생성 (현재 최대값 + 1)
      const { data: maxData } = await supabase
        .from('MG_tblItemregRequest')
        .select('requestno')
        .order('requestno', { ascending: false })
        .limit(1)
      
      const nextRequestNo = (maxData?.[0]?.requestno || 0) + 1
      console.log('생성된 requestno:', nextRequestNo)

      // 품목 데이터를 데이터베이스 형식으로 변환
      const itemData = convertCsvToItemData(csvRows, nextRequestNo)
      
      if (itemData.length === 0) {
        alert('유효한 품목 데이터가 없습니다.')
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

      // 1. 품목 데이터 저장 (tblItemregRequest) - 배치 처리
      console.log(`저장할 품목 데이터: ${itemData.length}건`)
      
      let itemResult: any[]
      try {
        itemResult = await insertInBatches('MG_tblItemregRequest', itemData, 500)
      } catch (itemError: any) {
        console.error('품목 저장 오류:', itemError)
        alert(`품목 저장 실패: ${itemError.message}`)
        return
      }

      console.log('품목 저장 완료:', itemResult.length, '건')
      
      // 2. BOM 데이터 저장 (제품/반제품인 경우) - 배치 처리
      let bomCount = 0
      if ((itemType === '제품' || itemType === '반제품') && bomRows.length > 1) {
        const bomData = convertBomToData(bomRows, nextRequestNo)
        
        if (bomData.length > 0) {
          console.log(`저장할 BOM 데이터: ${bomData.length}건`)
          
          try {
            const bomResult = await insertInBatches('MG_itemrequest_bom', bomData, 500)
            console.log('BOM 저장 완료:', bomResult.length, '건')
            bomCount = bomResult.length
          } catch (bomError: any) {
            console.error('BOM 저장 오류:', bomError)
            alert(`품목은 저장되었으나 BOM 저장 실패: ${bomError.message}`)
            return
          }
        }
      }

      // 성공 메시지
      const bomMessage = bomCount > 0 ? `, BOM ${bomCount}건` : ''
      alert(`품목 등록이 완료되었습니다.\n(요청번호: ${nextRequestNo}, 품목 ${itemResult.length}건${bomMessage} 저장)`) 
      
      // 폼 초기화
      setDept('')
      setOwner('')
      setUrl('')
      setCsvRows([])
      setBomRows([])
      setItemType(null)
      
    } catch (err) {
      console.error('등록 실패:', err)
      alert(`등록 실패: ${err}`)
    }
  }

  // Excel 시리얼 번호를 YYYY-MM-DD 형식으로 변환
  const excelSerialToDate = (serial: string): string | null => {
    const num = parseFloat(serial)
    if (isNaN(num)) {
      // 이미 YYYY-MM-DD 형식인 경우 그대로 반환
      if (/^\d{4}-\d{2}-\d{2}$/.test(serial)) {
        return serial
      }
      return null
    }
    
    // Excel 시리얼 번호를 JavaScript Date로 변환
    // Excel의 기준일: 1900년 1월 1일 = 1 (단, 1900년 윤년 버그로 인해 -2 보정)
    const excelEpoch = new Date(1899, 11, 30) // 1899-12-30
    const date = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000)
    
    // YYYY-MM-DD 형식으로 변환
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  const convertCsvToItemData = (csvRows: string[][], requestno: number) => {
    if (csvRows.length === 0) return []
    
    const headers = csvRows[0]
    const dataRows = csvRows.slice(1).filter(row => row.some(cell => cell.trim()))
    
    console.log('CSV 헤더:', headers)
    console.log('CSV 데이터 행:', dataRows.length)
    
    const itemData = dataRows.map(row => {
      // 기본 데이터 (시스템/UI 입력 필드)
      const item: Record<string, string | number | boolean | null> = {
        requestno,
        type: itemType,
        dept: dept.trim(),
        user: owner.trim(),
        url: url.trim(),
      }
      
      // 헤더 순회하면서 자동 매핑
      headers.forEach((header, idx) => {
        const trimmedHeader = header.trim()
        const dbColumn = HEADER_TO_COLUMN[trimmedHeader]
        
        if (dbColumn && row[idx]?.trim()) {
          const value = row[idx].trim()
          
          // 숫자 타입 처리 (weight)
          if (dbColumn === 'weight') {
            item[dbColumn] = parseFloat(value) || null
          } 
          // 날짜 타입 처리 (releasedate) - Excel 시리얼 번호 변환
          else if (dbColumn === 'releasedate') {
            item[dbColumn] = excelSerialToDate(value)
          }
          else {
            item[dbColumn] = value
          }
        }
      })
      
      return item
    })
    
    console.log('변환된 품목 데이터:', itemData)
    return itemData
  }

  // BOM 데이터 변환 함수
  const convertBomToData = (bomRows: string[][], requestno: number) => {
    if (bomRows.length === 0) return []
    
    const headers = bomRows[0]
    const dataRows = bomRows.slice(1).filter(row => row.some(cell => cell.trim()))
    
    console.log('BOM 헤더:', headers)
    console.log('BOM 데이터 행:', dataRows.length)
    
    const bomData = dataRows.map(row => {
      const bom: Record<string, string | number | boolean | null> = {
        requestno,
      }
      
      // 헤더 순회하면서 자동 매핑
      headers.forEach((header, idx) => {
        const trimmedHeader = header.trim()
        const dbColumn = BOM_HEADER_TO_COLUMN[trimmedHeader]
        
        if (dbColumn && row[idx]?.trim()) {
          const value = row[idx].trim()
          
          // 숫자 타입 처리 (qty)
          if (dbColumn === 'qty') {
            bom[dbColumn] = parseFloat(value) || null
          } else {
            bom[dbColumn] = value
          }
        }
      })
      
      return bom
    })
    
    console.log('변환된 BOM 데이터:', bomData)
    return bomData
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="relative">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 bg-white rounded-full px-6 py-2 shadow-md">
              <Package className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                품목 등록
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              템플릿 다운로드, 업로드, 등록 정보를 순서대로 진행합니다.
            </p>
          </div>
        </div>

        {/* 1. 템플릿 다운로드 */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                1
              </Badge>
              <CardTitle className="text-green-800">품목 등록 템플릿 다운로드</CardTitle>
            </div>
            <CardDescription className="text-green-600">
              품목 유형을 선택하여 템플릿을 다운로드합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* 품목 유형 선택 */}
            <div className="flex items-start justify-center gap-8">
              {/* 공정품 그룹 */}
              <div className="flex flex-col items-center gap-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 text-sm font-semibold">
                  공정품
                </Badge>
                <p className="text-xs text-gray-600 leading-tight">"품목 신규등록", "BOM업로드" 양쪽 시트 모두 작성</p>
                <div className="flex items-center gap-4">
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white w-40">
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-100 text-blue-800 border-blue-300">
                      제품
                    </Badge>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 flex items-center justify-center h-24">
                      <Boxes className="w-12 h-12 text-blue-600" />
                    </div>
                    <Button 
                      onClick={() => handleDownload('제품')} 
                      size="sm"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      다운로드
                    </Button>
                  </div>
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white w-40">
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-green-100 text-green-800 border-green-300">
                      반제품
                    </Badge>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center justify-center h-24">
                      <Columns className="w-12 h-12 text-green-600" />
                    </div>
                    <Button 
                      onClick={() => handleDownload('반제품')} 
                      size="sm"
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      다운로드
                    </Button>
                  </div>
                </div>
              </div>

              {/* 구분선 */}
              <div className="h-64 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

              {/* 구매품 그룹 */}
              <div className="flex flex-col items-center gap-3">
                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 text-sm font-semibold">
                  구매품
                </Badge>
                <p className="text-xs text-gray-600 leading-tight">"품목 신규등록" 1개의 시트만 작성</p>
                <div className="flex items-center gap-4">
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white w-40">
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-orange-100 text-orange-800 border-orange-300">
                      원자재
                    </Badge>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 flex items-center justify-center h-24">
                      <Target className="w-12 h-12 text-orange-600" />
                    </div>
                    <Button 
                      onClick={() => handleDownload('원자재')} 
                      size="sm"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      다운로드
                    </Button>
                  </div>
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white w-40">
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-purple-100 text-purple-800 border-purple-300">
                      부자재
                    </Badge>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 flex items-center justify-center h-24">
                      <Package className="w-12 h-12 text-purple-600" />
                    </div>
                    <Button 
                      onClick={() => handleDownload('부자재')} 
                      size="sm"
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      다운로드
                    </Button>
                  </div>
                  <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white w-40">
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-teal-100 text-teal-800 border-teal-300">
                      소모품
                    </Badge>
                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-200 flex items-center justify-center h-24">
                      <Truck className="w-12 h-12 text-teal-600" />
                    </div>
                    <Button 
                      onClick={() => handleDownload('소모품')} 
                      size="sm"
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      다운로드
                    </Button>
                  </div>
                </div>
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
              <CardTitle className="text-blue-800">품목 파일 업로드</CardTitle>
              {itemType && (
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  선택된 유형: {itemType}
                </Badge>
              )}
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
                <div className="space-y-4">
                  {/* 품목 데이터 (시트1) */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">시트1</Badge>
                      품목 데이터 ({csvRows.length - 1}건)
                    </h4>
                    <div className="max-h-[30vh] overflow-auto rounded-xl border border-gray-200 shadow-inner">
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
                  </div>
                  
                  {/* BOM 데이터 (시트2) - 제품/반제품인 경우만 */}
                  {(itemType === '제품' || itemType === '반제품') && bomRows.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">시트2</Badge>
                        BOM 데이터 ({bomRows.length - 1}건)
                      </h4>
                      <div className="max-h-[30vh] overflow-auto rounded-xl border border-green-200 shadow-inner">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50">
                            <tr>
                              {bomRows[0].map((h, i) => (
                                <th key={i} className="px-4 py-3 text-left border-b font-semibold text-green-800">
                                  {h || `컬럼${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bomRows.slice(1).map((row, rIdx) => (
                              <tr key={rIdx} className="odd:bg-green-50/30 hover:bg-green-50/50 transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-4 py-3 border-b border-green-100 align-top text-gray-700">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* BOM 미입력 경고 (제품/반제품인데 BOM이 없는 경우) */}
                  {(itemType === '제품' || itemType === '반제품') && bomRows.length <= 1 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                      ⚠️ 공정품(제품/반제품)은 BOM 데이터(시트2)가 필요합니다. 엑셀 파일의 두 번째 시트에 BOM 정보를 입력해주세요.
                    </div>
                  )}
                </div>
              )}
            
            </div>
          </CardContent>
        </Card>

        {/* 3. 등록 정보 */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                3
              </Badge>
              <CardTitle className="text-purple-800">등록 정보 입력</CardTitle>
            </div>
            <CardDescription className="text-purple-600">
              부서, 담당자, 전자결재 URL을 입력한 후 등록 요청을 보냅니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
                <Label htmlFor="url" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <MessageSquareText className="w-4 h-4 text-orange-500" />
                  <span>전자결재 URL</span>
                </Label>
                <Input 
                  id="url" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="예: https://gw.speedrack.kr/app/approval/document/77428?page=0&offset=20&property=draftedAt&direction=desc&searchtype=&keyword=&fromDate=&toDate=&duration=all"
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
                등록 요청
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ItemRegistration
