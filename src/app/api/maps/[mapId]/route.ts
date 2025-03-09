// app/api/maps/[mapId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// 特定のマップを取得
export async function GET(
  _request: NextRequest,
  context: { params: { mapId: string } }
) {
  try {
    const { mapId } = await context.params;
    
    // マップ情報を取得
    const { data: map, error } = await supabaseAdmin
      .from('maps')
      .select('*')
      .eq('map_id', mapId)
      .single();

    if (error || !map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(map);
  } catch (error) {
    console.error('マップ取得エラー:', error);
    return NextResponse.json(
      { error: 'マップの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// マップを更新
export async function PATCH(
  request: NextRequest,
  context: { params: { mapId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // マップが存在し、ユーザーが所有しているか確認
    const { data: existingMap, error: getError } = await supabaseAdmin
      .from('maps')
      .select('id, user_id')
      .eq('map_id', context.params.mapId)
      .single();

    if (getError || !existingMap) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    // マップの所有者確認
    if (existingMap.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'このマップを編集する権限がありません' },
        { status: 403 }
      );
    }

    const { title, description } = await request.json();

    // マップの更新
    const { data: map, error } = await supabaseAdmin
      .from('maps')
      .update({
        title,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMap.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(map);
  } catch (error) {
    console.error('マップ更新エラー:', error);
    return NextResponse.json(
      { error: 'マップの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// マップを削除
export async function DELETE(
  _request: NextRequest,
  context: { params: { mapId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    // マップが存在し、ユーザーが所有しているか確認
    const { data: existingMap, error: getError } = await supabaseAdmin
      .from('maps')
      .select('id, user_id')
      .eq('map_id', context.params.mapId)
      .single();

    if (getError || !existingMap) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
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
      throw error;
    }

    return NextResponse.json(
      { message: 'マップが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('マップ削除エラー:', error);
    return NextResponse.json(
      { error: 'マップの削除に失敗しました' },
      { status: 500 }
    );
  }
}