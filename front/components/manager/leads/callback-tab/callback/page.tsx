import React, { useState } from "react";

import { Card } from "@/components/ui/card";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import { Row } from "@/components/manager/groups/ui/Row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/libs/utils";

import type { CallBack } from "@/store/leads/lead.type";
import { CallBackRequestStatusEnum, ContactPreferenceEnum } from "@/store/leads/lead.type";
import { CALLBACK_PREFERENCE_LABELS, CALLBACK_REQUEST_LABELS } from "@/store/leads/lead.label";
import { EditCallbackDialog } from "@/components/manager/leads/add-comment-callback/page";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import ActionsDropdown from "@/components/ui/actions-dropdown";


function safe(v: unknown): string {
    if (typeof v === "string" && v.trim()) return v;
    return "Немає";
}

function firstString(v: unknown): string | null {
    if (Array.isArray(v)) {
        const x = v[0];
        return typeof x === "string" && x.trim() ? x : null;
    }
    if (typeof v === "string" && v.trim()) return v;
    return null;
}

function getCallbackStatus(c: CallBack): CallBackRequestStatusEnum | null {
    const raw = firstString(c.status);
    if (!raw) return null;
    const allowed = new Set<string>(Object.values(CallBackRequestStatusEnum));
    return allowed.has(raw) ? (raw as CallBackRequestStatusEnum) : null;
}

function getCallbackCardTone(status: CallBackRequestStatusEnum | null): string {
    if (!status) return "";
    if (status === CallBackRequestStatusEnum.rejected) return "border border-destructive/30 bg-destructive/5 opacity-80";
    if (status === CallBackRequestStatusEnum.archived) return "opacity-60 grayscale";
    return "";
}

export function CallbacksTab({
                                 cbData,
                                 cbLoading,
                                 cbPage,
                                 cbPageSize,
                                 setCbPage,
                                 cbSearch,
                                 setCbSearch,
                                 cbStatus,
                                 setCbStatus,
                                 isCallbackBusy,
                                 converting,
                                 onConvertAndRemove,
                                 onDeleteCallback,
                                 formatDateTime,
                             }: {
    cbData: any;
    cbLoading: boolean;
    cbPage: number;
    cbPageSize: number;
    setCbPage: (v: number) => void;
    cbSearch: string;
    setCbSearch: (v: string) => void;
    cbStatus: CallBackRequestStatusEnum | "all";
    setCbStatus: (v: CallBackRequestStatusEnum | "all") => void;

    isCallbackBusy: boolean;
    converting: boolean;

    onConvertAndRemove: (id: number) => Promise<void>;
    onDeleteCallback: (id: number) => Promise<void>;
    onUpdateOnlyStatus: (c: CallBack, next: CallBackRequestStatusEnum) => Promise<void>;

    formatDateTime: (v: unknown) => string;
}) {
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<CallBack | null>(null);

    return (
        <div className="space-y-4">
            <EditCallbackDialog
                open={editOpen}
                onOpenChange={(v) => {
                    setEditOpen(v);
                    if (!v) setEditing(null);
                }}
                callback={editing}
            />

            <Card className="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Пошук</Label>
                        <Input
                            className="h-11"
                            placeholder="Ім'я, email, телефон..."
                            value={cbSearch}
                            onChange={(e) => {
                                setCbPage(1);
                                setCbSearch(e.target.value);
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Статус</Label>
                        <Select
                            value={cbStatus}
                            onValueChange={(v) => {
                                setCbPage(1);
                                setCbStatus(v as CallBackRequestStatusEnum | "all");
                            }}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Усі" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Усі</SelectItem>
                                {Object.values(CallBackRequestStatusEnum).map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {CALLBACK_REQUEST_LABELS[s] ?? s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="hidden md:block" />
                </div>
            </Card>

            <ResponsiveList
                data={cbData}
                isLoading={cbLoading}
                page={cbPage}
                pageSize={cbPageSize}
                onPageChange={setCbPage}
                getId={(x: CallBack) => x.id}
                header={
                    <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 gap-3 text-sm text-muted-foreground">
                        <div className="min-w-0">Клієнт</div>
                        <div className="hidden xl:block min-w-0">Контакти</div>
                        <div className="hidden xl:block min-w-0">Місто</div>
                        <div className="hidden xl:block min-w-0">Перевага</div>
                        <div className="hidden xl:block min-w-0">Статус</div>
                        <div className="hidden xl:block min-w-0">Коментар менеджера</div>
                        <div className="text-right xl:text-center shrink-0">Дії</div>
                    </Card>
                }
                renderRow={(c: CallBack, open, onToggle) => {
                    const prefRaw = firstString(c.contact_preference);
                    const pref = (prefRaw as ContactPreferenceEnum | null) ?? null;

                    const otherPref = firstString((c as any).other_contact_preference);

                    const status = getCallbackStatus(c);
                    const isConverted = status === CallBackRequestStatusEnum.converted;

                    const tone = getCallbackCardTone(status);
                    const statusLabel = status ? (CALLBACK_REQUEST_LABELS[status] ?? status) : "Немає";

                    const preferenceText =
                        pref === ContactPreferenceEnum.other
                            ? safe(otherPref)
                            : pref
                                ? CALLBACK_PREFERENCE_LABELS[pref]
                                : "Немає";

                    return (
                        <Card
                            onClick={isConverted ? undefined : onToggle}
                            className={cn(
                                "px-4 py-3 grid grid-cols-2 xl:grid-cols-7 gap-3 items-center",
                                isConverted ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer",
                                tone
                            )}
                        >
                            <div className="font-medium min-w-0 truncate" title={safe(c.full_name)}>
                                {safe(c.full_name)}
                            </div>

                            <div className="hidden xl:block min-w-0 break-all">
                                <div className="truncate" title={safe(c.email)}>
                                    {safe(c.email)}
                                </div>
                                <div className="truncate" title={safe(c.phone_normalized)}>
                                    {safe(c.phone_normalized) !== "Немає"
                                        ? safe(c.phone_normalized)
                                        : `${safe(c.phone_country_code)} ${safe(c.phone_national_number)}`}
                                </div>
                            </div>

                            <div className="hidden xl:block min-w-0 truncate" title={safe(c.city)}>
                                {safe(c.city)}
                            </div>

                            <div className="hidden xl:block min-w-0 truncate" title={preferenceText}>
                                {preferenceText}
                            </div>

                            <div className="hidden xl:block min-w-0 truncate" title={statusLabel}>
                                {statusLabel}
                            </div>

                            <div className="hidden xl:block w-[120px] min-w-0 truncate">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="truncate cursor-pointer">
                                            {safe(c.manager_comment)}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={6} className="max-w-xs break-words text-left">
                                        {safe(c.manager_comment)}
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            <div
                                className="flex justify-end xl:justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ActionsDropdown
                                    items={[
                                        {
                                            key: "convert",
                                            label: converting ? "Конвертуємо..." : "В лід",
                                            disabled: isCallbackBusy || isConverted,
                                            onClick: () => {
                                                void onConvertAndRemove(c.id);
                                            },
                                        },
                                        {
                                            key: "comment",
                                            label: "Коментар",
                                            disabled: isCallbackBusy || isConverted,
                                            onClick: () => {
                                                setEditing(c);
                                                setEditOpen(true);
                                            },
                                        },
                                        {
                                            key: "delete",
                                            label: "Видалити",
                                            destructive: true,
                                            disabled: isCallbackBusy || isConverted,
                                            onClick: () => {
                                                void onDeleteCallback(c.id);
                                            },
                                        },
                                    ]}
                                />
                            </div>
                        </Card>
                    );
                }}
                renderMobileDetails={(c: CallBack) => {
                    const prefRaw = firstString(c.contact_preference);
                    const pref = (prefRaw as ContactPreferenceEnum | null) ?? null;

                    const otherPref = firstString((c as any).other_contact_preference);

                    const preferenceText =
                        pref === ContactPreferenceEnum.other ? safe(otherPref) : pref ? CALLBACK_PREFERENCE_LABELS[pref] : "Немає";

                    const status = getCallbackStatus(c);
                    const statusLabel = status ? (CALLBACK_REQUEST_LABELS[status] ?? status) : "Немає";

                    return (
                        <div className="space-y-3">
                            <Row label="Email" value={safe(c.email)} />
                            <Row
                                label="Телефон"
                                value={
                                    safe(c.phone_normalized) !== "Немає"
                                        ? safe(c.phone_normalized)
                                        : `${safe(c.phone_country_code)} ${safe(c.phone_national_number)}`
                                }
                            />
                            <Row label="Місто" value={safe(c.city)} />
                            <Row label="Перевага" value={preferenceText} />
                            <Row label="Статус" value={statusLabel} />

                            <Row label="Сторінка" value={safe(c.callback_page)} />
                            <Row label="Оновлено" value={formatDateTime(c.updated_at)} />

                            <Row label="Коментар менеджера" value={safe(c.manager_comment)} />
                            <Row label="Повідомлення" value={safe(c.message)} />
                            <Row label="Інший контакт" value={safe(otherPref)} />
                        </div>
                    );
                }}
            />
        </div>
    );
}
