"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import type { CallBack } from "@/store/leads/lead.type";
import { LeadStatusEnum, CallBackRequestStatusEnum } from "@/store/leads/lead.type";

import {
    useCreateLeadFromCallbackMutation,
    useDeleteCallbackRequestMutation,
    useDeleteLeadMutation,
    useGetCallbackRequestsQuery,
    useGetLeadsQuery,
    useUpdateCallbackRequestMutation,
} from "@/store/leads/lead.api";
import { LeadUpsertDialog } from "@/components/manager/leads/add-edit-lead/page";
import { LeadsTab } from "@/components/manager/leads/lead-tab/page";
import { CallbacksTab } from "@/components/manager/leads/callback-tab/callback/page";


export function formatDateTime(v: unknown): string {
    if (typeof v !== "string" || !v.trim()) return "Немає";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "Немає";
    return format(d, "dd.MM.yyyy HH:mm", { locale: uk });
}

export default function LeadsAndCallbacksPage() {
    const { toast } = useToast();
    const [tab, setTab] = useState<"leads" | "callbacks">("leads");

    const [leadsPage, setLeadsPage] = useState(1);
    const leadsPageSize = 10;

    const [cbPage, setCbPage] = useState(1);
    const cbPageSize = 10;

    const [leadStatus, setLeadStatus] = useState<LeadStatusEnum | "all">("all");
    const [leadSearch, setLeadSearch] = useState("");

    const [cbStatus, setCbStatus] = useState<CallBackRequestStatusEnum | "all">("all");
    const [cbSearch, setCbSearch] = useState("");

    const leadsParams = useMemo(
        () => ({
            page: leadsPage,
            page_size: leadsPageSize,
            ordering: "-created_at" as const,
            search: leadSearch || undefined,
            status: leadStatus === "all" ? undefined : leadStatus,
        }),
        [leadsPage, leadsPageSize, leadSearch, leadStatus]
    );

    const cbParams = useMemo(
        () => ({
            page: cbPage,
            page_size: cbPageSize,
            ordering: "-created_at" as const,
            search: cbSearch || undefined,
            status: cbStatus === "all" ? undefined : cbStatus,
        }),
        [cbPage, cbPageSize, cbSearch, cbStatus]
    );

    const { data: leadsData, isLoading: leadsLoading } = useGetLeadsQuery(leadsParams);
    const { data: cbData, isLoading: cbLoading } = useGetCallbackRequestsQuery(cbParams);

    const [deleteLead] = useDeleteLeadMutation();
    const [deleteCallback] = useDeleteCallbackRequestMutation();

    const [createLeadFromCallback, { isLoading: converting }] = useCreateLeadFromCallbackMutation();
    const [updateCallbackRequest, { isLoading: updatingCallback }] = useUpdateCallbackRequestMutation();

    const isCallbackBusy = converting || updatingCallback;

    const convertCallbackToLead = async (id: number) => {
        try {
            await createLeadFromCallback({ id }).unwrap();
            toast({ title: "Заявку конвертовано у лід" });
        } catch {
            toast({ title: "Не вдалося конвертувати", variant: "destructive" });
        }
    };

    const updateOnlyStatus = async (c: CallBack, next: CallBackRequestStatusEnum) => {
        if (next === CallBackRequestStatusEnum.converted) {
            await convertCallbackToLead(c.id);
            return;
        }

        try {
            await updateCallbackRequest({ id: c.id, data: { status: [next] } }).unwrap();
            toast({ title: "Статус оновлено" });
        } catch {
            toast({
                title: "Не вдалося оновити статус",
                variant: "destructive",
            });
        }
    };

    const handleDeleteLead = async (id: number) => {
        try {
            await deleteLead({ id }).unwrap();
            toast({ title: "Видалено" });
        } catch {
            toast({ title: "Не вдалося видалити", variant: "destructive" });
        }
    };

    const handleDeleteCallback = async (id: number) => {
        try {
            await deleteCallback({ id }).unwrap();
            toast({ title: "Видалено" });
        } catch {
            toast({ title: "Не вдалося видалити", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Ліди</h1>
                <LeadUpsertDialog trigger={<Button>+ Додати лід</Button>} />
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "leads" | "callbacks")}>
                <TabsList>
                    <TabsTrigger value="leads">Ліди</TabsTrigger>
                    <TabsTrigger value="callbacks">Заявки</TabsTrigger>
                </TabsList>

                <TabsContent value="leads">
                    <LeadsTab
                        leadsData={leadsData}
                        leadsLoading={leadsLoading}
                        leadsPage={leadsPage}
                        leadsPageSize={leadsPageSize}
                        setLeadsPage={setLeadsPage}
                        leadSearch={leadSearch}
                        setLeadSearch={setLeadSearch}
                        leadStatus={leadStatus}
                        setLeadStatus={setLeadStatus}
                        onDeleteLead={handleDeleteLead}
                        formatDateTime={formatDateTime}
                    />
                </TabsContent>

                <TabsContent value="callbacks">
                    <CallbacksTab
                        cbData={cbData}
                        cbLoading={cbLoading}
                        cbPage={cbPage}
                        cbPageSize={cbPageSize}
                        setCbPage={setCbPage}
                        cbSearch={cbSearch}
                        setCbSearch={setCbSearch}
                        cbStatus={cbStatus}
                        setCbStatus={setCbStatus}
                        isCallbackBusy={isCallbackBusy}
                        converting={converting}
                        onConvertAndRemove={convertCallbackToLead}
                        onDeleteCallback={handleDeleteCallback}
                        onUpdateOnlyStatus={updateOnlyStatus}
                        formatDateTime={formatDateTime}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
