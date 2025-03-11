// types/map-types.ts

export type Pin = {
    id: string;
    floor_id: string;
    title: string;
    description: string;
    x_position: number;
    y_position: number;
    created_at?: string;
    updated_at?: string;
    _updating?: boolean;
    _temp?: boolean;
  };
  
  export type Floor = {
    id: string;
    map_id: string;
    floor_number: number;
    name: string;
    image_url: string | null;
    created_at?: string;
    updated_at?: string;
  };
  
  export type MapData = {
    id: string;
    map_id: string;
    title: string;
    description: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
  };