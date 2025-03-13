export default function BudgetTable() {
    return (
      <div className="font-sans p-6 bg-white rounded shadow-lg">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-sky-600">プロジェクト予算</h2>
        </div>
  
        <div className="border rounded overflow-hidden shadow-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-sky-100">
                <th className="p-3 text-left font-medium text-sky-800 border-b border-r">項目</th>
                <th className="p-3 text-right font-medium text-sky-800 border-b">単価(円)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border-b border-r">サーバー費用</td>
                <td className="p-3 text-right border-b">50,000</td>
              </tr>
              <tr>
                <td className="p-3 border-b border-r">ドメイン取得・管理</td>
                <td className="p-3 text-right border-b">10,000</td>
              </tr>
              <tr>
                <td className="p-3 border-b border-r">開発ツール(デザインツール、API)</td>
                <td className="p-3 text-right border-b">50,000</td>
              </tr>
              <tr>
                <td className="p-3 border-b border-r">ヒアリング費用</td>
                <td className="p-3 text-right border-b">20,000</td>
              </tr>
              <tr>
                <td className="p-3 border-b border-r">BLEビーコン</td>
                <td className="p-3 text-right border-b">200,000</td>
              </tr>
              <tr className="bg-sky-50">
                <td className="p-3 font-bold border-r">合計</td>
                <td className="p-3 text-right font-bold">330,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }