// app/api/floors/[floorId]/pins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// 特定のエリアのピン一覧を取得
export async function GET(
  _request: NextRequest,
  context: { params: { floorId: string } }
) {
  try {
    const { floorId } = await context.params;
    
    const { data: pins, error } = await supabaseAdmin
      .from('pins')
      .select('*')
      .eq('floor_id', floorId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(pins);
  } catch (error) {
    console.error('ピンの取得エラー:', error);
    return NextResponse.json(
      { error: 'ピンの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ピンを作成
export async function POST(
  request: NextRequest,
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
    const { title, description, x_position, y_position } = await request.json();

    if (!title || x_position === undefined || y_position === undefined) {
      return NextResponse.json(
        { error: 'タイトルと位置情報は必須です' },
        { status: 400 }
      );
    }

    // エリアが存在し、現在のユーザーが所有しているか確認
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
        { error: 'このマップを編集する権限がありません' },
        { status: 403 }
      );
    }

    // ピンの作成
    const { data: pin, error } = await supabaseAdmin
      .from('pins')
      .insert([
        {
          floor_id: floorId,
          title,
          description,
          x_position,
          y_position
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(pin, { status: 201 });
  } catch (error) {
    console.error('ピンの作成エラー:', error);
    return NextResponse.json(
      { error: 'ピンの作成に失敗しました' },
      { status: 500 }
    );
  }
}