//before and after are UTC SECONDS.
export interface RequestBody {
    after?: number,
    before?: number
}

export interface EventData {
    id: number,
    title: string,
    date: number,
    location: string,
    img: string,
    clubs: Club[]
}

export interface Club {
    club_id: string,
    club_name?: string
}

export interface EventsTable {
    id: number,
    title: string,
    date: number,
    location: string,
    img: string
}