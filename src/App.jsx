import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaStar, FaRegStar, FaBell, FaSearch, FaChartLine, FaBitcoin, FaEthereum, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'
import AlertModal from './components/AlertModal'

function App() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites')
    return saved ? JSON.parse(saved) : []
  })

  // 정렬 상태: 기본 거래금액(accTradeValue) 내림차순(desc)
  const [sortConfig, setSortConfig] = useState({ key: 'accTradeValue', direction: 'desc' })

  // 알림 상태
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('alerts')
    return saved ? JSON.parse(saved) : {}
  })

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState(null)

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  const fetchCoins = async () => {
    try {
      const response = await axios.get('https://api.bithumb.com/public/ticker/ALL_KRW')
      if (response.data.status === '0000') {
        const data = response.data.data
        const coinList = Object.keys(data)
          .filter(key => key !== 'date')
          .map(key => ({
            symbol: key,
            name: key,
            price: parseFloat(data[key].closing_price),
            changeRate: parseFloat(data[key].fluctate_rate_24H),
            volume: parseFloat(data[key].units_traded_24H),
            accTradeValue: parseFloat(data[key].acc_trade_value_24H)
          }))
        
        // 여기서는 정렬하지 않고 원본 리스트만 갱신 (정렬은 렌더링 시점에 수행)
        setCoins(coinList)
        checkAlerts(coinList)
      }
    } catch (error) {
      console.error("Error fetching coin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkAlerts = (currentCoins) => {
    const newAlerts = { ...alerts }
    let alertsUpdated = false

    currentCoins.forEach(coin => {
      const alert = alerts[coin.symbol]
      if (alert) {
        const price = coin.price
        const target = alert.targetPrice
        let triggered = false

        if (alert.condition === 'gte' && price >= target) {
          triggered = true
        } else if (alert.condition === 'lte' && price <= target) {
          triggered = true
        }

        if (triggered) {
          if (Notification.permission === 'granted') {
            new Notification(`🔔 ${coin.symbol} 목표가 도달!`, {
              body: `현재가: ${new Intl.NumberFormat('ko-KR').format(price)}원 (목표: ${alert.condition === 'gte' ? '이상' : '이하'} ${new Intl.NumberFormat('ko-KR').format(target)}원)`,
            })
          }
          delete newAlerts[coin.symbol]
          alertsUpdated = true
        }
      }
    })

    if (alertsUpdated) {
      setAlerts(newAlerts)
    }
  }

  useEffect(() => {
    fetchCoins()
    const interval = setInterval(fetchCoins, 3000)
    return () => clearInterval(interval)
  }, [alerts])

  useEffect(() => {
    localStorage.setItem('alerts', JSON.stringify(alerts))
  }, [alerts])

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  // 정렬 핸들러
  const handleSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const toggleFavorite = (symbol) => {
    setFavorites(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    )
  }

  const handleSaveAlert = (symbol, targetPrice, condition) => {
    setAlerts(prev => ({
      ...prev,
      [symbol]: { targetPrice, condition }
    }))
  }

  const handleDeleteAlert = (symbol) => {
    setAlerts(prev => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
  }

  const openAlertModal = (coin) => {
    setSelectedCoin(coin)
    setModalOpen(true)
  }

  // 필터링 및 정렬 로직 적용
  const getProcessedCoins = () => {
    // 1. 필터링
    let filtered = coins.filter(coin => {
      const matchesSearch = coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFavorite = showFavorites ? favorites.includes(coin.symbol) : true
      return matchesSearch && matchesFavorite
    })

    // 2. 정렬
    return filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  const sortedCoins = getProcessedCoins()

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  // 정렬 아이콘 렌더링 헬퍼
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <FaSort className="text-gray-300 ml-1" />
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="text-blue-600 ml-1" /> 
      : <FaSortDown className="text-blue-600 ml-1" />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AlertModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        coin={selectedCoin}
        currentAlert={selectedCoin ? alerts[selectedCoin.symbol] : null}
        onSave={handleSaveAlert}
        onDelete={handleDeleteAlert}
      />

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaChartLine className="text-blue-600 text-2xl" />
            <h1 className="text-xl font-bold tracking-tight">CoinWatch</h1>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FaSearch />
              </span>
              <input 
                type="text" 
                placeholder="코인 심볼 검색 (예: BTC)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setShowFavorites(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!showFavorites ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              전체 코인
            </button>
            <button 
              onClick={() => setShowFavorites(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${showFavorites ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              관심 목록
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        {loading && coins.length === 0 ? (
          <div className="text-center py-20 text-gray-500">데이터를 불러오는 중...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center"></th>
                    
                    {/* 정렬 가능한 헤더들 */}
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('symbol')}
                    >
                      <div className="flex items-center">
                        코인명 {renderSortIcon('symbol')}
                      </div>
                    </th>
                    
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group text-right"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center justify-end">
                        현재가 (KRW) {renderSortIcon('price')}
                      </div>
                    </th>
                    
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group text-right"
                      onClick={() => handleSort('changeRate')}
                    >
                      <div className="flex items-center justify-end">
                        전일대비 {renderSortIcon('changeRate')}
                      </div>
                    </th>
                    
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group text-right hidden md:table-cell"
                      onClick={() => handleSort('accTradeValue')}
                    >
                      <div className="flex items-center justify-end">
                        거래금액 (24H) {renderSortIcon('accTradeValue')}
                      </div>
                    </th>
                    
                    <th className="px-6 py-4 w-24 text-center">알림</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {sortedCoins.map(coin => (
                    <tr key={coin.symbol} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleFavorite(coin.symbol)}
                          className={`transition-colors ${favorites.includes(coin.symbol) ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          {favorites.includes(coin.symbol) ? <FaStar /> : <FaRegStar />}
                        </button>
                      </td>
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${coin.symbol === 'BTC' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                          {coin.symbol === 'BTC' ? <FaBitcoin className="text-orange-500" /> : <FaEthereum className="text-blue-500" />}
                        </div>
                        <div>
                          <div className="font-bold">{coin.symbol}</div>
                          <div className="text-xs text-gray-400">{coin.symbol}/KRW</div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-semibold ${coin.changeRate > 0 ? 'text-red-500' : coin.changeRate < 0 ? 'text-blue-500' : ''}`}>
                        {formatNumber(coin.price)} <span className="text-xs">원</span>
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${coin.changeRate > 0 ? 'text-red-500' : coin.changeRate < 0 ? 'text-blue-500' : ''}`}>
                        {coin.changeRate > 0 ? '+' : ''}{coin.changeRate}%
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 hidden md:table-cell font-mono">
                        {formatNumber(Math.floor(coin.accTradeValue / 1000000))}M
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => openAlertModal(coin)}
                          className={`transition-colors ${alerts[coin.symbol] ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                        >
                          <FaBell />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App