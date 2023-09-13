//before and after are UTC SECONDS.
export interface RequestBody {
    after?: number,
    before?: number
}

export interface EventData {
    id: number,
    img: string,
    title: string,
    date: number,
    location: string,
    club: string
}