import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { History, Download, Check, X, Trash2, Link2, Copy, ChevronDown, ChevronRight, Send, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

// 관리자 이메일
const ADMIN_EMAIL = 'chomingi73@speedrack.kr'

// Power Automate HTTP 트리거 URL (BOM 수정 승인)
const PA_BOM_APPROVE_URL = 'https://default3861c9f3927b43229bc9de9fa0ec2c.bc.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/352d3dbe8b674abaa44484b107a0e81b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YXXLTJE9HVN1bthS5bXXxQHtjdaUhW-vWOuhMS7hJ4U'

// 진행상태 상수 (B안)
const PROGRESS = {
  REVIEWING: '검토 중',      // 요청 생성 시 (승인 대기)
  PENDING_REG: '등록 대기',   // 승인됨 (등록 대기)
  REGISTERING: 'ERP 등록 중', // PA 데스크탑 흐름 실행 중
  COMPLETED: '수정 완료',     // 수정 완료
  REJECTED: '반려',           // 반려됨
} as const

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
  progress: string
}

// 모품목별로 그룹화된 데이터 타입
type GroupedByParent = {
  itemname: string
  itemno: string
  itemspec: string
  items: BomModifyRequest[]
}

export const BomHistory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [historyData, setHistoryData] = useState<BomModifyRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<BomModifyRequest | null>(null)
  const [allRequestData, setAllRequestData] = useState<BomModifyRequest[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isErpLoading, setIsErpLoading] = useState(false)

  // 관리자 여부 확인
  const isAdmin = useMemo(() => {
    return currentUserEmail === ADMIN_EMAIL
  }, [currentUserEmail])

  // 모품목별 그룹화 memo
  const groupedData = useMemo((): GroupedByParent[] => {
    const grouped = new Map<string, GroupedByParent>()
    
    for (const item of allRequestData) {
      const parentKey = `${item.itemno}-${item.itemname}`
      
      if (!grouped.has(parentKey)) {
        grouped.set(parentKey, {
          itemname: item.itemname,
          itemno: item.itemno,
          itemspec: item.itemspec,
          items: []
        })
      }
      
      grouped.get(parentKey)!.items.push(item)
    }
    
    return Array.from(grouped.values())
  }, [allRequestData])

  const uniqueHistoryData = useMemo(() => {
    const latestByRequestNo = new Map<number, BomModifyRequest>()
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
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUserEmail(session?.user?.email || null)
      await fetchHistory()
    }
    init()

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
    setFetchError(null)
    try {
      const allData: BomModifyRequest[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase.from('MG_bommodifyrequest')
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
    } catch (err: any) {
      console.error('Failed to fetch history:', err)
      setFetchError(err?.message || String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'create':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">추가</Badge>
      case 'update':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">변경</Badge>
      case 'delete':
        return <Badge className="bg-red-100 text-red-800 border-red-300">삭제</Badge>
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
        return <Badge className="bg-green-100 text-green-800 border-green-300">수정 완료</Badge>
      case PROGRESS.REJECTED:
        return <Badge className="bg-red-100 text-red-800 border-red-300">반려</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">{progress || '검토 중'}</Badge>
    }
  }

  const handleRowClick = async (request: BomModifyRequest) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)
    setExpandedGroups(new Set()) // 팝업 열 때 모든 그룹 접기
    
    // 해당 요청번호의 모든 데이터 조회
    try {
      const allData: BomModifyRequest[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase.from('MG_bommodifyrequest')
          .select('*')
          .eq('requestno', request.requestno)
          .order('id', { ascending: true })
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

      setAllRequestData(allData)
    } catch (err) {
      console.error('요청 데이터 조회 실패:', err)
      setAllRequestData([])
    }
  }

  const handleDownloadExcel = async () => {
    if (!selectedRequest) return

    try {
      // 해당 requestno의 모든 데이터 조회
      const requestData: BomModifyRequest[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase.from('MG_bommodifyrequest')
          .select('*')
          .eq('requestno', selectedRequest.requestno)
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) throw error

        if (data && data.length > 0) {
          requestData.push(...data)
          from += pageSize
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }

      if (requestData.length === 0) {
        alert('다운로드할 데이터가 없습니다.')
        return
      }

      // 타입에 따른 컬럼 구성
      let excelData: any[] = []
      let headers: string[] = []

      if (selectedRequest.type === 'create') {
        headers = ['SET품명', 'SET품번', 'SET규격', '추가자재명', '추가자재번호', '추가자재규격', '소요량']
        excelData = requestData.map(row => ({
          'SET품명': row.itemname,
          'SET품번': row.itemno,
          'SET규격': row.itemspec,
          '추가자재명': row.newmatname,
          '추가자재번호': row.newmatno,
          '추가자재규격': row.newmatspec,
          '소요량': row.newmatqty,
        }))
      } else if (selectedRequest.type === 'update') {
        headers = ['SET품명', 'SET품번', 'SET규격', '변경전자재명', '변경전자재번호', '변경전자재규격', '변경전소요량', '변경후자재명', '변경후자재번호', '변경후자재규격', '변경후소요량']
        excelData = requestData.map(row => ({
          'SET품명': row.itemname,
          'SET품번': row.itemno,
          'SET규격': row.itemspec,
          '변경전자재명': row.delmatname,
          '변경전자재번호': row.delmatno,
          '변경전자재규격': row.delmatspec,
          '변경전소요량': row.delmatqty,
          '변경후자재명': row.newmatname,
          '변경후자재번호': row.newmatno,
          '변경후자재규격': row.newmatspec,
          '변경후소요량': row.newmatqty,
        }))
      } else if (selectedRequest.type === 'delete') {
        headers = ['SET품명', 'SET품번', 'SET규격', '삭제자재명', '삭제자재번호', '삭제자재규격', '소요량']
        excelData = requestData.map(row => ({
          'SET품명': row.itemname,
          'SET품번': row.itemno,
          'SET규격': row.itemspec,
          '삭제자재명': row.delmatname,
          '삭제자재번호': row.delmatno,
          '삭제자재규격': row.delmatspec,
          '소요량': row.delmatqty,
        }))
      }

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM수정요청')

      const typeLabel = selectedRequest.type === 'create' ? '추가' : selectedRequest.type === 'update' ? '변경' : '삭제'
      XLSX.writeFile(workbook, `BOM수정요청_${selectedRequest.requestno}_${typeLabel}.xlsx`)
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

      const { error } = await supabase.from('MG_bommodifyrequest')
        .update({ progress: PROGRESS.PENDING_REG })
        .eq('requestno', selectedRequest.requestno)

      if (error) {
        console.error('승인 처리 오류:', error)
        alert(`승인 처리 실패: ${error.message}`)
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

      const { error } = await supabase.from('MG_bommodifyrequest')
        .update({ progress: PROGRESS.REJECTED })
        .eq('requestno', selectedRequest.requestno)

      if (error) {
        console.error('반려 처리 오류:', error)
        alert(`반려 처리 실패: ${error.message}`)
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

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return

    try {
      if (!confirm(`요청번호 ${selectedRequest.requestno}를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        return
      }

      const { error } = await supabase.from('MG_bommodifyrequest')
        .delete()
        .eq('requestno', selectedRequest.requestno)

      if (error) {
        console.error('삭제 처리 오류:', error)
        alert(`삭제 처리 실패: ${error.message}`)
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

  // 그룹 펼침/접힘 토글
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  // 모든 그룹 펼치기/접기
  const toggleAllGroups = () => {
    if (expandedGroups.size === groupedData.length) {
      // 모두 펼쳐져 있으면 모두 접기
      setExpandedGroups(new Set())
    } else {
      // 모두 펼치기
      const allKeys = groupedData.map((_, idx) => `group-${idx}`)
      setExpandedGroups(new Set(allKeys))
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
      const { error: regError } = await supabase.from('MG_bommodifyrequest')
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
        const response = await fetch(PA_BOM_APPROVE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestno: selectedRequest.requestno,
            requestType: selectedRequest.type,
            dept: selectedRequest.dept,
            userName: selectedRequest.user,
            progress: PROGRESS.COMPLETED,
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
        await supabase.from('MG_bommodifyrequest')
          .update({ progress: PROGRESS.PENDING_REG })
          .eq('requestno', selectedRequest.requestno)
        setSelectedRequest({ ...selectedRequest, progress: PROGRESS.PENDING_REG })
        await fetchHistory()
        setIsErpLoading(false)
        return
      }

      // 데스크탑 흐름 완료 → DB "수정 완료"로 변경
      const { error } = await supabase.from('MG_bommodifyrequest')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BOM 수정 요청내역</h1>
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
                  <TableHead className="font-semibold">사유</TableHead>
                  <TableHead className="font-semibold">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : fetchError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-red-500 font-medium mb-2">데이터 조회 실패</div>
                      <div className="text-sm text-red-400">{fetchError}</div>
                      <Button variant="outline" size="sm" className="mt-3" onClick={fetchHistory}>
                        다시 시도
                      </Button>
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
                        {getRequestTypeBadge(request.type)}
                      </TableCell>
                      <TableCell>{request.dept}</TableCell>
                      <TableCell>{request.user}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
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
              <span>BOM 수정 요청 상세</span>
              {selectedRequest && (
                <span className="ml-3">
                  {getRequestTypeBadge(selectedRequest.type)}
                  <span className="ml-2">{getStatusBadge(selectedRequest.progress)}</span>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* 상단 버튼 영역 */}
              <div className="flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                {/* 좌측: 공유/다운로드 */}
                <div className="flex gap-2">
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
                </div>

                {/* 우측: 관리자 액션 */}
                {isAdmin && (
                  <div className="flex gap-2">
                    {/* 검토 중 → 승인/반려 */}
                    {selectedRequest.progress === PROGRESS.REVIEWING && (
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
                    {selectedRequest.progress === PROGRESS.PENDING_REG && (
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

                    <Button 
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleDeleteRequest}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </Button>
                  </div>
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
                  <p className="text-sm text-gray-500">사유</p>
                  <p className="font-semibold">{selectedRequest.reason || '-'}</p>
                </div>
              </div>

              {/* BOM 수정 내용 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-700">
                    수정 내용 
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      (모품목 {groupedData.length}건)
                    </span>
                  </h3>
                  {groupedData.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={toggleAllGroups}
                      className="text-xs"
                    >
                      {expandedGroups.size === groupedData.length ? '모두 접기' : '모두 펼치기'}
                    </Button>
                  )}
                </div>
                
                {groupedData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                    데이터를 불러오는 중...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {groupedData.map((group, idx) => {
                      const groupKey = `group-${idx}`
                      const isExpanded = expandedGroups.has(groupKey)
                      
                      return (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        {/* 모품목 헤더 - 클릭 가능 */}
                        <div 
                          className="bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-3 cursor-pointer hover:from-slate-200 hover:to-slate-300 transition-colors"
                          onClick={() => toggleGroup(groupKey)}
                        >
                          <div className="flex items-center gap-2">
                            {/* 펼침/접힘 아이콘 */}
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-600" />
                            )}
                            <Badge className="bg-slate-600 text-white">모품목</Badge>
                            <span className="font-semibold text-gray-800">
                              {group.itemname}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({group.itemno})
                            </span>
                            {group.itemspec && (
                              <span className="text-sm text-gray-400">
                                | {group.itemspec}
                              </span>
                            )}
                            {/* 하위 자재 수 표시 */}
                            <span className="ml-auto text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">
                              하위 자재 {group.items.length}건
                            </span>
                          </div>
                        </div>
                        
                        {/* 타입별 하위 자재 표시 - 펼쳤을 때만 */}
                        {isExpanded && selectedRequest?.type === 'create' && (
                          <Table>
                            <TableHeader className="bg-blue-50">
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>추가할 자재명</TableHead>
                                <TableHead>자재번호</TableHead>
                                <TableHead>규격</TableHead>
                                <TableHead className="text-right">소요량</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item, itemIdx) => (
                                <TableRow key={itemIdx} className="hover:bg-blue-50/50">
                                  <TableCell className="text-center text-blue-500 font-bold">+</TableCell>
                                  <TableCell className="font-medium text-blue-700">{item.newmatname || '-'}</TableCell>
                                  <TableCell>{item.newmatno || '-'}</TableCell>
                                  <TableCell>{item.newmatspec || '-'}</TableCell>
                                  <TableCell className="text-right font-semibold text-blue-600">
                                    {item.newmatqty?.toLocaleString() || '0'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        
                        {isExpanded && selectedRequest?.type === 'update' && (
                          <Table>
                            <TableHeader className="bg-orange-50">
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead colSpan={4} className="text-center border-r bg-red-50 text-red-700">변경 전</TableHead>
                                <TableHead colSpan={4} className="text-center bg-green-50 text-green-700">변경 후</TableHead>
                              </TableRow>
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead className="bg-red-50">자재명</TableHead>
                                <TableHead className="bg-red-50">자재번호</TableHead>
                                <TableHead className="bg-red-50">규격</TableHead>
                                <TableHead className="bg-red-50 text-right border-r">소요량</TableHead>
                                <TableHead className="bg-green-50">자재명</TableHead>
                                <TableHead className="bg-green-50">자재번호</TableHead>
                                <TableHead className="bg-green-50">규격</TableHead>
                                <TableHead className="bg-green-50 text-right">소요량</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item, itemIdx) => (
                                <TableRow key={itemIdx} className="hover:bg-orange-50/50">
                                  <TableCell className="text-center text-orange-500 font-bold">◆</TableCell>
                                  <TableCell className="text-red-600 line-through opacity-70">{item.delmatname || '-'}</TableCell>
                                  <TableCell className="text-red-600 line-through opacity-70">{item.delmatno || '-'}</TableCell>
                                  <TableCell className="text-red-600 line-through opacity-70">{item.delmatspec || '-'}</TableCell>
                                  <TableCell className="text-right text-red-600 line-through opacity-70 border-r">
                                    {item.delmatqty?.toLocaleString() || '0'}
                                  </TableCell>
                                  <TableCell className="font-medium text-green-700">{item.newmatname || '-'}</TableCell>
                                  <TableCell className="text-green-700">{item.newmatno || '-'}</TableCell>
                                  <TableCell className="text-green-700">{item.newmatspec || '-'}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    {item.newmatqty?.toLocaleString() || '0'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        
                        {isExpanded && selectedRequest?.type === 'delete' && (
                          <Table>
                            <TableHeader className="bg-red-50">
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>삭제할 자재명</TableHead>
                                <TableHead>자재번호</TableHead>
                                <TableHead>규격</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item, itemIdx) => (
                                <TableRow key={itemIdx} className="hover:bg-red-50/50">
                                  <TableCell className="text-center text-red-500 font-bold">✕</TableCell>
                                  <TableCell className="font-medium text-red-700 line-through">{item.delmatname || '-'}</TableCell>
                                  <TableCell className="text-red-600 line-through">{item.delmatno || '-'}</TableCell>
                                  <TableCell className="text-red-600 line-through">{item.delmatspec || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BomHistory
