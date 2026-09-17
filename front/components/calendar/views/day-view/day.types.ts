import {IEvent} from "@/components/calendar/interfaces";

export type PositionedEvent = {
    event: IEvent;
    top: number;
    height: number;
    left: number;
    width: number;
};
