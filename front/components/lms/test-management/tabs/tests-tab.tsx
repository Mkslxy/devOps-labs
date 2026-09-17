import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HeaderSection } from "../header-section";
import { ListState } from "../list-state";
import { SelectedRow } from "../selected-row";
import {StatusDaeEnum, TestVersionUpdatePayload} from "@/store/test-management/test-management.type";
import {VersionStatusMenu} from "@/components/lms/test-management/test-versions/status/version-status-menu";
import {useState} from "react";
import {EditTestVersionDialog} from "../dialog/edit-test-version/page";
import {DeleteTestVersionDialog} from "@/components/lms/test-management/dialog/delete-test-version/page";
import { DeleteTestDialog } from "@/components/lms/test-management/dialog/delete-test/page";

type Props = {
    tests: any[];
    testsLoading?: boolean;
    selectedTestId: number | null;
    onSelectTest: (id: number) => void;

    versions: any[];
    versionsLoading?: boolean;
    selectedVersionId: number | null;
    onSelectVersion: (id: number | null) => void;

    selectedTest: any | null;
    versionDetail: any | null;
    versionDetailLoading?: boolean;

    onCreateTest?: () => void;
    onEditTest?: () => void;
    onCreateVersion?: () => void;
    onAddQuestions?: () => void;
    creatingVersion?: boolean;

    onPatchTestVersion?: (id: number, data: Partial<TestVersionUpdatePayload>) => Promise<void> | void;
    onDeleteTestVersion?: (id: number) => Promise<void> | void;

    patchingTestVersion?: boolean;
    deletingTestVersion?: boolean;

    onDeleteTest?: (id: number) => Promise<void> | void;
    deletingTest?: boolean;
};

export function TestsTab({
                             tests,
                             testsLoading,
                             selectedTestId,
                             onSelectTest,

                             versions,
                             versionsLoading,
                             selectedVersionId,
                             onSelectVersion,

                             onCreateTest,
                             onEditTest,

                             selectedTest,
                             versionDetail,
                             versionDetailLoading,

                             onCreateVersion,
                             onAddQuestions,
                             creatingVersion,

                             onPatchTestVersion,
                             onDeleteTestVersion,

                             patchingTestVersion,
                             deletingTestVersion,

                             onDeleteTest,
                             deletingTest,
                         }: Props) {
    const selectedVersion = versions.find((v) => v.id === selectedVersionId);
    const selectedVersionStatus = selectedVersion?.status as StatusDaeEnum | undefined;
    const isDraftVersion =
        !!selectedVersionId && selectedVersionStatus === StatusDaeEnum.draft;

    const isEditVersionLocked = !isDraftVersion;
    const isDeleteVersionLocked = !isDraftVersion;
    const isQuestionsLocked = !isDraftVersion;

    const [editVersionOpen, setEditVersionOpen] = useState(false);
    const [deleteVersionOpen, setDeleteVersionOpen] = useState(false);
    const [activeVersion, setActiveVersion] = useState<any | null>(null);
    const [deleteTestOpen, setDeleteTestOpen] = useState(false);


    const hasDraftVersion = versions.some(
        (v) => (v.status as StatusDaeEnum) === StatusDaeEnum.draft
    );

    const isCreateVersionLocked = !selectedTest || creatingVersion || hasDraftVersion;

    const openEditVersion = (v: any) => {
        if (!v || isEditVersionLocked) return;
        setActiveVersion(v);
        setEditVersionOpen(true);
    };

    const openDeleteVersion = (v: any) => {
        if (!v || isDeleteVersionLocked) return;
        setActiveVersion(v);
        setDeleteVersionOpen(true);
    };

    const handleConfirmDeleteVersion = async () => {
        if (!activeVersion?.id) return;
        await onDeleteTestVersion?.(activeVersion.id);
        setDeleteVersionOpen(false);
        setActiveVersion(null);
    };

    const handleConfirmDeleteTest = async () => {
        if (!selectedTest?.id) return;
        await onDeleteTest?.(selectedTest.id);
        setDeleteTestOpen(false);
    };

    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4">
                <HeaderSection
                    title="Список тестів"
                    description={`${tests.length} шт.`}
                    actionLabel="Тест"
                    actionIcon={<Plus className="w-4 h-4 mr-2" />}
                    onAction={onCreateTest}

                    onEdit={onEditTest}
                    editDisabled={!selectedTest}

                    onDelete={() => setDeleteTestOpen(true)}
                    deleteDisabled={!selectedTest || !!deletingTest}
                >
                    <ScrollArea className="h-[520px]">
                        <div className="p-3 flex flex-col gap-2">
                            <ListState
                                loading={testsLoading}
                                empty={!testsLoading && tests.length === 0}
                                emptyText="Нічого не знайдено."
                                loadingText="Завантаження тестів..."
                            >
                                {tests.map((t) => {
                                    return (
                                        <SelectedRow
                                            key={t.id}
                                            active={t.id === selectedTestId}
                                            onSelect={() => onSelectTest(t.id)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">{t.title}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {t.description ?? "Немає"}
                                                    </div>
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        Поточна версія: #{t.current_version?.id ?? "Немає"}
                                                    </div>
                                                </div>
                                            </div>
                                        </SelectedRow>
                                    );
                                })}
                            </ListState>
                        </div>
                    </ScrollArea>
                </HeaderSection>
            </div>

            <div className="col-span-12 lg:col-span-8 rounded-xl border bg-background">
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row  justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-sm font-medium">Деталі тесту</div>
                            <div className="text-lg font-semibold truncate">
                                {selectedTest ? selectedTest.title : "Оберіть тест"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {selectedTest?.description ?? "Немає"}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2 md:gap-0 space-x-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => openEditVersion(selectedVersion)}
                                disabled={isEditVersionLocked || !selectedVersion}
                                title={
                                    !selectedVersionId
                                        ? "Спочатку оберіть версію"
                                        : selectedVersionStatus !== StatusDaeEnum.draft
                                            ? "Редагування питань доступне лише для чернетки"
                                            : undefined
                                }
                            >
                                Редагувати
                            </Button>

                           <div className="flex flex-col md:flex-row lg:flex-col 2xl:flex-row gap-2">
                               <Button
                                   size="sm"
                                   variant="destructive"
                                   className="cursor-pointer"
                                   onClick={() => openDeleteVersion(selectedVersion)}
                                   disabled={isEditVersionLocked || !selectedVersion}
                                   title={
                                       !selectedVersionId
                                           ? "Спочатку оберіть версію"
                                           : selectedVersionStatus !== StatusDaeEnum.draft
                                               ? "Доступно лише для чернетки"
                                               : undefined
                                   }
                               >
                                   Видалити
                               </Button>

                               <Button
                                   size="sm"
                                   onClick={onCreateVersion}
                                   className="cursor-pointer"
                                   disabled={isCreateVersionLocked}
                                   title={
                                       hasDraftVersion
                                           ? "У цього тесту вже є чернетка. Спочатку опублікуйте або заархівуйте її."
                                           : undefined
                                   }
                               >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Нова версія
                               </Button>
                           </div>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="text-sm font-medium">Версії</div>
                        <div className="text-xs text-muted-foreground">
                            Старі версії зберігаються назавжди.
                        </div>
                    </div>

                    <ListState loading={versionsLoading} empty={!versionsLoading && versions.length === 0} emptyText="Немає версій" loadingText="Завантаження версій...">
                        <div className="grid gap-2">
                            {versions.map((v) => (
                                <SelectedRow
                                    key={v.id}
                                    active={v.id === selectedVersionId}
                                    onSelect={() => onSelectVersion(v.id)}
                                >
                                    <div className="flex flex-col items-start md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex flex-col md:items-center  md:flex-row lg:items-baseline lg:flex-col xl:flex-row gap-3 min-w-0">
                                            <Badge variant="outline" className="rounded-full">
                                                #{v.id}
                                            </Badge>
                                            <div className="text-sm flex flex-col md:flex-row lg:flex-col xl:flex-row space-x-1 font-medium truncate">
                                                <div className="flex flex-row gap-1">Час: {v.time_limit_minutes ?? "Немає"}{v.time_limit_minutes != null && " хв"} <span className="hidden md:block lg:hidden xl:block">|</span></div>
                                                <div>Процент проходження: {v.passing_score_percent}%</div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Випадковість: {v.is_random_order ? "Так" : "Ні"}
                                            </div>
                                        </div>

                                        <VersionStatusMenu
                                            versionId={v.id}
                                            status={v.status as StatusDaeEnum}
                                            disabled={(v.status as StatusDaeEnum) === StatusDaeEnum.published}
                                        />
                                    </div>
                                </SelectedRow>
                            ))}
                        </div>
                    </ListState>

                    <Separator />

                    <div className="flex flex-col md:flex-row justify-between gap-2">
                        <div className="min-w-0 text-left">
                            <div className="text-sm font-medium">
                                Редактор версії #{selectedVersionId ?? "Немає"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                               Керуємо складом питань у версії.
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={onAddQuestions}
                            disabled={isQuestionsLocked}
                            title={
                                selectedVersionStatus === StatusDaeEnum.published
                                    ? "Не можна змінювати питання у опублікованій версії"
                                    : undefined
                            }
                        >
                            Додати питання
                        </Button>
                    </div>

                    <div className="rounded-xl border bg-card">
                        <div className="p-3 flex items-center justify-between">
                            <div className="text-sm font-medium">Питання у версії</div>
                            <Badge variant="secondary" className="rounded-full">
                                {versionDetail?.questions?.length ?? 0}
                            </Badge>
                        </div>
                        <Separator />

                        <ListState
                            loading={versionDetailLoading}
                            empty={!versionDetailLoading && (versionDetail?.questions?.length ?? 0) === 0}
                            emptyText="Питань ще немає."
                        >
                            <div className="p-3 grid gap-2">
                                {(versionDetail?.questions ?? []).map((qq: any) => (
                                    <div key={qq.id} className="rounded-lg border bg-background px-3 py-2">
                                        <div className="text-sm font-medium truncate">{qq.text}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {qq.type} • {qq.points} б.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ListState>
                    </div>
                </div>
            </div>

            <EditTestVersionDialog
                open={editVersionOpen}
                onOpenChange={setEditVersionOpen}
                version={activeVersion}
                loading={!!patchingTestVersion}
                onSubmit={(id, data) => onPatchTestVersion?.(id, data)}
            />

            <DeleteTestVersionDialog
                open={deleteVersionOpen}
                onOpenChange={setDeleteVersionOpen}
                versionId={activeVersion?.id ?? null}
                loading={!!deletingTestVersion}
                onConfirm={handleConfirmDeleteVersion}
            />

            <DeleteTestDialog
                open={deleteTestOpen}
                onOpenChange={setDeleteTestOpen}
                testTitle={selectedTest?.title}
                disabled={!!deletingTest}
                onConfirm={handleConfirmDeleteTest}
            />
        </div>
    );
}
