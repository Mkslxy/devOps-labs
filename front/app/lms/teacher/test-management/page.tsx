"use client";

import { Tabs, TabsContent} from "@/components/ui/tabs";
import { Card, CardContent} from "@/components/ui/card";

import {
    useGetTestsQuery,
    useGetTestVersionsQuery,
    useGetTestVersionByIdQuery,
    useGetQuestionsQuery,
    useGetTestAssignmentsQuery,
    useGetStudentResultsQuery,
    useCreateTestMutation,
    useUpdateTestMutation,
    useCreateTestVersionMutation,
    useDeleteTestAssignmentMutation,
    useDeleteTestMutation,
    usePatchTestVersionMutation, useDeleteTestVersionMutation,
} from "@/store/test-management/test-management.api";
import {useEffect, useMemo, useState} from "react";
import {TestsTab} from "@/components/lms/test-management/tabs/tests-tab";
import {QuestionsTab} from "@/components/lms/test-management/tabs/questions-tab";
import {ResultsTab} from "@/components/lms/test-management/tabs/results-tab";
import {AssignmentsTab} from "@/components/lms/test-management/tabs/assigments-tab";
import {PageHeader} from "@/components/lms/test-management/page-header";
import {TabsHeader} from "@/components/lms/test-management/tabs/tabs-header/tabs-header";
import {TestCreatePayload} from "@/store/test-management/test-management.type";
import {TestCreateDialog} from "@/components/lms/test-management/tests/dialog/create-test/page";
import {TestEditDialog} from "@/components/lms/test-management/tests/dialog/edit-test/page";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {useGetProfileMeQuery} from "@/store/users/user.api";
import {
  VersionQuestionsDialog
} from "@/components/lms/test-management/test-versions/dialog/add-edit-question-to-test-version/version-questions-dialog";

function useDebouncedValue<T>(value: T, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}

export default function Page() {
    const [tab, setTab] = useState<"tests" | "assignments" | "questions" | "results">("tests");
    const [globalQuery, setGlobalQuery] = useState("");
    const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);

    const debouncedQuery = useDebouncedValue(globalQuery, 350);

    const search = useMemo(() => {
        const q = debouncedQuery.trim();
        return q ? q : undefined;
    }, [debouncedQuery]);

    const { data: testsData, isLoading: testsLoading } = useGetTestsQuery({
        page: 1,
        search,
    });

    const { data: profileMe } = useGetProfileMeQuery();
    const { data: versionsData, isFetching: versionsLoading } = useGetTestVersionsQuery({ page: 1 , created_by: profileMe?.id, });
    const { data: versionDetail, isFetching: versionDetailLoading } = useGetTestVersionByIdQuery(selectedVersionId as number, { skip: !selectedVersionId });
    const { data: assignmentsData, isFetching: assignmentsLoading } = useGetTestAssignmentsQuery({ page: 1 , created_by: profileMe?.id,});
    const { data: questionsData, isFetching: questionsLoading } = useGetQuestionsQuery({ page: 1 , page_size: 10 , created_by: profileMe?.id,});
    const { data: resultsData, isFetching: resultsLoading } = useGetStudentResultsQuery({ page: 1 });
    const [createTest, { isLoading: isCreating }] = useCreateTestMutation();
    const [updateTest, { isLoading: isUpdating }] = useUpdateTestMutation();
    const [createTestVersion, { isLoading: isCreatingVersion }] = useCreateTestVersionMutation();
    const [deleteTest, { isLoading: deletingTest }] = useDeleteTestMutation();
    const [deleteAssignment, del] = useDeleteTestAssignmentMutation();
    const [patchTestVersion, { isLoading: patchingTestVersion }] = usePatchTestVersionMutation();
    const [deleteTestVersion, { isLoading: deletingTestVersion }] = useDeleteTestVersionMutation();

    const handleDelete = async (id: number) => {
        await deleteAssignment(id).unwrap();
        toast.success("Призначення видалено");
    };

    const router = useRouter();


    const tests = testsData?.results ?? [];

    const selectedTest = useMemo(() => {
        return selectedTestId ? tests.find((t) => t.id === selectedTestId) ?? null : null;
    }, [tests, selectedTestId]);

    const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
    const [isEditTestOpen, setIsEditTestOpen] = useState(false);

    const handleCreateTest = async (payload: TestCreatePayload) => {
        await createTest(payload).unwrap();
    };

    const handleUpdateTest = async (payload: TestCreatePayload & { id: number }) => {
        await updateTest({ id: payload.id, data: { title: payload.title, description: payload.description } }).unwrap();
    };

    const versions = useMemo(() => {
        const all = versionsData?.results ?? [];
        return selectedTestId ? all.filter(v => v.test === selectedTestId) : [];
    }, [versionsData, selectedTestId]);

    const handleCreateVersion = async () => {
        if (!selectedTestId) return;

        try {
            const newVersion = await createTestVersion(selectedTestId).unwrap();
            setSelectedVersionId(newVersion.id);
        } catch (e: any) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!selectedTestId) return;
        const exists = tests.some((t) => t.id === selectedTestId);
        if (!exists) {
            setSelectedTestId(null);
            setSelectedVersionId(null);
        }
    }, [tests, selectedTestId]);

    return (
        <div className="flex flex-col gap-4 sm:px-6 bg-muted/20">
            <Card className="rounded-2xl w-full">
                <PageHeader
                    title="Управління тестами"
                    subtitle="Тести, версії, питання, призначення та перевірка."
                    query={globalQuery}
                    onQueryChange={setGlobalQuery}
                    onCreate={() => {}}
                />

                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                    <TabsHeader query={globalQuery} onQueryChange={setGlobalQuery} />

                    <CardContent className="pt-0">
                        <TabsContent value="tests">
                            <TestsTab
                                tests={tests}
                                testsLoading={testsLoading}
                                selectedTestId={selectedTestId}
                                onSelectTest={(id) => {
                                    setSelectedTestId(id);
                                    setSelectedVersionId(null);
                                }}
                                versions={versions}
                                versionsLoading={versionsLoading}
                                selectedVersionId={selectedVersionId}
                                onSelectVersion={setSelectedVersionId}
                                versionDetail={versionDetail}
                                versionDetailLoading={versionDetailLoading}
                                selectedTest={selectedTest}
                                onCreateTest={() => setIsCreateTestOpen(true)}
                                onEditTest={() => {
                                    if (!selectedTestId) return;
                                    setIsEditTestOpen(true);
                                }}
                                onCreateVersion={handleCreateVersion}
                                onAddQuestions={() => {
                                    if (!selectedVersionId) return;
                                    setIsQuestionsDialogOpen(true);
                                }}
                                creatingVersion={isCreatingVersion}
                                onDeleteTest={async (id) => {await deleteTest(id).unwrap();setSelectedTestId(null);setSelectedVersionId(null);}}
                                deletingTest={deletingTest}
                                onPatchTestVersion={async (id, data) => {await patchTestVersion({ id, data }).unwrap();}}
                                patchingTestVersion={patchingTestVersion}
                                onDeleteTestVersion={async (id) => {
                                    await deleteTestVersion(id).unwrap();
                                    if (selectedVersionId === id) setSelectedVersionId(null);
                                }}
                                deletingTestVersion={deletingTestVersion}
                            />
                        </TabsContent>

                        <TabsContent value="assignments">
                            <AssignmentsTab
                                assignments={assignmentsData?.results ?? []}
                                loading={assignmentsLoading}
                                onDelete={handleDelete}
                                deletingId={typeof del.originalArgs === "number" ? del.originalArgs : null}
                            />
                        </TabsContent>

                        <TabsContent value="questions">
                            <QuestionsTab
                                questions={questionsData?.results ?? []}
                                loading={questionsLoading}
                            />
                        </TabsContent>

                        <TabsContent value="results">
                            <ResultsTab
                                results={resultsData?.results ?? []}
                                loading={resultsLoading}
                                onOpen={(id) => router.push(`/lms/teacher/test-management/results/${id}`)}
                            />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

            <TestCreateDialog
                open={isCreateTestOpen}
                onOpenChange={setIsCreateTestOpen}
                onSubmit={handleCreateTest}
                isSubmitting={isCreating}
            />

            <TestEditDialog
                open={isEditTestOpen}
                onOpenChange={setIsEditTestOpen}
                test={selectedTest}
                onSubmit={handleUpdateTest}
                isSubmitting={isUpdating}
            />

            <VersionQuestionsDialog
                open={isQuestionsDialogOpen}
                onOpenChange={setIsQuestionsDialogOpen}
                versionId={selectedVersionId}
                versionQuestions={versionDetail?.questions ?? []}
            />

        </div>
    );
}

