import React from "react";

import { Card } from "@/components/ui/card";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import { Row } from "@/components/manager/groups/ui/Row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Lead } from "@/store/leads/lead.type";
import { LeadStatusEnum } from "@/store/leads/lead.type";
import { LEAD_STATUS_LABELS } from "@/store/leads/lead.label";
import { LeadUpsertDialog } from "@/components/manager/leads/add-edit-lead/page";
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

function labelFromMap<T extends string>(map: Partial<Record<T, string>>, key: string | null): string {
    if (!key) return "Немає";
    const k = key as T;
    return map[k] ?? key;
}

export function LeadsTab({
                             leadsData,
                             leadsLoading,
                             leadsPage,
                             leadsPageSize,
                             setLeadsPage,
                             leadSearch,
                             setLeadSearch,
                             leadStatus,
                             setLeadStatus,
                             onDeleteLead,
                             formatDateTime,
                         }: {
    leadsData: any;
    leadsLoading: boolean;
    leadsPage: number;
    leadsPageSize: number;
    setLeadsPage: (v: number) => void;
    leadSearch: string;
    setLeadSearch: (v: string) => void;
    leadStatus: LeadStatusEnum | "all";
    setLeadStatus: (v: LeadStatusEnum | "all") => void;
    onDeleteLead: (id: number) => Promise<void>;
    formatDateTime: (v: unknown) => string;
}) {
    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Пошук</Label>
                        <Input
                            className="h-11"
                            placeholder="Ім'я, email, телефон, source, notes..."
                            value={leadSearch}
                            onChange={(e) => {
                                setLeadsPage(1);
                                setLeadSearch(e.target.value);
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Статус</Label>
                        <Select
                            value={leadStatus}
                            onValueChange={(v) => {
                                setLeadsPage(1);
                                setLeadStatus(v as LeadStatusEnum | "all");
                            }}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Усі" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Усі</SelectItem>
                                {Object.values(LeadStatusEnum).map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {labelFromMap(LEAD_STATUS_LABELS, s)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="hidden md:block" />
                </div>
            </Card>

            <ResponsiveList
                data={leadsData}
                isLoading={leadsLoading}
                page={leadsPage}
                pageSize={leadsPageSize}
                onPageChange={setLeadsPage}
                getId={(x: Lead) => x.id}
                header={
                    <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 gap-3 text-sm text-muted-foreground">
                        <div className="min-w-0">Ім&apos;я</div>
                        <div className="hidden xl:block min-w-0">Контакти</div>
                        <div className="hidden xl:block min-w-0">Місто</div>
                        <div className="hidden xl:block min-w-0">Статус</div>
                        <div className="hidden xl:block min-w-0">Менеджер</div>
                        <div className="hidden xl:block min-w-0">Нотатки</div>
                        <div className="text-right xl:text-center shrink-0">Дії</div>
                    </Card>
                }
                renderRow={(l: Lead, open, onToggle) => {
                    const statusRaw = firstString(l.status) ?? "new";
                    const status = statusRaw as LeadStatusEnum;

                    return (
                        <Card onClick={onToggle} className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 gap-3 items-center cursor-pointer">
                            <div className="font-medium min-w-0 truncate" title={safe(l.name)}>
                                {safe(l.name)}
                            </div>

                            <div className="hidden xl:block min-w-0 break-all">
                                <div className="truncate" title={safe(l.email)}>{safe(l.email)}</div>
                                <div className="truncate" title={safe(l.phone)}>{safe(l.phone)}</div>
                            </div>

                            <div className="hidden xl:block min-w-0 truncate" title={safe(l.city)}>
                                {safe(l.city)}
                            </div>

                            <div className="hidden xl:block min-w-0 truncate" title={LEAD_STATUS_LABELS[status] ?? "Немає"}>
                                {LEAD_STATUS_LABELS[status] ?? "Немає"}
                            </div>

                            <div className="hidden xl:block min-w-0 truncate" title={safe(l.manager?.full_name)}>
                                {safe(l.manager?.full_name)}
                            </div>

                            <div className="hidden xl:block min-w-0">
                                {safe(l.notes) === "Немає" ? (
                                    <div className="truncate text-muted-foreground">Немає</div>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="truncate cursor-pointer" title={safe(l.notes)}>
                                                {safe(l.notes)}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={6} className="max-w-xs break-words text-left">
                                            {safe(l.notes)}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>

                            <div
                                className="flex justify-end xl:justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ActionsDropdown
                                    items={[
                                        {
                                            key: "edit",
                                            label: "",
                                            content: (
                                                <LeadUpsertDialog
                                                    initial={l}
                                                    trigger={
                                                        <div className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none">
                                                            Редагувати
                                                        </div>
                                                    }
                                                />
                                            ),
                                        },
                                        {
                                            key: "delete",
                                            label: "Видалити",
                                            destructive: true,
                                            onClick: () => {
                                                void onDeleteLead(l.id);
                                            },
                                        },
                                    ]}
                                />
                            </div>
                        </Card>
                    );
                }}
                renderMobileDetails={(l: Lead) => {
                    const statusRaw = firstString(l.status) ?? "new";
                    const status = statusRaw as LeadStatusEnum;

                    return (
                        <div className="space-y-3">
                            <Row label="Email" value={safe(l.email)} />
                            <Row label="Телефон" value={safe(l.phone)} />
                            <Row label="Місто" value={safe(l.city)} />
                            <Row label="Джерело" value={safe(l.source)} />
                            <Row label="Статус" value={LEAD_STATUS_LABELS[status] ?? "Немає"} />
                            <Row label="Менеджер" value={safe(l.manager?.full_name)} />
                            <Row label="Оновлено" value={formatDateTime(l.updated_at)} />
                            <Row label="Нотатки" value={safe(l.notes)} />
                        </div>
                    );
                }}
            />
        </div>
    );
}
