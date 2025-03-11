// app/api/floors/[floorId]/route.ts - フロア削除API修正版
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// エリアを削除 - 完全修正版
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ floorId: string }> }
) {
  const session = await auth();
  const { floorId } = await context.params;
  
  // ログ出力（デバッグ用）
  console.log('DELETE /api/floors/[floorId] API called for floor:', floorId, 'by user:', session?.user?.id);
  
  if (!session?.user) {
    console.log('DELETE API error: 認証が必要です');
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // エリアの存在確認
    const { data: floor, error: floorError } = await supabaseAdmin
      .from('floors')
      .select('id, map_id')
      .eq('id', floorId)
      .single();

    if (floorError) {
      console.log('DELETE API error (floor fetch):', floorError);
      // エリアが見つからない場合は204を返す（べき等性を保つ）
      if (floorError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'エリアはすでに削除されています' },
          { status: 204 }
        );
      }
      throw floorError;
    }

    if (!floor) {
      console.log('DELETE API error: エリアが見つかりません');
      // エリアが見つからない場合は204を返す（べき等性を保つ）
      return NextResponse.json(
        { message: 'エリアはすでに削除されています' },
        { status: 204 }
      );
    }

    // マップの所有者を確認
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('user_id')
      .eq('id', floor.map_id)
      .single();

    if (mapError) {
      console.log('DELETE API error (map fetch):', mapError);
      throw mapError;
    }

    if (!map) {
      console.log('DELETE API error: マップが見つかりません');
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    // 所有者または管理者の場合のみ削除可能
    if (map.user_id !== session.user.id && session.user.role !== 'admin') {
      console.log('DELETE API error: 権限がありません', {
        mapUserId: map.user_id, 
        sessionUserId: session.user.id,
        role: session.user.role
      });
      return NextResponse.json(
        { error: 'このエリアを削除する権限がありません' },
        { status: 403 }
      );
    }

    // 関連ピンを最初に削除
    console.log('関連ピンを削除します...');
    const { error: deletePinsError } = await supabaseAdmin
      .from('pins')
      .delete()
      .eq('floor_id', floorId);

    if (deletePinsError) {
      console.log('DELETE API error (pins delete):', deletePinsError);
      // ピン削除の失敗はフロア削除の失敗とします
      throw deletePinsError;
    }

    // エリアの削除処理
    console.log('エリアを削除します...');
    const { error: deleteError } = await supabaseAdmin
      .from('floors')
      .delete()
      .eq('id', floorId);

    if (deleteError) {
      console.log('DELETE API error (floor delete):', deleteError);
      throw deleteError;
    }

    console.log('DELETE API success for floor:', floorId);
    return NextResponse.json(
      { message: 'エリアが正常に削除されました', id: floorId },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE API unexpected error:', error);
    return NextResponse.json(
      { error: 'エリアの削除に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}