// app/api/maps/[mapId]/floors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// 特定のマップのエリア一覧を取得
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await context.params;
    
    // マップIDからマップレコードを取得
    const { data: map } = await supabaseAdmin
      .from('maps')
      .select('id')
      .eq('map_id', mapId)
      .single();

    if (!map) {
      return NextResponse.json(
        { error: 'マップが見つかりません' },
        { status: 404 }
      );
    }

    // エリア一覧を取得
    const { data: floors, error } = await supabaseAdmin
      .from('floors')
      .select('*')
      .eq('map_id', map.id)
      .order('floor_number', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(floors);
  } catch (error) {
    console.error('エリアの取得エラー:', error);
    return NextResponse.json(
      { error: 'エリアの取得に失敗しました' },
      { status: 500 }
    );
  }
}
// エリアを作成
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ mapId: string }> }
) {
  const session = await auth();
  const { mapId } = await context.params;
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const { floor_number, name } = await request.json();

    if (floor_number === undefined || !name) {
      return NextResponse.json(
        { error: '階数と名前は必須です' },
        { status: 400 }
      );
    }

    // マップが存在し、現在のユーザーが所有しているか確認
    const { data: map, error: mapError } = await supabaseAdmin
      .from('maps')
      .select('id, user_id')
      .eq('map_id', mapId)
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

    // エリアの作成
    const { data: floor, error } = await supabaseAdmin
      .from('floors')
      .insert([
        {
          map_id: map.id,
          floor_number,
          name
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(floor, { status: 201 });
  } catch (error) {
    console.error('エリアの作成エラー:', error);
    return NextResponse.json(
      { error: 'エリアの作成に失敗しました' },
      { status: 500 }
    );
  }
}