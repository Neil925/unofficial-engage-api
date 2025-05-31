export interface EventData {
  id: number;
  title: string;
  date: Date;
  location: string;
  img: string;
  clubs: Club[];
}

//before and after are UTC SECONDS.
export interface RequestBody {
  pastEvents?: boolean;
  after?: number;
  before?: number;
}

export interface Club {
  club_id: string;
  club_name?: string;
}
