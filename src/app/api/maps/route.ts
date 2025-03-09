// app/api/maps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// マップ一覧取得
export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const { data: maps, error } = await supabaseAdmin
      .from('maps')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('マップ取得エラー:', error);
      throw error;
    }

    return NextResponse.json(maps);
  } catch (error) {
    console.error('マップの取得エラー:', error);
    return NextResponse.json(
      { error: 'マップの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// マップ作成
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    );
  }

  try {
    const { map_id, title, description } = await request.json();

    if (!map_id || !title) {
      return NextResponse.json(
        { error: 'マップIDとタイトルは必須です' },
        { status: 400 }
      );
    }

    // マップIDの重複チェック
    const { data: existingMap } = await supabaseAdmin
      .from('maps')
      .select('id')
      .eq('map_id', map_id)
      .maybeSingle();

    if (existingMap) {
      return NextResponse.json(
        { error: 'このマップIDは既に使用されています' },
        { status: 400 }
      );
    }

    // マップの作成
    const { data: map, error } = await supabaseAdmin
      .from('maps')
      .insert([
        {
          map_id,
          title,
          description,
          user_id: session.user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('マップ作成エラー:', error);
      throw error;
    }

    return NextResponse.json(map, { status: 201 });
  } catch (error) {
    console.error('マップの作成エラー:', error);
    return NextResponse.json(
      { error: 'マップの作成に失敗しました' },
      { status: 500 }
    );
  }
}