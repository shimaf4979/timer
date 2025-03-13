"use client"

export default function RoadmapCalendar() {
  const months = ["6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月",]

  const calendarData = [
    {
      category: "技術",
      tasks: [
        { name: "向き・位置推定の実装", start: 0, end: 2 },
        { name: "AR機能の実装", start: 3, end: 5 },
        { name: "広告機能の実装", start: 1, end: 2 },
        { name: "最終調整", start: 6, end: 7 },
      ],
    },
    {
      category: "運用",
      tasks: [
        { name: "簡易版(現行)", start: 0, end: 1 },
        { name: "SasS版", start: 2, end: 6 },
        { name: "B2Bパッケージ", start: 5, end: 6 },
        { name: "デプロイ", start: 7, end: 7 },
      ],
    },
    {
      category: "その他",
      tasks: [
        { name: "ヒアリング", start: 0, end: 1 },
        { name: "屋内位置推定システムの実験", start: 0, end: 2 },
        { name: "B2Bパッケージの検討", start: 2, end: 4 },
      ],
    },
  ]

  // 各タスクが重なっている月を考慮し、正しく位置を決定
  const assignTaskLayers = (tasks: typeof calendarData[0]["tasks"]) => {
    const monthLayers = Array(9).fill(0).map(() => [false, false]) // 各月ごとに上下のレイヤー管理
    const layers: number[] = []

    tasks.forEach((task) => {
      let layer = 0
      // `start`〜`end`の月における空いているレイヤーを決定
      for (let i = task.start; i <= task.end; i++) {
        if (monthLayers[i][0]) {
          layer = 1
          break
        }
      }
      for (let i = task.start; i <= task.end; i++) {
        monthLayers[i][layer] = true
      }
      layers.push(layer)
    })

    return layers
  }

  return (
    <div className="font-sans p-6 bg-white rounded shadow-lg">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-sky-600">開発ロードマップ</h2>
      </div>

      <div className="border rounded overflow-hidden shadow-md relative">
        {/* 月ヘッダー */}
        <div className="grid" style={{ gridTemplateColumns: "100px repeat(9, 1fr)" }}>
          <div className="p-3 border-r border-b font-medium bg-sky-100"></div>
          {months.map((month, index) => (
            <div key={index} className="p-3 text-center border-r border-b font-medium bg-sky-100 text-sky-800">
              {month}
            </div>
          ))}
        </div>

        {/* 各カテゴリ行 */}
        {calendarData.map((row, rowIndex) => {
          const layers = assignTaskLayers(row.tasks)
          const rowHeight = 80
          const halfHeight = rowHeight / 2
          const paddingY = 4 // 見た目余白

          return (
            <div key={rowIndex} className="grid relative" style={{ gridTemplateColumns: "100px repeat(9, 1fr)", height: `${rowHeight}px` }}>
              <div className="p-3 border-r border-b font-bold bg-sky-50 flex justify-center items-center text-lg">{row.category}</div>

              {/* 月ごとのマス目 */}
              {Array.from({ length: 9 }).map((_, colIndex) => (
                <div key={colIndex} className="border-r border-b h-full relative" />
              ))}

 {/* タスクオーバーレイ */}
{row.tasks.map((task, taskIndex) => {
  const width = task.end - task.start + 1
  const cellWidth = 100 / 9
  const layer = layers[taskIndex]
  
  // ここの計算を見直す
// 修正後
const top = layer * halfHeight + paddingY
  const height = halfHeight - paddingY * 2

  return (
    <div
      key={taskIndex}
      className="absolute bg-sky-100 border border-sky-300 rounded-md px-2 text-xs shadow-sm text-sky-800 font-medium flex items-center justify-center text-center"
      style={{
        left: `calc(100px + ${task.start * cellWidth}%)`,
        top: `${top}px`,
        width: `calc(${width * cellWidth}% - 8px)`,
        height: `${height}px`,
        zIndex: 10,
      }}
    >
      {task.name}
    </div>
  )
})}
            </div>
          )
        })}
      </div>
    </div>
  )
}