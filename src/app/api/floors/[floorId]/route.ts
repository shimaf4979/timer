// app/api/floors/[floorId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// エリアを削除
export async function DELETE(
  _request: NextRequest,
  context: { params: { floorId: string } }
) {
  const session = await auth();
  const { floorId } = await context.params;
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // エリアが存在するか確認
    const { data: floor, error: floorError } = await supabaseAdmin
      .from('floors')
      .select('id, map_id')
      .eq('id', floorId)
      .single();

    if (floorError || !floor) {
      return NextResponse.json(
        { error: 'エリアが見つかりません' },
        { status: 404 }
      );
    }

    // マップの所有者を確認
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('user_id')
      .eq('id', floor.map_id)
      .single();

    if (mapError || !map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    if (map.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'このエリアを削除する権限がありません' },
        { status: 403 }
      );
    }

    // エリアの削除（カスケード削除設定により、関連するピンも削除される）
    const { error } = await supabaseAdmin
      .from('floors')
      .delete()
      .eq('id', floorId);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: 'エリアが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('エリア削除エラー:', error);
    return NextResponse.json(
      { error: 'エリアの削除に失敗しました' },
      { status: 500 }
    );
  }
}