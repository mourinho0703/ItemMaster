import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { History, Download, Check, X, Trash2, ExternalLink, Link2, Copy, Send, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

// 관리자 이메일
const ADMIN_EMAIL = 'chomingi73@speedrack.kr'

// Power Automate HTTP 트리거 URL (품목 등록)
const PA_ITEM_REG_URL = 'https://default3861c9f3927b43229bc9de9fa0ec2c.bc.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6a4b998f9816427a80db748dfbf3adc3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=nyQV3AH9ET6qqjKx_cvJHbf8KoDOQd71CxLmNldANDw'

// 진행상태 상수 (B안)
const PROGRESS = {
  REVIEWING: '검토 중',      // 요청 생성 시 (승인 대기)
  PENDING_REG: '등록 대기',   // 승인됨 (등록 대기)
  REGISTERING: 'ERP 등록 중', // PA 데스크탑 흐름 실행 중
  COMPLETED: '등록 완료',     // 등록 완료
  REJECTED: '반려',           // 반려됨
} as const

type ItemRequest = {
  id: number
  created_at: string
  requestno: number
  itemname: string
  itemno: string
  itemspec: string
  itemlargeclass: string
  itemmediumclass: string
  itemsmallclass: string
  internal_external: string
  manageddept: string
  managedwarehouse: string
  supplier: string
  process: string
  workcenter: string
  releasedate: string
  weight: number
  type: string
  dept: string
  user: string
  url: string
  progress: string
}

type BomData = {
  id: number
  requestno: number
  parent_itemname: string
  parent_itemno: string
  parent_spec: string
  child_itemname: string
  child_itemno: string
  child_spec: string
  qty: number
}

// 모품목별 그룹화된 BOM 타입
type GroupedBom = {
  parent_itemname: string
  parent_itemno: string
  parent_spec: string
  children: {
    child_itemname: string
    child_itemno: string
    child_spec: string
    qty: number
  }[]
}

export const ItemRegistrationHistory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [historyData, setHistoryData] = useState<ItemRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ItemRequest | null>(null)
  const [allRequestItems, setAllRequestItems] = useState<ItemRequest[]>([])
  const [bomData, setBomData] = useState<BomData[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)
  const [isErpLoading, setIsErpLoading] = useState(false)

  // 관리자 여부 확인
  const isAdmin = useMemo(() => {
    return currentUserEmail === ADMIN_EMAIL
  }, [currentUserEmail])

  // BOM 데이터를 모품목별로 그룹화
  const groupedBomData = useMemo((): GroupedBom[] => {
    const grouped = new Map<string, GroupedBom>()
    
    for (const bom of bomData) {
      const parentKey = `${bom.parent_itemno}-${bom.parent_itemname}`
      
      if (!grouped.has(parentKey)) {
        grouped.set(parentKey, {
          parent_itemname: bom.parent_itemname,
          parent_itemno: bom.parent_itemno,
          parent_spec: bom.parent_spec,
          children: []
        })
      }
      
      grouped.get(parentKey)!.children.push({
        child_itemname: bom.child_itemname,
        child_itemno: bom.child_itemno,
        child_spec: bom.child_spec,
        qty: bom.qty
      })
    }
    
    return Array.from(grouped.values())
  }, [bomData])

  const uniqueHistoryData = useMemo(() => {
    const latestByRequestNo = new Map<number, ItemRequest>()
    for (const row of historyData) {
      const existing = latestByRequestNo.get(row.requestno)
      if (!existing) {
        latestByRequestNo.set(row.requestno, row)
      } else {
        const existingTime = new Date(existing.created_at).getTime() || 0
        const currentTime = new Date(row.created_at).getTime() || 0
        if (currentTime > existingTime) {
          latestByRequestNo.set(row.requestno, row)
        }
      }
    }
    return Array.from(latestByRequestNo.values()).sort((a, b) => b.requestno - a.requestno)
  }, [historyData])

  useEffect(() => {
    fetchHistory()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserEmail(session?.user?.email || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // URL 파라미터에서 requestno가 있으면 자동으로 해당 상세 열기
  useEffect(() => {
    const requestnoParam = searchParams.get('requestno')
    if (requestnoParam && historyData.length > 0) {
      const targetRequest = historyData.find(r => r.requestno === parseInt(requestnoParam))
      if (targetRequest) {
        handleRowClick(targetRequest)
        setSearchParams({})
      }
    }
  }, [historyData, searchParams])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const allData: ItemRequest[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase.from('tblItemregRequest')
        .select('*')
        .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1)
      
      if (error) throw error
        
        if (data && data.length > 0) {
          allData.push(...data)
          from += pageSize
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }

      setHistoryData(allData)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case '제품':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">제품</Badge>
      case '반제품':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">반제품</Badge>
      case '원자재':
        return <Badge className="bg-green-100 text-green-800 border-green-300">원자재</Badge>
      case '부자재':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">부자재</Badge>
      case '소모품':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">소모품</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getStatusBadge = (progress: string) => {
    switch (progress) {
      case PROGRESS.REVIEWING:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">검토 중</Badge>
      case PROGRESS.PENDING_REG:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">등록 대기</Badge>
      case PROGRESS.REGISTERING:
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">ERP 등록 중</Badge>
      case PROGRESS.COMPLETED:
        return <Badge className="bg-green-100 text-green-800 border-green-300">등록 완료</Badge>
      case PROGRESS.REJECTED:
        return <Badge className="bg-red-100 text-red-800 border-red-300">반려</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">{progress || '검토 중'}</Badge>
    }
  }

  const handleRowClick = async (request: ItemRequest) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)

    // 해당 requestno의 모든 품목 데이터 조회
    try {
      const { data, error } = await supabase.from('tblItemregRequest')
        .select('*')
        .eq('requestno', request.requestno)
        .order('id', { ascending: true })

      if (error) throw error
      setAllRequestItems(data || [])
    } catch (err) {
      console.error('품목 데이터 조회 실패:', err)
      setAllRequestItems([])
    }

    // BOM 데이터 조회 (제품/반제품인 경우)
    if (request.type === '제품' || request.type === '반제품') {
      try {
        const { data, error } = await supabase.from('itemrequest_bom')
          .select('*')
          .eq('requestno', request.requestno)
          .order('id', { ascending: true })
        
        if (error) throw error
        setBomData(data || [])
      } catch (err) {
        console.error('BOM 데이터 조회 실패:', err)
        setBomData([])
      }
    } else {
      setBomData([])
    }
  }

  const handleDownloadExcel = async () => {
    if (!selectedRequest || allRequestItems.length === 0) {
        alert('다운로드할 데이터가 없습니다.')
        return
      }

    try {
      // 시트1: 품목 데이터
      const itemExcelData = allRequestItems.map(item => ({
        '품명': item.itemname,
        '품번': item.itemno,
        '규격': item.itemspec,
        '품목대분류': item.itemlargeclass,
        '품목중분류': item.itemmediumclass,
        '품목소분류': item.itemsmallclass,
        '내외자': item.internal_external,
        '관리부서': item.manageddept,
        '관리창고': item.managedwarehouse,
        '구매처': item.supplier,
        '공정': item.process,
        '공정 워크센터': item.workcenter,
        '출시일자(YYYY-MM-DD)': item.releasedate,
        '중량(KG)': item.weight,
      }))

      const workbook = XLSX.utils.book_new()
      const itemSheet = XLSX.utils.json_to_sheet(itemExcelData)
      XLSX.utils.book_append_sheet(workbook, itemSheet, '품목')

      // 시트2: BOM 데이터 (제품/반제품인 경우)
      if (bomData.length > 0) {
        const bomExcelData = bomData.map(bom => ({
          '모품명': bom.parent_itemname,
          '모품번': bom.parent_itemno,
          '모규격': bom.parent_spec,
          '하위품명': bom.child_itemname,
          '하위품번': bom.child_itemno,
          '하위규격': bom.child_spec,
          '소요량': bom.qty,
        }))
        const bomSheet = XLSX.utils.json_to_sheet(bomExcelData)
        XLSX.utils.book_append_sheet(workbook, bomSheet, 'BOM')
      }

      XLSX.writeFile(workbook, `품목등록요청_${selectedRequest.requestno}_${selectedRequest.type}.xlsx`)
    } catch (err) {
      console.error('엑셀 다운로드 실패:', err)
      alert('엑셀 다운로드에 실패했습니다.')
    }
  }

  const handleApproveRequest = async () => {
    if (!selectedRequest) return

    try {
      if (!confirm(`요청번호 ${selectedRequest.requestno}를 승인하시겠습니까?`)) {
        return
      }

      // tblItemregRequest 업데이트 - progress를 '등록 대기'로
      const { error: itemError } = await supabase.from('tblItemregRequest')
        .update({ progress: PROGRESS.PENDING_REG })
        .eq('requestno', selectedRequest.requestno)

      if (itemError) {
        console.error('품목 승인 처리 오류:', itemError)
        alert(`승인 처리 실패: ${itemError.message}`)
        return
      }

      alert('요청이 승인되었습니다. (진행상태: 등록 대기)')
      await fetchHistory()
      setIsDialogOpen(false)
      setSelectedRequest(null)

    } catch (err) {
      console.error('요청 승인 실패:', err)
      alert(`요청 승인 실패: ${err}`)
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest) return

    try {
      if (!confirm(`요청번호 ${selectedRequest.requestno}를 반려하시겠습니까?`)) {
        return
      }

      const { error: itemError } = await supabase.from('tblItemregRequest')
        .update({ progress: PROGRESS.REJECTED })
        .eq('requestno', selectedRequest.requestno)

      if (itemError) {
        console.error('반려 처리 오류:', itemError)
        alert(`반려 처리 실패: ${itemError.message}`)
        return
      }

      alert('요청이 반려되었습니다.')
      await fetchHistory()
      setIsDialogOpen(false)
      setSelectedRequest(null)

    } catch (err) {
      console.error('요청 반려 실패:', err)
      alert(`요청 반려 실패: ${err}`)
    }
  }

  // ERP 등록 처리 (Power Automate 호출 + progress 변경)
  const handleErpRegister = async () => {
    if (!selectedRequest) return

    try {
      if (!confirm(`요청번호 ${selectedRequest.requestno}를 ERP에 등록 요청하시겠습니까?`)) {
        return
      }

      setIsErpLoading(true)

      // DB 상태를 "ERP 등록 중"으로 먼저 변경
      const { error: regError } = await supabase.from('tblItemregRequest')
        .update({ progress: PROGRESS.REGISTERING })
        .eq('requestno', selectedRequest.requestno)

      if (regError) {
        alert(`상태 업데이트 실패: ${regError.message}`)
        setIsErpLoading(false)
        return
      }

      setSelectedRequest({ ...selectedRequest, progress: PROGRESS.REGISTERING })
      await fetchHistory()

      // Power Automate 호출 (데스크탑 흐름 완료 응답까지 대기, 5분 타임아웃)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

      try {
        const response = await fetch(PA_ITEM_REG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestno: selectedRequest.requestno,
            requestType: selectedRequest.type,
            dept: selectedRequest.dept,
            userName: selectedRequest.user,
            progress: PROGRESS.COMPLETED,
            items: allRequestItems.map(item => ({
              itemname: item.itemname ?? '',
              itemno: item.itemno ?? '',
              itemspec: item.itemspec ?? '',
              itemlargeclass: item.itemlargeclass ?? '',
              itemmediumclass: item.itemmediumclass ?? '',
              itemsmallclass: item.itemsmallclass ?? '',
              internal_external: item.internal_external ?? '',
              manageddept: item.manageddept ?? '',
              managedwarehouse: item.managedwarehouse ?? '',
              supplier: item.supplier ?? '',
              process: item.process ?? '',
              workcenter: item.workcenter ?? '',
              releasedate: item.releasedate ?? '',
              weight: item.weight ?? 0,
            })),
            bomItems: bomData.map(bom => ({
              parent_itemname: bom.parent_itemname ?? '',
              parent_itemno: bom.parent_itemno ?? '',
              parent_spec: bom.parent_spec ?? '',
              child_itemname: bom.child_itemname ?? '',
              child_itemno: bom.child_itemno ?? '',
              child_spec: bom.child_spec ?? '',
              qty: bom.qty ?? 0,
            })),
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        if (result.status !== 'success') {
          throw new Error(result.message || 'ERP 등록 실패')
        }
      } catch (paErr: any) {
        clearTimeout(timeoutId)
        console.error('Power Automate 호출 실패:', paErr)

        const errMsg = paErr?.name === 'AbortError'
          ? 'ERP 등록 실패: 응답 대기 시간 초과 (5분)'
          : `ERP 등록 실패: ${paErr?.message || paErr}`

        alert(errMsg)
        await supabase.from('tblItemregRequest')
          .update({ progress: PROGRESS.PENDING_REG })
          .eq('requestno', selectedRequest.requestno)
        setSelectedRequest({ ...selectedRequest, progress: PROGRESS.PENDING_REG })
        await fetchHistory()
        setIsErpLoading(false)
        return
      }

      // 데스크탑 흐름 완료 → DB "등록 완료"로 변경
      const { error } = await supabase.from('tblItemregRequest')
        .update({ progress: PROGRESS.COMPLETED })
        .eq('requestno', selectedRequest.requestno)

      if (error) {
        alert(`ERP 등록은 완료되었으나 상태 업데이트 실패: ${error.message}`)
        setIsErpLoading(false)
        return
      }

      alert('ERP 등록이 완료되었습니다.')
      await fetchHistory()
      setIsDialogOpen(false)
      setSelectedRequest(null)

    } catch (err) {
      console.error('ERP 등록 실패:', err)
      alert(`ERP 등록 실패: ${err}`)
    } finally {
      setIsErpLoading(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return

    try {
      if (!confirm(`요청번호 ${selectedRequest.requestno}를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        return
      }

      // BOM 먼저 삭제 (FK 제약 있을 수 있음)
      if (selectedRequest.type === '제품' || selectedRequest.type === '반제품') {
        const { error: bomError } = await supabase.from('itemrequest_bom')
          .delete()
          .eq('requestno', selectedRequest.requestno)
        
        if (bomError) {
          console.warn('BOM 삭제 경고:', bomError)
        }
      }

      const { error: itemError } = await supabase.from('tblItemregRequest')
        .delete()
        .eq('requestno', selectedRequest.requestno)

      if (itemError) {
        console.error('삭제 처리 오류:', itemError)
        alert(`삭제 처리 실패: ${itemError.message}`)
        return
      }

      alert('요청이 삭제되었습니다.')
      await fetchHistory()
      setIsDialogOpen(false)
      setSelectedRequest(null)

    } catch (err) {
      console.error('요청 삭제 실패:', err)
      alert(`요청 삭제 실패: ${err}`)
    }
  }

  // 공유 URL 복사
  const handleCopyShareUrl = () => {
    if (!selectedRequest) return
    
    const baseUrl = window.location.origin + window.location.pathname
    const shareUrl = `${baseUrl}?requestno=${selectedRequest.requestno}`
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    }).catch(err => {
      console.error('URL 복사 실패:', err)
      // 클립보드 API 실패 시 prompt로 대체
      prompt('아래 URL을 복사하세요:', shareUrl)
    })
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">품목 등록 요청내역</h1>
          {isAdmin && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
              관리자 모드
            </Badge>
          )}
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow">
          <History className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
              총 {uniqueHistoryData.length}건
            </span>
          </div>
        </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
                <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">요청번호</TableHead>
                      <TableHead className="font-semibold">요청일시</TableHead>
                  <TableHead className="font-semibold">타입</TableHead>
                      <TableHead className="font-semibold">부서</TableHead>
                      <TableHead className="font-semibold">담당자</TableHead>
                  <TableHead className="font-semibold">결재문서</TableHead>
                      <TableHead className="font-semibold">진행상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : uniqueHistoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      등록된 요청이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  uniqueHistoryData.map((request) => (
                      <TableRow 
                      key={request.requestno}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => handleRowClick(request)}
                      >
                      <TableCell className="font-medium">{request.requestno}</TableCell>
                      <TableCell>
                          {new Date(request.created_at).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {getItemTypeBadge(request.type)}
                        </TableCell>
                      <TableCell>{request.dept}</TableCell>
                      <TableCell>{request.user}</TableCell>
                      <TableCell>
                        {request.url ? (
                          <a 
                            href={request.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            결재문서
                          </a>
                        ) : '-'}
                        </TableCell>
                        <TableCell>
                        {getStatusBadge(request.progress)}
                        </TableCell>
                      </TableRow>
                  ))
                )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
        </Card>

      {/* 상세 팝업 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              <span>품목 등록 요청 상세</span>
              {selectedRequest && (
                <span className="ml-3">
                  {getItemTypeBadge(selectedRequest.type)}
                  <span className="ml-2">{getStatusBadge(selectedRequest.progress)}</span>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* 상단 버튼 영역 */}
              <div className="flex justify-end gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                <Button 
                  variant="outline" 
                  className={urlCopied ? "bg-green-100 border-green-400 text-green-700" : ""}
                  onClick={handleCopyShareUrl}
                >
                  {urlCopied ? (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      복사 완료!
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      공유 URL 복사
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadExcel}
                >
                  <Download className="w-4 h-4 mr-2" />
                  요청파일 다운로드
                </Button>
                
                {/* 관리자 전용 버튼들 - 검토 중 상태일 때만 승인/반려 가능 */}
                {isAdmin && selectedRequest.progress === PROGRESS.REVIEWING && (
                  <>
                    <Button 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      onClick={handleApproveRequest}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      요청 승인
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={handleRejectRequest}
                    >
                      <X className="w-4 h-4 mr-2" />
                      요청 반려
                    </Button>
                  </>
                )}

                {/* 등록 대기 → ERP 등록 */}
                {isAdmin && selectedRequest.progress === PROGRESS.PENDING_REG && (
                  <Button 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    onClick={handleErpRegister}
                    disabled={isErpLoading}
                  >
                    {isErpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ERP 등록 중...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        ERP 등록
                      </>
                    )}
                  </Button>
                )}
                
                {isAdmin && (
                  <Button 
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={handleDeleteRequest}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                )}
              </div>

              {/* 요청 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">요청번호</p>
                  <p className="font-semibold">{selectedRequest.requestno}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">요청일시</p>
                  <p className="font-semibold">{new Date(selectedRequest.created_at).toLocaleString('ko-KR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">부서</p>
                  <p className="font-semibold">{selectedRequest.dept}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">담당자</p>
                  <p className="font-semibold">{selectedRequest.user}</p>
                </div>
                <div className="md:col-span-4">
                  <p className="text-sm text-gray-500">전자결재 URL</p>
                  {selectedRequest.url ? (
                    <a 
                      href={selectedRequest.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {selectedRequest.url}
                    </a>
                  ) : (
                    <p className="font-semibold text-gray-400">-</p>
                  )}
                </div>
              </div>

              {/* 품목 정보 - 모든 품목 표시 */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-700">
                  품목 정보 
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (총 {allRequestItems.length}건)
                  </span>
                </h3>
                <div className="border rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0">
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>품명</TableHead>
                        <TableHead>품번</TableHead>
                        <TableHead>규격</TableHead>
                        <TableHead>분류</TableHead>
                        <TableHead>관리부서</TableHead>
                        <TableHead>관리창고</TableHead>
                        <TableHead>구매처</TableHead>
                        <TableHead>공정</TableHead>
                        <TableHead>출시일자</TableHead>
                        <TableHead>중량(KG)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequestItems.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={11} className="text-center text-gray-400 py-8">
                            등록된 품목 정보가 없습니다.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allRequestItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm text-gray-600">{index + 1}</TableCell>
                            <TableCell>{item.itemname || '-'}</TableCell>
                            <TableCell>{item.itemno || '-'}</TableCell>
                            <TableCell>{item.itemspec || '-'}</TableCell>
                            <TableCell>
                              {[item.itemlargeclass, item.itemmediumclass, item.itemsmallclass]
                                .filter(Boolean).join(' > ') || '-'}
                            </TableCell>
                            <TableCell>{item.manageddept || '-'}</TableCell>
                            <TableCell>{item.managedwarehouse || '-'}</TableCell>
                            <TableCell>{item.supplier || '-'}</TableCell>
                            <TableCell>{item.process || '-'}</TableCell>
                            <TableCell>{item.releasedate || '-'}</TableCell>
                            <TableCell>{item.weight?.toLocaleString() || '-'}</TableCell>
                      </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* BOM 정보 (제품/반제품인 경우) */}
              {(selectedRequest.type === '제품' || selectedRequest.type === '반제품') && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-700">
                    BOM 정보 
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (모품목 {groupedBomData.length}건)
                    </span>
                  </h3>
                  
                  {groupedBomData.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                      등록된 BOM 정보가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                      {groupedBomData.map((group, idx) => (
                        <div key={idx} className="border rounded-lg overflow-hidden">
                          {/* 모품목 헤더 */}
                          <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-600 text-white">모품목</Badge>
                              <span className="font-semibold text-gray-800">
                                {group.parent_itemname}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({group.parent_itemno})
                              </span>
                              {group.parent_spec && (
                                <span className="text-sm text-gray-400">
                                  | {group.parent_spec}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* 하위품목 테이블 */}
                          <Table>
                            <TableHeader className="bg-blue-50">
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>하위품명</TableHead>
                                <TableHead>하위품번</TableHead>
                                <TableHead>하위규격</TableHead>
                                <TableHead className="text-right">소요량</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.children.map((child, childIdx) => (
                                <TableRow key={childIdx} className="hover:bg-blue-50/50">
                                  <TableCell className="text-center text-blue-500">•</TableCell>
                                  <TableCell className="font-medium">{child.child_itemname || '-'}</TableCell>
                                  <TableCell>{child.child_itemno || '-'}</TableCell>
                                  <TableCell>{child.child_spec || '-'}</TableCell>
                                  <TableCell className="text-right font-semibold text-blue-600">
                                    {child.qty?.toLocaleString() || '0'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ItemRegistrationHistory
