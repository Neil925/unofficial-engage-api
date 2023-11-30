//before and after are UTC SECONDS.
export interface RequestBody {
    pastEvents?: boolean,
    after?: Number,
    before?: Number
}

export interface EventData {
    id: number,
    title: string,
    date: Date,
    location: string,
    img: string,
    clubs: Club[]
}

export interface Club {
    club_id: string,
    club_name?: string
}