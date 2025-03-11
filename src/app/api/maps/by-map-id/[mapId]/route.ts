// app/api/maps/by-map-id/[mapId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// map_idからマップを削除するエンドポイント
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ mapId: string }> }
) {
  const session = await auth();
  const { mapId } = await context.params;
  
  console.log('DELETE /api/maps/by-map-id/[mapId] called with map_id:', mapId);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // map_idからマップを検索
    const { data: existingMap, error: getError } = await supabaseAdmin
      .from('maps')
      .select('id, user_id')
      .eq('map_id', mapId)
      .single();

    if (getError) {
      console.error('Map lookup error:', getError);
      
      // 404エラーの場合、すでに削除されているとみなして成功を返す
      if (getError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'マップはすでに削除されています' },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    if (!existingMap) {
      return NextResponse.json(
        { message: 'マップはすでに削除されています' },
        { status: 200 }
      );
    }

    // マップの所有者確認
    if (existingMap.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'このマップを削除する権限がありません' },
        { status: 403 }
      );
    }

    // マップの削除（カスケード削除設定により、関連するエリアとピンも削除される）
    const { error } = await supabaseAdmin
      .from('maps')
      .delete()
      .eq('id', existingMap.id);

    if (error) {
      console.error('Map delete error:', error);
      throw error;
    }

    return NextResponse.json(
      { message: 'マップが正常に削除されました', id: existingMap.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('マップ削除エラー:', error);
    return NextResponse.json(
      { error: 'マップの削除に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}