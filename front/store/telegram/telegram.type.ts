export interface TelegramStartLink {
    link: string;
}

export interface TelegramBroadCastingPayload {
    message: string;
    files?: File[];
    roles?: string[];
    groups?: number[];
    users?: number[];
    user?: number;
}