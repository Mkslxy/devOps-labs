import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import type { CallBack, CallBackPayload } from "@/store/leads/lead.type";
import { CallBackRequestStatusEnum } from "@/store/leads/lead.type";
import { useUpdateCallbackRequestMutation } from "@/store/leads/lead.api";
import { useToast } from "@/hooks/use-toast";

function firstString(v: unknown): string | null {
    if (Array.isArray(v)) {
        const x = v[0];
        return typeof x === "string" && x.trim() ? x : null;
    }
    if (typeof v === "string" && v.trim()) return v;
    return null;
}

export function EditCallbackDialog({
                                       open,
                                       onOpenChange,
                                       callback,
                                   }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    callback: CallBack | null;
}) {
    const { toast } = useToast();
    const [updateCallback, { isLoading }] = useUpdateCallbackRequestMutation();

    const initialStatus = useMemo<CallBackRequestStatusEnum>(() => {
        const raw = callback ? firstString(callback.status) : null;
        const allowed = new Set<string>(Object.values(CallBackRequestStatusEnum));
        if (raw && allowed.has(raw)) return raw as CallBackRequestStatusEnum;
        return CallBackRequestStatusEnum.new;
    }, [callback]);

    const [status, setStatus] = useState<CallBackRequestStatusEnum>(CallBackRequestStatusEnum.new);
    const [managerComment, setManagerComment] = useState("");

    React.useEffect(() => {
        if (!callback) return;
        setStatus(initialStatus);
        setManagerComment(typeof callback.manager_comment === "string" ? callback.manager_comment : "");
    }, [callback, initialStatus]);

    if (!callback) return null;

    const onSave = async () => {
        const data: Partial<CallBackPayload> = {
            status: [status],
            manager_comment: managerComment.trim() || undefined,
        };

        try {
            await updateCallback({ id: callback.id, data }).unwrap();
            toast({ title: "Збережено" });
            onOpenChange(false);
        } catch {
            toast({
                title: "Не вдалося зберегти",
                description: "Спробуйте ще раз.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Додати коментар для менеджера</DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="manager_comment">Коментар менеджера</Label>
                        <Textarea
                            id="manager_comment"
                            value={managerComment}
                            onChange={(e) => setManagerComment(e.target.value)}
                            rows={5}
                            className="w-[300px] h-auto"
                            placeholder="Внутрішній коментар для менеджера..."
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Скасувати
                    </Button>
                    <Button onClick={onSave} disabled={isLoading}>
                        {isLoading ? "Зберігаємо..." : "Зберегти"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
